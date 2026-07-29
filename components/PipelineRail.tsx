"use client";

import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import type { UploadStep } from "@/types";

const STAGES: { key: UploadStep; label: string }[] = [
  { key: "uploading", label: "Upload ZIP" },
  { key: "validating", label: "Validasi" },
  { key: "extracting", label: "Ekstraksi" },
  { key: "filtering", label: "Filtering" },
  { key: "checking_branch", label: "Cek branch" },
  { key: "creating_blobs", label: "Buat blob" },
  { key: "creating_tree", label: "Buat tree" },
  { key: "creating_commit", label: "Commit" },
  { key: "updating_ref", label: "Update ref" },
  { key: "done", label: "Selesai" },
];

interface PipelineRailProps {
  currentStep: UploadStep | null;
  hasError: boolean;
}

export default function PipelineRail({ currentStep, hasError }: PipelineRailProps) {
  const currentIndex = currentStep ? STAGES.findIndex((s) => s.key === currentStep) : -1;

  return (
    <nav aria-label="Progres pipeline push" className="glass-panel p-5">
      <p className="eyebrow mb-4 hidden lg:block">git plumbing</p>
      <ol className="flex gap-3 overflow-x-auto lg:flex-col lg:gap-0 lg:overflow-visible">
        {STAGES.map((stage, i) => {
          const isDone = currentIndex > i || (currentIndex === i && currentStep === "done");
          const isActive = currentIndex === i && stage.key !== "done";
          const isErrored = hasError && currentIndex === i;
          const isPending = currentIndex < i;

          return (
            <li key={stage.key} className="relative flex shrink-0 items-center gap-3 lg:items-stretch lg:pb-6 last:pb-0">
              {i < STAGES.length - 1 && (
                <span
                  aria-hidden
                  className={`absolute left-[9px] top-6 hidden h-full w-px lg:block ${
                    isDone ? "bg-ember/50" : "bg-white/10"
                  }`}
                />
              )}
              <span className="relative z-10 flex flex-col items-center lg:flex-row lg:gap-3">
                <motion.span
                  initial={false}
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    backgroundColor: isErrored
                      ? "#f0554c"
                      : isDone
                      ? "#22c08c"
                      : isActive
                      ? "#0a0c0f"
                      : "#0a0c0f",
                    borderColor: isErrored ? "#f0554c" : isDone || isActive ? "#22c08c" : "rgba(255,255,255,0.15)",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 ${
                    isActive ? "animate-pulse-ring" : ""
                  }`}
                >
                  {isErrored ? (
                    <X className="h-3 w-3 text-white" strokeWidth={3} />
                  ) : isDone ? (
                    <Check className="h-2.5 w-2.5 text-ink" strokeWidth={3} />
                  ) : null}
                </motion.span>
                <span
                  className={`mt-1.5 whitespace-nowrap font-mono text-[11px] lg:mt-0 lg:text-xs ${
                    isPending ? "text-slate-600" : isErrored ? "text-danger" : "text-slate-300"
                  } ${isActive ? "font-semibold text-slate-100" : ""}`}
                >
                  {stage.label}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
