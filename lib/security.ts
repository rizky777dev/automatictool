/**
 * Header kustom tempat PAT dikirim dari client ke API route lokal.
 * TIDAK PERNAH gunakan cookie/localStorage untuk token ini.
 */
export const TOKEN_HEADER = "x-gh-token";

export function getTokenFromRequest(req: Request): string | null {
  const token = req.headers.get(TOKEN_HEADER);
  return token && token.trim().length > 0 ? token.trim() : null;
}

/** Mask token untuk keperluan tampilan/log darurat — jangan pernah log token asli. */
export function maskToken(token: string): string {
  if (token.length <= 8) return "••••••••";
  return `${token.slice(0, 4)}${"•".repeat(8)}${token.slice(-4)}`;
}

/**
 * Wrapper console.error yang menjamin token tidak ikut tercetak walau
 * objek error menyertakan header request secara tidak sengaja.
 */
export function safeLogError(context: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const redacted = message.replace(/(ghp_|github_pat_|gho_|ghu_|ghs_)[A-Za-z0-9_]+/g, "[REDACTED_TOKEN]");
  console.error(`[${context}]`, redacted);
}

/**
 * Ambil alamat IP pemanggil dari header yang diisi oleh Vercel/proxy.
 * Best-effort saja — tidak bisa dipalsu-cek 100% karena header bisa
 * dikontrol client jika tidak di belakang proxy tepercaya, tapi di Vercel
 * header ini diisi oleh edge network, bukan oleh client.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Rate limiter sederhana berbasis memori proses (token bucket kasar).
 *
 * KETERBATASAN PENTING: di Vercel Serverless setiap instance function
 * bisa jadi proses yang berbeda-beda (cold start / scaling horizontal),
 * jadi limiter ini TIDAK menjamin batas global yang presisi. Ini adalah
 * lapisan proteksi "best-effort" tambahan terhadap spam/brute-force dari
 * satu instance yang sama, BUKAN pengganti proteksi tingkat platform
 * (mis. Vercel Firewall / WAF) untuk kebutuhan produksi yang lebih serius.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count += 1;
  if (bucket.count > limit) return true;

  // Housekeeping ringan supaya map tidak tumbuh tanpa batas pada instance
  // yang berumur panjang.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (now > v.resetAt) buckets.delete(k);
    }
  }

  return false;
}

/**
 * Validasi bahwa request datang dari origin yang sama dengan host aplikasi.
 * Lapisan pertahanan tambahan (defense-in-depth) terhadap penyalahgunaan
 * API dari origin lain lewat browser — bukan pengganti otentikasi, karena
 * token PAT tetap wajib benar & valid di GitHub untuk request berhasil.
 */
export function isTrustedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  // Request non-browser (curl, server-to-server) umumnya tidak mengirim
  // header Origin — kita tetap izinkan karena token GitHub-lah yang jadi
  // garis pertahanan utama, ini hanya proteksi tambahan untuk skenario browser.
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    const requestHost = req.headers.get("host");
    return originHost === requestHost;
  } catch {
    return false;
  }
}

/**
 * Cek magic bytes ZIP ("PK\x03\x04", "PK\x05\x06" untuk empty archive, atau
 * "PK\x07\x08" untuk spanned archive) sebagai proteksi tambahan di luar
 * ekstensi file & Content-Type — keduanya bisa dipalsukan oleh client.
 */
export function hasZipMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  const sig = buffer.subarray(0, 4);
  const isLocalFile = sig[0] === 0x50 && sig[1] === 0x4b && sig[2] === 0x03 && sig[3] === 0x04;
  const isEmptyArchive = sig[0] === 0x50 && sig[1] === 0x4b && sig[2] === 0x05 && sig[3] === 0x06;
  const isSpanned = sig[0] === 0x50 && sig[1] === 0x4b && sig[2] === 0x07 && sig[3] === 0x08;
  return isLocalFile || isEmptyArchive || isSpanned;
}
