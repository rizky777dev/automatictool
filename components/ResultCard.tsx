"use client";

import { CheckCircle2, ExternalLink, Files, HardDrive, GitCommitHorizontal } from "lucide-react";
import type { PushResult } from "@/types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i] ?? "B"}`;
}

export default function ResultCard({ result }: { result: PushResult }) {
  return (
    <div className="animate-fade-up glass-panel border-ember/25 p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ember-dim text-ember">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h2 className="text-sm font-semibold text-slate-100">Push Berhasil!</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatBox icon={<Files className="h-4 w-4" />} label="Total File" value={String(result.totalFiles)} />
        <StatBox icon={<HardDrive className="h-4 w-4" />} label="Total Ukuran" value={formatBytes(result.totalSizeBytes)} />
        <StatBox
          icon={<GitCommitHorizontal className="h-4 w-4" />}
          label="Commit SHA"
          value={result.commitSha.slice(0, 7)}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <a href={result.repoUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
          <ExternalLink className="h-4 w-4" /> Buka Repository
        </a>
        <a href={result.commitUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
          <GitCommitHorizontal className="h-4 w-4" /> Lihat Commit
        </a>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-3 transition-colors hover:border-ember/20">
      <div className="mb-1 flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="truncate font-mono text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}
