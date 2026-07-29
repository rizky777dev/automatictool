"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "motion/react";
import { UploadCloud, FileArchive, X, AlertTriangle } from "lucide-react";

const MAX_SIZE_MB = 50;

interface UploadZoneProps {
  file: File | null;
  onFileSelected: (file: File | null) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i] ?? "B"}`;
}

export default function UploadZone({ file, onFileSelected }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = useCallback(
    (f: File | undefined) => {
      setError(null);
      if (!f) return;
      if (!f.name.toLowerCase().endsWith(".zip")) {
        setError("Hanya file dengan ekstensi .zip yang diterima.");
        return;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`Ukuran file melebihi batas ${MAX_SIZE_MB} MB.`);
        return;
      }
      onFileSelected(f);
    },
    [onFileSelected]
  );

  return (
    <div className="animate-fade-up glass-panel p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ember-dim text-ember-soft">
          <FileArchive className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Upload Source Code (.zip)</h2>
          <p className="font-mono text-[11px] text-slate-500">langkah 3 dari 3</p>
        </div>
      </div>

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            validateAndSet(e.dataTransfer.files?.[0]);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
            isDragging ? "scale-[1.01] border-ember bg-ember-dim" : "border-white/15 hover:border-white/30"
          }`}
        >
          <motion.div animate={isDragging ? { y: -4 } : { y: 0 }} transition={{ type: "spring", stiffness: 300 }}>
            <UploadCloud className="h-10 w-10 text-ember-soft" />
          </motion.div>
          <p className="text-sm text-slate-300">
            Tarik &amp; lepas file ZIP di sini, atau <span className="text-ember-soft underline">klik untuk pilih</span>
          </p>
          <p className="font-mono text-xs text-slate-500">maks. {MAX_SIZE_MB} MB · format .zip</p>
          <input
            ref={inputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => validateAndSet(e.target.files?.[0])}
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4"
        >
          <div className="flex items-center gap-3">
            <FileArchive className="h-8 w-8 text-ember-soft" />
            <div>
              <p className="max-w-[220px] truncate text-sm font-medium text-slate-200 sm:max-w-xs">{file.name}</p>
              <p className="font-mono text-xs text-slate-500">{formatBytes(file.size)}</p>
            </div>
          </div>
          <button
            onClick={() => onFileSelected(null)}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-red-400"
            aria-label="Hapus file"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 flex items-start gap-2 overflow-hidden rounded-lg border border-danger/30 bg-danger-dim p-3 text-xs text-red-300"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}
    </div>
  );
}
