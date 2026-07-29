import { del, get } from "@vercel/blob";
import { tokenSchema, uploadRequestSchema, MAX_ZIP_SIZE_BYTES } from "@/lib/validation";
import { extractZipSafely, ZipSecurityError } from "@/lib/zipExtractor";
import { pushFilesToRepo } from "@/lib/github";
import {
  getTokenFromRequest,
  safeLogError,
  isRateLimited,
  getClientIp,
  isTrustedOrigin,
  hasZipMagicBytes,
} from "@/lib/security";
import type { UploadProgressEvent } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

function sseLine(event: UploadProgressEvent) {
  return new TextEncoder().encode(JSON.stringify(event) + "\n");
}

export async function POST(req: Request) {
  // Validasi cepat di luar stream supaya request yang jelas-jelas invalid
  // (origin asing / rate limit / token salah format) langsung ditolak
  // dengan status code yang benar, bukan disamarkan jadi event SSE.
  if (!isTrustedOrigin(req)) {
    return new Response(JSON.stringify({ error: "Origin tidak diizinkan." }), { status: 403 });
  }

  const ip = getClientIp(req);
  if (isRateLimited(`upload:${ip}`, 10, 60_000)) {
    return new Response(JSON.stringify({ error: "Terlalu banyak permintaan. Coba lagi sebentar lagi." }), {
      status: 429,
    });
  }

  const token = getTokenFromRequest(req);
  if (!token) {
    return new Response(JSON.stringify({ error: "Header token tidak ditemukan." }), { status: 401 });
  }
  const tokenParsed = tokenSchema.safeParse(token);
  if (!tokenParsed.success) {
    return new Response(JSON.stringify({ error: "Format token tidak valid." }), { status: 400 });
  }

  let meta: ReturnType<typeof uploadRequestSchema.parse>;
  try {
    const raw = await req.json();
    meta = uploadRequestSchema.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: "Metadata request tidak valid." }), { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: UploadProgressEvent) => controller.enqueue(sseLine(e));
      let blobDeleted = false;

      const cleanupBlob = async () => {
        if (blobDeleted) return;
        blobDeleted = true;
        try {
          await del(meta.blobUrl);
        } catch (err) {
          // Tidak fatal — blob sementara ini toh tidak berisi kredensial,
          // hanya source code yang di-upload. Tetap dicatat untuk observability.
          safeLogError("api/upload:cleanup", err);
        }
      };

      try {
        // ---- 1. Ambil ZIP dari Vercel Blob (bukan dari body request) ----
        // Domain blobUrl sudah divalidasi ketat oleh trustedBlobUrlSchema
        // (lib/validation.ts) untuk mencegah SSRF sebelum sampai di sini.
        // Blob store bersifat PRIVATE, jadi URL-nya tidak bisa diakses
        // langsung — harus lewat get() yang terautentikasi (OIDC/
        // BLOB_READ_WRITE_TOKEN), bukan fetch() biasa.
        emit({ step: "validating", message: "Mengambil file ZIP dari penyimpanan sementara...", progress: 8 });

        let pathname: string;
        try {
          pathname = decodeURIComponent(new URL(meta.blobUrl).pathname.replace(/^\//, ""));
        } catch {
          throw new Error("URL blob tidak valid.");
        }

        const blobResult = await get(pathname, { access: "private" });
        if (!blobResult || blobResult.statusCode !== 200 || !blobResult.stream) {
          throw new Error("Gagal mengambil file ZIP dari penyimpanan sementara.");
        }

        const arrayBuffer = await new Response(blobResult.stream).arrayBuffer();
        const zipBuffer = Buffer.from(arrayBuffer);

        if (zipBuffer.length > MAX_ZIP_SIZE_BYTES) {
          throw new Error(`Ukuran file melebihi batas ${MAX_ZIP_SIZE_BYTES / 1024 / 1024} MB.`);
        }
        if (!hasZipMagicBytes(zipBuffer)) {
          throw new Error("File yang diunggah bukan arsip ZIP yang valid.");
        }

        emit({ step: "validating", message: "Berkas ZIP valid.", progress: 15 });

        // ---- 2. Ekstraksi aman di memori ----
        emit({ step: "extracting", message: "Mengekstrak file ZIP di memori...", progress: 22 });
        const { files, skipped } = await extractZipSafely(zipBuffer);

        emit({
          step: "filtering",
          message: `Selesai ekstraksi & filtering: ${files.length} file valid, ${skipped.length} dilewati.`,
          progress: 45,
          detail: { skipped: skipped.slice(0, 50), skippedCount: skipped.length },
        });

        // ---- 3. Push ke GitHub ----
        // repoFullNameSchema (lib/validation.ts) sudah memastikan formatnya
        // "owner/repo" lewat regex, jadi split ini secara logika selalu
        // menghasilkan 2 bagian. Tapi dengan `noUncheckedIndexedAccess` di
        // tsconfig, TypeScript tetap menganggap hasil destructuring array
        // bisa `undefined` — guard eksplisit ini yang menyelesaikannya.
        const [owner, repo] = meta.repoFullName.split("/");
        if (!owner || !repo) {
          throw new Error("Format repository tidak valid (owner/nama-repo).");
        }

        const result = await pushFilesToRepo({
          token: tokenParsed.data,
          owner,
          repo,
          branch: meta.branch,
          commitMessage: meta.commitMessage,
          files,
          createBranchIfMissing: meta.createBranchIfMissing,
          onProgress: (step, message, progress) => emit({ step, message, progress }),
        });

        emit({
          step: "done",
          message: "Push berhasil diselesaikan!",
          progress: 100,
          detail: { ...result, skippedFiles: skipped.slice(0, 50) },
        });
      } catch (err: unknown) {
        safeLogError("api/upload", err);
        const message =
          err instanceof ZipSecurityError
            ? err.message
            : err instanceof Error
            ? err.message
            : "Terjadi kesalahan tidak diketahui.";
        emit({ step: "error", message, progress: 0 });
      } finally {
        await cleanupBlob();
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Accel-Buffering": "no",
    },
  });
}
