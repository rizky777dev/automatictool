"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TokenForm from "@/components/TokenForm";
import Watermark from "@/components/Watermark";
import { useFlow } from "@/components/FlowProvider";
import type { GitHubRepo } from "@/types";

export default function FormPage() {
  const router = useRouter();
  const { setToken, setLogin, setRepos } = useFlow();

  function handleConnected(token: string, login: string, repos: GitHubRepo[]) {
    setToken(token);
    setLogin(login);
    setRepos(repos);
    router.push("/upload");
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:py-14">
      <header className="animate-fade-up mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 font-mono text-sm text-slate-400 transition-colors hover:text-ember-soft">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <span className="font-mono text-[11px] text-slate-600">langkah 1 dari 3</span>
      </header>

      <TokenForm onConnected={handleConnected} />

      <Watermark />
    </main>
  );
}
