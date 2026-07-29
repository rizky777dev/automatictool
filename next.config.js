/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Mencegah situs lain mem-frame halaman ini (proteksi utama anti-clickjacking/deface-via-iframe)
  { key: "X-Frame-Options", value: "DENY" },
  // Mencegah browser menebak-nebak MIME type (proteksi terhadap beberapa vektor XSS)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Kurangi kebocoran informasi URL saat navigasi keluar
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Matikan akses API browser yang tidak dipakai aplikasi ini
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // DNS prefetch tidak perlu untuk app internal ini
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // PENTING: Next.js App Router menyisipkan beberapa <script> inline kecil
      // (payload streaming React Server Components) untuk proses hydration —
      // tanpa 'unsafe-inline' di sini, browser DIAM-DIAM MEMBLOKIR script itu,
      // sehingga HTML tetap tampil (hasil render server) tapi SELURUH
      // interaktivitas (onClick, onChange, dst di semua halaman) mati total.
      // Ini pernah jadi bug nyata di app ini. Alternatif yang lebih ketat
      // (CSP berbasis nonce lewat middleware.ts) bisa dipasang belakangan,
      // tapi butuh implementasi terpisah yang lebih rumit — untuk sekarang
      // 'unsafe-inline' dipilih demi memastikan aplikasi berfungsi. Risikonya
      // rendah karena app ini tidak memakai dangerouslySetInnerHTML di mana pun.
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.private.blob.vercel-storage.com https://*.public.blob.vercel-storage.com https://*.blob.vercel-storage.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
