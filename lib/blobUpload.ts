import { upload } from "@vercel/blob/client";

/**
 * Upload file ZIP langsung dari browser ke Vercel Blob, TANPA melewati
 * body request Serverless Function kita (yang dibatasi 4.5 MB oleh
 * platform Vercel). Token upload sementara diterbitkan oleh
 * /api/blob-upload, file besar mengalir langsung browser -> Vercel Blob.
 *
 * File yang tersimpan di Blob bersifat sementara: server akan menghapusnya
 * segera setelah selesai diekstrak & di-push (lihat app/api/upload/route.ts).
 */
export async function uploadZipToBlob(file: File, onProgress?: (percent: number) => void): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const pathname = `zip-uploads/${crypto.randomUUID()}-${safeName}`;

  // access: "private" — WAJIB dibuat sebagai Private Blob Store di dashboard
  // Vercel (Storage → Create Database → Blob → access: Private). Source code
  // yang di-upload di sini berpotensi rahasia, jadi URL-nya tidak boleh bisa
  // diakses publik tanpa autentikasi. Lihat app/api/upload/route.ts untuk
  // cara server membacanya kembali lewat get() yang terautentikasi.
  const blob = await upload(pathname, file, {
    access: "private",
    handleUploadUrl: "/api/blob-upload",
    contentType: "application/zip",
    onUploadProgress: (evt) => onProgress?.(Math.round(evt.percentage)),
  });

  return blob.url;
}
