# ZIP → GitHub Pusher

Aplikasi web pribadi untuk otomatisasi upload source code ke GitHub tanpa perlu drag-file
satu-satu di web GitHub. Upload satu file ZIP, sistem mengekstraknya di memori (bukan di
disk), menyaring folder yang tidak perlu ikut (`node_modules`, `.git`, `.env`, `dist`,
`build`, dll), lalu mem-push seluruh isinya sebagai **satu commit** ke GitHub lewat REST API
(Octokit) — lengkap dengan progress log real-time & visualisasi tahapan Git plumbing
(blob → tree → commit → ref).

Developed by **Rizky**.

---

## 1. Alur Halaman

Aplikasi ini multi-page (bukan satu dashboard panjang) — state (token, repo, file, dsb)
mengalir antar halaman lewat React Context di memori browser (`components/FlowProvider.tsx`),
**bukan** localStorage/cookie. Konsekuensinya: refresh browser di tengah alur akan
mengembalikan ke `/form` karena token memang tidak pernah disimpan permanen.

| Route | Isi | Guard |
|---|---|---|
| `/` | Halaman selamat datang, tombol "Lanjutkan" | — |
| `/form` | Form Personal Access Token | — |
| `/upload` | Pilih repo, branch, commit message, upload ZIP | Redirect ke `/form` kalau belum ada token |
| `/progress` | Pipeline rail + terminal log real-time + hasil push | Redirect ke `/upload`/`/form` kalau data belum lengkap |
| `/faq` | FAQ | — |

## 2. Struktur Proyek

```
zip-to-github/
├── app/
│   ├── layout.tsx                   # Bungkus semua halaman dengan FlowProvider
│   ├── globals.css
│   ├── page.tsx                     # (/) Halaman selamat datang
│   ├── form/page.tsx                # (/form) Form token
│   ├── upload/page.tsx              # (/upload) Pilih repo/branch + upload ZIP
│   ├── progress/page.tsx            # (/progress) Pipeline & log real-time + hasil
│   ├── faq/page.tsx                 # (/faq) Halaman FAQ
│   ├── error.tsx                    # Error boundary per halaman (tampilkan pesan asli)
│   ├── global-error.tsx             # Error boundary root layout
│   └── api/
│       ├── repos/route.ts           # Validasi token + list repo
│       ├── blob-upload/route.ts     # Terbitkan token client-upload Vercel Blob
│       └── upload/route.ts          # Ambil ZIP dari Blob, ekstrak, push (streaming)
├── components/
│   ├── FlowProvider.tsx             # Context state lintas-halaman (di memori saja)
│   ├── TokenForm.tsx
│   ├── RepoBranchForm.tsx
│   ├── UploadZone.tsx
│   ├── ProgressLog.tsx              # Terminal log real-time
│   ├── PipelineRail.tsx             # Visualisasi commit-graph tahapan push
│   ├── ResultCard.tsx
│   ├── Watermark.tsx                # Watermark "Rizky" persisten di semua halaman
│   └── Footer.tsx
├── lib/
│   ├── validation.ts                # Skema Zod (anti XSS/injection) + validasi SSRF
│   ├── zipExtractor.ts              # Anti path traversal & zip bomb
│   ├── github.ts                    # Octokit: blob/tree/commit
│   ├── security.ts                  # Header token, rate limit, origin check, magic bytes
│   └── blobUpload.ts                # Helper client upload ke Vercel Blob
├── types/index.ts
├── tailwind.config.ts
├── next.config.js                   # Security headers (CSP, X-Frame-Options, dll)
├── package.json
└── tsconfig.json
```

---

## 3. Kenapa Ada Vercel Blob di Alur Upload?

Vercel Serverless Functions membatasi **body request maksimal 4.5 MB** — jauh di bawah
batas 50 MB yang ingin didukung aplikasi ini. Solusinya: browser mengunggah ZIP **langsung
ke Vercel Blob** (bypass server, bukan lewat body `/api/upload`), lalu server hanya
mengambil file itu untuk diekstrak & di-push, dan **menghapusnya otomatis** setelah selesai
(baik sukses maupun gagal). Token GitHub kamu sendiri tidak pernah dikirim ke Vercel Blob.

## 4. Menjalankan di Localhost

```bash
# 1. Masuk ke folder project
cd zip-to-github

# 2. Install semua dependency
npm install

# 3. (Opsional tapi disarankan) tarik environment variable dari project Vercel-mu,
#    supaya BLOB_READ_WRITE_TOKEN otomatis terisi untuk testing lokal:
npx vercel link
npx vercel env pull .env.local

# 4. Jalankan dev server
npm run dev
```

> Catatan: `onUploadCompleted` webhook milik Vercel Blob tidak bisa memanggil `localhost`.
> Ini **tidak masalah** untuk aplikasi ini karena kita sengaja tidak bergantung pada webhook
> tersebut — browser langsung memakai URL blob hasil upload untuk memanggil `/api/upload`.

## 5. Setup Vercel Blob (WAJIB sebelum deploy)

1. Buka project kamu di dashboard Vercel → tab **Storage** → **Create Database** → pilih
   **Blob**.
