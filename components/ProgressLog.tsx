"use client";

import { Loader2, CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";
import type { UploadProgressEvent } from "@/types";

interface ProgressLogProps {
  events: UploadProgressEvent[];
  isRunning: boolean;
}

export default function ProgressLog({ events, isRunning }: ProgressLogProps) {
  if (events.length === 0) return null;

  // FIX: events[events.length - 1] bertipe `UploadProgressEvent | undefined`
  // di bawah tsconfig `noUncheckedIndexedAccess` — mengaksesnya tanpa guard
  // adalah bug TypeScript yang membuat build gagal di Vercel. `events`
  // sudah dipastikan tidak kosong oleh early-return di atas, tapi kita
  // tetap fallback aman alih-alih memakai non-null assertion.
  const last = events[events.length - 1];
  if (!last) return null;
  const hasError = last.step === "error";
  const isDone = last.step === "done";

  return (
    <div className="terminal-window">
      <div className="terminal-chrome">
        <span className="terminal-dot bg-danger/70" />
        <span className="terminal-dot bg-gold/70" />
        <span className="terminal-dot bg-ember/70" />
        <span className="ml-3 font-mono text-[11px] text-slate-500">push.log</span>
      </div>

      <div className="p-5">
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            style={{ width: `${last.progress}%` }}
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              hasError ? "bg-danger" : "bg-gradient-ember"
            }`}
          />
        </div>

        <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1 font-mono text-xs">
          {events.map((e, i) => (
            <div key={i} className="flex items-start gap-2">
              {e.step === "error" ? (
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
              ) : e.step === "done" ? (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ember" />
              ) : isRunning && i === events.length - 1 ? (
                <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-ember-soft" />
              ) : (
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
              )}
              <span className={e.step === "error" ? "text-red-300" : "text-slate-300"}>{e.message}</span>
            </div>
          ))}
          {isRunning && !isDone && !hasError && (
            <div className="flex items-center gap-1 pl-5 text-slate-600">
              <span className="cursor-blink" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
