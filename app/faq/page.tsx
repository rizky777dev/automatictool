"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  KeyRound,
  Upload,
  ShieldCheck,
  FolderX,
  Scale,
  Wrench,
  HelpCircle,
  Cloud,
} from "lucide-react";
import Footer from "@/components/Footer";
import Watermark from "@/components/Watermark";

interface FaqItem {
  icon: React.ReactNode;
  question: string;
  answer: React.ReactNode;
}

const faqs: FaqItem[] = [
  {
    icon: <KeyRound className="h-5 w-5" />,
    question: "Bagaimana cara mendapatkan Personal Access Token (PAT) dari GitHub?",
    answer: (
      <ol className="list-decimal space-y-1.5 pl-4">
        <li>Login ke akun GitHub, klik foto profil di kanan atas lalu pilih Settings.</li>
        <li>Scroll ke bawah sidebar kiri, pilih Developer settings.</li>
        <li>Pilih Personal access tokens lalu klik Tokens (classic).</li>
        <li>Klik Generate new token → Generate new token (classic).</li>
        <li>Beri nama token (Note), atur masa berlaku (Expiration) sesuai kebutuhan.</li>
        <li>
          Pada bagian Select scopes, centang scope <code className="rounded bg-white/10 px-1 font-mono">repo</code>{" "}
          (akses penuh ke repository).
        </li>
        <li>Klik Generate token di bagian bawah halaman.</li>
        <li>Salin token yang muncul (hanya ditampilkan sekali) dan tempel ke aplikasi ini.</li>
      </ol>
    ),
  },
  {
    icon: <Upload className="h-5 w-5" />,
    question: "Mengapa saya tidak bisa upload source code langsung satu per satu di web GitHub?",
    answer: (
      <p>
        Web GitHub hanya mendukung upload file dalam jumlah terbatas per sesi dan tidak mempertahankan struktur folder
        otomatis dari arsip ZIP. Untuk proyek dengan ratusan atau ribuan file, cara ini sangat tidak efisien. Aplikasi
        ini mengekstrak ZIP dan membangun Git Tree langsung melalui GitHub REST API, sehingga seluruh struktur folder
        terupload dalam satu commit tanpa proses manual berulang.
      </p>
    ),
  },
  {
    icon: <Cloud className="h-5 w-5" />,
    question: "Kenapa file ZIP saya diupload ke Vercel Blob dulu, bukan langsung ke server?",
    answer: (
      <p>
        Vercel Serverless Functions membatasi ukuran body request maksimal 4.5 MB — jauh lebih kecil dari batas 50 MB
        yang didukung aplikasi ini. Untuk mengakalinya, browser mengunggah ZIP langsung ke Vercel Blob (bukan lewat
        server aplikasi), lalu server hanya mengambil file itu untuk diekstrak &amp; di-push. File sementara ini{" "}
        <strong>otomatis dihapus dari Blob</strong> begitu proses ekstraksi &amp; push selesai — baik berhasil maupun
        gagal.
      </p>
    ),
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    question: "Apakah Token GitHub saya aman jika dimasukkan ke web ini?",
    answer: (
      <p>
        Token dikirim melalui header request khusus langsung ke API route lokal aplikasi ini, diproses sepenuhnya di
        memori server selama satu kali request, lalu dibuang begitu proses selesai. Token tidak pernah ditulis ke
        database, file log, cookie, maupun localStorage browser, dan tidak pernah dikirim ke Vercel Blob. Pada
        antarmuka, token juga selalu ditampilkan dalam bentuk masking (titik-titik) kecuali Anda memilih untuk
        menampilkannya sendiri.
      </p>
    ),
  },
  {
    icon: <FolderX className="h-5 w-5" />,
    question: "File atau folder apa saja yang otomatis diabaikan saat ekstraksi?",
    answer: (
      <div>
        <p className="mb-2">Sistem secara otomatis menyaring item berikut agar tidak ikut ter-push ke repository:</p>
        <div className="flex flex-wrap gap-1.5">
          {["node_modules/", ".git/", ".env", ".DS_Store", "dist/", "build/", ".next/", "*.log", "*.lock"].map(
            (item) => (
              <code key={item} className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs">
                {item}
              </code>
            )
          )}
        </div>
      </div>
    ),
  },
  {
    icon: <Scale className="h-5 w-5" />,
    question: "Berapa batas maksimal ukuran file ZIP yang bisa di-upload?",
    answer: (
      <p>
        Batas maksimal ukuran file ZIP adalah <strong>50 MB</strong> per upload. Sistem juga membatasi total ukuran
        hasil ekstraksi dan memeriksa rasio kompresi setiap file untuk mendeteksi dan menolak potensi serangan zip
        bomb sebelum proses ekstraksi selesai.
      </p>
    ),
  },
  {
    icon: <Wrench className="h-5 w-5" />,
    question: "Apa yang harus dilakukan jika proses push gagal atau error?",
    answer: (
      <ul className="list-disc space-y-1.5 pl-4">
        <li>Periksa status log real-time di dashboard — pesan error biasanya menjelaskan langkah yang gagal.</li>
        <li>Pastikan token PAT masih berlaku dan memiliki scope repo.</li>
        <li>Pastikan nama repository dan branch yang dipilih benar dan Anda punya akses tulis (write access).</li>
        <li>Jika error terkait rate limit GitHub, tunggu beberapa menit lalu coba ulang.</li>
        <li>Jika ZIP ditolak karena alasan keamanan, periksa apakah arsip berisi path aneh atau ukuran tak wajar.</li>
      </ul>
    ),
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 font-mono text-sm text-slate-400 hover:text-ember-soft">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
        </Link>
      </header>

      <div className="animate-fade-up mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-ember">
          <HelpCircle className="h-6 w-6 text-ink" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Frequently Asked Questions</h1>
          <p className="text-sm text-slate-500">Panduan lengkap penggunaan ZIP → GitHub Pusher</p>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className="animate-fade-up glass-panel overflow-hidden"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-3 p-5 text-left"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <span className="text-ember-soft">{item.icon}</span>
                  <span className="text-sm font-medium text-slate-100">{item.question}</span>
                </div>
                <span
                  className={`inline-block transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                >
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                </span>
              </button>
              {isOpen && (
                <div className="animate-fade-up overflow-hidden border-t border-white/5">
                  <div className="px-5 pb-5 pt-4 text-sm leading-relaxed text-slate-400">{item.answer}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Footer />
      <Watermark />
    </main>
  );
}