2. Saat diminta memilih access mode, **pilih Private** (bukan Public). Source code yang
   di-upload lewat aplikasi ini berpotensi rahasia, jadi tidak boleh punya URL yang bisa
   diakses siapa saja tanpa autentikasi. Kode di repo ini sudah ditulis khusus untuk Private
   Blob Store (pakai `get()` yang terautentikasi di `app/api/upload/route.ts`, bukan `fetch()`
   biasa) — **jangan pilih Public**, karena tidak akan cocok dengan kode ini.
3. **Penting:** access mode & region tidak bisa diubah lagi setelah store dibuat.
4. Setelah dibuat, Vercel otomatis menambahkan environment variable
   `BLOB_READ_WRITE_TOKEN` ke project-mu (tidak perlu diisi manual).
5. Redeploy project agar environment variable baru ini terbaca oleh Functions.

Tanpa langkah ini, tombol "Push ke GitHub" akan gagal di step upload dengan pesan
`BLOB_READ_WRITE_TOKEN is not defined`.

## 6. Deploy ke Vercel via GitHub Codespaces

```bash
git add .
git commit -m "feat: redesign UI/UX + fix build error + Vercel Blob upload"
git push origin main
```

Lalu di dashboard Vercel: **Import Project** dari repo GitHub-mu (atau jika sudah pernah
di-import, push ke branch yang terhubung akan otomatis trigger deploy).

## 7. Custom Domain via Cloudflare

1. Di dashboard Vercel → project → **Settings → Domains** → tambahkan
   `toolgithub.zkypro.my.id`.
2. Vercel akan memberi target CNAME (biasanya `cname.vercel-dns.com`).
3. Di dashboard Cloudflare → DNS → tambahkan record CNAME dengan nama `toolgithub` mengarah
   ke target tersebut.
4. **Penting:** set proxy status record itu ke **DNS only (awan abu-abu)**, bukan
   **Proxied (awan oranye)**, kecuali kamu sudah menyesuaikan mode SSL Cloudflare ke
   *Full (strict)* — kalau tidak, koneksi ke Vercel bisa gagal/redirect loop karena
   sertifikat SSL Vercel & proxy Cloudflare saling tumpang tindih.

## 8. Keamanan yang Sudah Diterapkan

- Token PAT **tidak pernah** ditulis ke disk, database, cookie, atau localStorage — hanya
  hidup di memori selama satu request, dan selalu di-mask di UI.
- Validasi ketat lewat Zod untuk nama branch, commit message, dan format repository
  (`owner/repo`) — mencegah command injection ke Git internal & XSS saat data ditampilkan
  ulang di UI.
- Anti **path traversal**: setiap entri ZIP diperiksa (`../`, path absolut, null byte)
  sebelum diekstrak.
- Anti **zip bomb**: batas jumlah entri, batas total ukuran hasil ekstraksi, dan pengecekan
  rasio kompresi per-file.
- Pengecekan **magic bytes** ZIP (`PK\x03\x04`) di server — ekstensi `.zip` & Content-Type
  saja bisa dipalsukan klien, ini lapisan tambahan.
- **Anti-SSRF**: server hanya mau melakukan `fetch()` ke URL yang domainnya benar-benar
  `*.public.blob.vercel-storage.com`, divalidasi lewat skema Zod sebelum dipakai — bukan
  mempercayai begitu saja URL yang dikirim client.
- **Security headers** di `next.config.js`: `Content-Security-Policy`,
  `X-Frame-Options: DENY` (anti clickjacking/deface via iframe), `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`.
  > Catatan: `script-src` di CSP menyertakan `'unsafe-inline'` karena Next.js App Router
  > butuh menjalankan beberapa `<script>` inline kecil untuk hydration (mengaktifkan
  > interaktivitas). Tanpa ini, halaman tampil normal tapi **semua klik/interaksi mati
  > total** (pernah terjadi di app ini). Opsi yang lebih ketat (CSP berbasis nonce lewat
  > `middleware.ts`) bisa dipasang di masa depan; risiko saat ini rendah karena project
  > tidak memakai `dangerouslySetInnerHTML` di mana pun.
- **Rate limiting** per-IP (best-effort, in-memory) di semua API route untuk mengurangi
  potensi brute-force/spam.
- **Origin check** di semua API route sebagai lapisan pertahanan tambahan.

### Keterbatasan yang perlu kamu tahu

- Rate limiter berbasis memori proses **tidak presisi 100%** di lingkungan serverless
  (tiap cold start/instance punya memori sendiri). Untuk kebutuhan produksi yang lebih
  serius, pertimbangkan Vercel Firewall atau layanan rate-limit terdistribusi (mis. Upstash
  Redis).
- Route `/api/blob-upload` bersifat publik (tidak ada sistem login di app ini) sehingga
  secara teori bisa dipakai orang lain untuk menaruh file ZIP sementara di Blob store-mu.
  Ini **tidak bisa dipakai untuk push apa pun** ke GitHub (itu tetap butuh token PAT valid
  milikmu), dan setiap upload dibatasi ukuran/tipe file serta rate limit. Jika ini jadi
  concern, pertimbangkan menambahkan proteksi tambahan (mis. shared secret sederhana) di
  route tersebut.

## 9. Batasan Ukuran

| Batas | Nilai |
|---|---|
| Ukuran file ZIP | 50 MB |
| Total ukuran hasil ekstraksi | 500 MB |
| Jumlah entri dalam ZIP | 20.000 |
| Rasio kompresi maksimum (anti zip-bomb) | 100x |
