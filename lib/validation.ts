import { z } from "zod";

/**
 * Token hanya divalidasi bentuknya (format), TIDAK PERNAH di-log isinya.
 * GitHub PAT classic: ghp_..., fine-grained: github_pat_...
 */
export const tokenSchema = z
  .string()
  .trim()
  .min(20, "Token terlalu pendek")
  .max(255, "Token terlalu panjang")
  .regex(/^(ghp_|github_pat_|gho_|ghu_|ghs_)[A-Za-z0-9_]+$/, "Format token GitHub tidak valid");

/**
 * Nama branch Git yang valid — menolak karakter berbahaya, spasi, dan
 * pola yang bisa dipakai untuk injection ke command Git internal Octokit.
 * Referensi: aturan penamaan branch resmi Git (git-check-ref-format).
 */
export const branchNameSchema = z
  .string()
  .trim()
  .min(1, "Nama branch wajib diisi")
  .max(250, "Nama branch terlalu panjang")
  .regex(
    /^(?!\/|.*\/\/|.*\.\.|.*@\{|.*\.lock$|.*[\\~^:?*\[\s])[A-Za-z0-9._/-]+(?<!\/|\.)$/,
    "Nama branch mengandung karakter tidak valid"
  );

/**
 * Commit message: batasi panjang & buang karakter kontrol / tag HTML mentah
 * untuk mencegah XSS ketika ditampilkan ulang di UI (log, result card).
 */
export const commitMessageSchema = z
  .string()
  .trim()
  .min(1, "Commit message wajib diisi")
  .max(500, "Commit message maksimal 500 karakter")
  .refine((val) => !/<[^>]*script/i.test(val), "Commit message mengandung pola tidak diizinkan")
  .transform((val) => val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ""));

export const repoFullNameSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "Format repository tidak valid (owner/nama-repo)");

/**
 * URL blob Vercel yang boleh diakses server saat mengambil ulang file ZIP
 * hasil client-upload. Domain divalidasi ketat (bukan cuma prefix string)
 * untuk mencegah SSRF — server tidak boleh pernah melakukan fetch ke URL
 * arbitrer yang dikirim client.
 */
export const trustedBlobUrlSchema = z
  .string()
  .trim()
  .url("URL blob tidak valid")
  .refine((val) => {
    try {
      const u = new URL(val);
      return (
        u.protocol === "https:" &&
        (u.hostname.endsWith(".public.blob.vercel-storage.com") ||
          u.hostname.endsWith(".blob.vercel-storage.com"))
      );
    } catch {
      return false;
    }
  }, "URL blob tidak dipercaya (domain tidak dikenali)");

export const uploadRequestSchema = z.object({
  repoFullName: repoFullNameSchema,
  branch: branchNameSchema,
  commitMessage: commitMessageSchema,
  createBranchIfMissing: z.boolean().default(true),
  blobUrl: trustedBlobUrlSchema,
});

export type UploadRequestInput = z.infer<typeof uploadRequestSchema>;

// Batas ukuran file ZIP: 50 MB.
// Catatan: karena upload sekarang lewat Vercel Blob (client-side upload),
// batas ini TIDAK lagi dibatasi oleh limit body request 4.5 MB milik
// Vercel Serverless Functions — lihat lib/blobUpload.ts & app/api/blob-upload/route.ts.
export const MAX_ZIP_SIZE_BYTES = 50 * 1024 * 1024;

// Batas total ukuran hasil ekstraksi (proteksi zip-bomb): 500 MB
export const MAX_EXTRACTED_SIZE_BYTES = 500 * 1024 * 1024;

// Rasio kompresi maksimum yang dianggap wajar (uncompressed / compressed).
// Zip bomb klasik punya rasio ribuan kali; kita tolak jauh di bawah itu.
export const MAX_COMPRESSION_RATIO = 100;

// Jumlah maksimum entri file dalam satu ZIP (proteksi terhadap "file bomb")
export const MAX_ZIP_ENTRIES = 20000;
