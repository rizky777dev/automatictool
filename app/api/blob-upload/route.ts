import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { MAX_ZIP_SIZE_BYTES } from "@/lib/validation";
import { safeLogError, isRateLimited, getClientIp, isTrustedOrigin } from "@/lib/security";

export const runtime = "nodejs";

/**
 * Route ini HANYA bertugas menerbitkan token client-upload sementara agar
 * browser bisa mengirim file ZIP langsung ke Vercel Blob (bypass limit
 * body 4.5 MB milik Vercel Serverless Functions). File itu sendiri TIDAK
 * pernah melewati route ini — lihat dokumentasi:
 * https://vercel.com/docs/vercel-blob/client-upload
 *
 * Route ini publik (tidak ada sistem login di app ini), sehingga sengaja
 * TIDAK diberi kemampuan mem-push apa pun ke GitHub — itu baru mungkin
 * lewat /api/upload yang mewajibkan token PAT valid. Penyalahgunaan route
 * ini paling banter hanya bisa menaruh file ZIP kosong sementara di Blob
 * store, yang otomatis dibersihkan oleh /api/upload atau kedaluwarsa.
 * Tetap dibatasi dengan rate limiting + validasi origin + constraint
 * ukuran/tipe file di level Vercel Blob sebagai lapisan pertahanan.
 */
export async function POST(req: Request): Promise<NextResponse> {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  }

  const ip = getClientIp(req);
  if (isRateLimited(`blob-upload:${ip}`, 15, 60_000)) {
    return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi sebentar lagi." }, { status: 429 });
  }

  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("zip-uploads/")) {
          throw new Error("Lokasi upload tidak diizinkan.");
        }
        return {
          allowedContentTypes: ["application/zip", "application/x-zip-compressed", "application/octet-stream"],
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_ZIP_SIZE_BYTES,
        };
      },
      onUploadCompleted: async () => {
        // Sengaja dikosongkan: klien sudah mengetahui URL blob dari hasil
        // upload() secara langsung dan akan memicu proses ekstraksi+push
        // lewat /api/upload tanpa perlu menunggu webhook ini.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    safeLogError("api/blob-upload", err);
    return NextResponse.json({ error: "Gagal membuat sesi upload." }, { status: 400 });
  }
}
