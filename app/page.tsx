"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Rocket, ArrowRight, HelpCircle, Lock, ScanSearch, GitCommitHorizontal } from "lucide-react";
import Watermark from "@/components/Watermark";

const TRUST_BADGES = [
  { icon: Lock, label: "Token tidak pernah disimpan" },
  { icon: ScanSearch, label: "Anti path-traversal & zip bomb" },
  { icon: GitCommitHorizontal, label: "Satu commit, struktur utuh" },
];

export default function WelcomePage() {
  const router = useRouter();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-14 text-center">
      <div
        className="animate-fade-up mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-ember"
        style={{ animationDelay: "0s" }}
      >
        <Rocket className="h-7 w-7 text-ink" />
      </div>

      <p className="eyebrow animate-fade-up mb-3" style={{ animationDelay: "0.05s" }}>
        git blob · tree · commit · ref
      </p>

      <h1
        className="animate-fade-up text-3xl font-bold leading-tight tracking-tight text-slate-100 sm:text-4xl"
        style={{ animationDelay: "0.1s" }}
      >
        Selamat datang di{" "}
        <span className="bg-gradient-ember bg-clip-text text-transparent">ZIP → GitHub Pusher</span>
      </h1>

      <p
        className="animate-fade-up mt-4 max-w-lg text-sm leading-relaxed text-slate-400"
        style={{ animationDelay: "0.15s" }}
      >
        Push satu folder ZIP jadi satu commit ke GitHub, tanpa upload manual file satu-satu. Ekstraksi berjalan
        sepenuhnya di memori server, dan token GitHub kamu tidak pernah disimpan di mana pun.
      </p>

      <div className="animate-fade-up mt-6 flex flex-wrap justify-center gap-2" style={{ animationDelay: "0.2s" }}>
        {TRUST_BADGES.map((badge) => (
          <div
            key={badge.label}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-slate-400"
          >
            <badge.icon className="h-3.5 w-3.5 text-ember-soft" />
            {badge.label}
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push("/form")}
        className="btn-primary animate-fade-up mt-10 px-8 py-3 text-sm"
        style={{ animationDelay: "0.25s" }}
      >
        Lanjutkan <ArrowRight className="h-4 w-4" />
      </button>

      <Link
        href="/faq"
        className="animate-fade-up mt-6 flex items-center gap-1.5 font-mono text-xs text-slate-500 transition-colors hover:text-ember-soft"
        style={{ animationDelay: "0.3s" }}
      >
        <HelpCircle className="h-3.5 w-3.5" /> Baca FAQ dulu
      </Link>

      <p className="animate-fade-up mt-14 text-xs text-slate-600" style={{ animationDelay: "0.35s" }}>
        Developed by <span className="font-semibold text-ember-soft">Rizky</span>
      </p>

      <Watermark />
    </main>
  );
}
