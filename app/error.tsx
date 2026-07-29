"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[app/error.tsx]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
      <div className="glass-panel w-full p-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-danger-dim text-danger">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mb-2 text-lg font-semibold text-slate-100">Terjadi kesalahan di halaman ini</h1>
        <p className="mb-4 text-sm text-slate-400">
          Berikut pesan error asli — screenshot ini kalau perlu dikirim untuk ditelusuri lebih lanjut:
        </p>
        <pre className="mb-4 max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-left font-mono text-xs text-red-300">
          {error.message || "Tidak ada pesan error spesifik."}
          {error.digest ? `\n\ndigest: ${error.digest}` : ""}
        </pre>
        <button onClick={() => reset()} className="btn-primary mx-auto">
          <RotateCcw className="h-4 w-4" /> Coba lagi
        </button>
      </div>
    </main>
  );
}
