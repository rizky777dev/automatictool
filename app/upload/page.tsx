"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Rocket, CheckCircle2 } from "lucide-react";
import RepoBranchForm from "@/components/RepoBranchForm";
import UploadZone from "@/components/UploadZone";
import Watermark from "@/components/Watermark";
import { useFlow } from "@/components/FlowProvider";

export default function UploadPage() {
  const router = useRouter();
  const {
    token,
    login,
    repos,
    selectedRepo,
    setSelectedRepo,
    branch,
    setBranch,
    commitMessage,
    setCommitMessage,
    file,
    setFile,
  } = useFlow();

  // Kalau context kosong (mis. browser di-refresh, sehingga state di memori
  // hilang), arahkan balik ke /form — konsisten dengan prinsip token tidak
  // pernah disimpan permanen di mana pun.
  useEffect(() => {
    if (!token) router.replace("/form");
  }, [token, router]);

  if (!token) return null;

  const canContinue = Boolean(selectedRepo && branch && commitMessage && file);

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:py-14">
      <header className="animate-fade-up mb-6 flex items-center justify-between">
        <Link href="/form" className="flex items-center gap-1.5 font-mono text-sm text-slate-400 transition-colors hover:text-ember-soft">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <span className="font-mono text-[11px] text-slate-600">langkah 2 dari 3</span>
      </header>

      {login && (
        <div
          className="animate-fade-up mb-6 flex items-center gap-2 rounded-xl border border-ember/20 bg-ember-dim px-4 py-3 text-xs text-slate-300"
          style={{ animationDelay: "0.03s" }}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-ember-soft" />
          Terhubung sebagai <span className="font-mono font-semibold text-slate-100">{login}</span>
        </div>
      )}

      <div className="space-y-6">
        <RepoBranchForm
          repos={repos}
          selectedRepo={selectedRepo}
          onRepoChange={setSelectedRepo}
          branch={branch}
          onBranchChange={setBranch}
          commitMessage={commitMessage}
          onCommitMessageChange={setCommitMessage}
        />

        <UploadZone file={file} onFileSelected={setFile} />

        <button
          onClick={() => router.push("/progress")}
          disabled={!canContinue}
          className="btn-primary w-full py-3 text-sm"
        >
          <Rocket className="h-4 w-4" /> Push ke GitHub
        </button>
      </div>

      <Watermark />
    </main>
  );
}
