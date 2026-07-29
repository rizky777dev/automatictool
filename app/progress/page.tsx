"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Home } from "lucide-react";
import PipelineRail from "@/components/PipelineRail";
import ProgressLog from "@/components/ProgressLog";
import ResultCard from "@/components/ResultCard";
import Watermark from "@/components/Watermark";
import { useFlow } from "@/components/FlowProvider";
import { uploadZipToBlob } from "@/lib/blobUpload";
import type { PushResult, UploadProgressEvent, UploadStep } from "@/types";

export default function ProgressPage() {
  const router = useRouter();
  const {
    token,
    file,
    selectedRepo,
    branch,
    commitMessage,
    events,
    setEvents,
    isRunning,
    setIsRunning,
    result,
    setResult,
    resetForNewPush,
  } = useFlow();

  const hasStarted = useRef(false);

  // Guard: kalau data yang dibutuhkan tidak ada di context (mis. browser
  // di-refresh sehingga state di memori hilang), arahkan kembali ke step
  // yang sesuai alih-alih menampilkan halaman kosong/rusak.
  useEffect(() => {
    if (!token) {
      router.replace("/form");
      return;
    }
    if (!file || !selectedRepo || !branch || !commitMessage) {
      // Kalau sudah pernah selesai/berjalan sebelumnya (mis. user pencet
      // tombol back lalu maju lagi), jangan paksa balik ke /upload —
      // biarkan hasil yang sudah ada tetap tampil.
      if (events.length === 0) {
        router.replace("/upload");
      }
    }
  }, [token, file, selectedRepo, branch, commitMessage, events.length, router]);

  useEffect(() => {
    if (hasStarted.current) return;
    if (!token || !file || !selectedRepo || !branch || !commitMessage) return;
    if (events.length > 0) return; // sudah pernah dijalankan di sesi ini

    hasStarted.current = true;
    void runPush();

    async function runPush() {
      setIsRunning(true);
      setResult(null);

      const pushEvent = (step: UploadStep, message: string, progress: number) => {
        setEvents((prev) => [...prev, { step, message, progress }]);
      };

      try {
        pushEvent("uploading", "Mengunggah ZIP ke penyimpanan sementara...", 2);

        const blobUrl = await uploadZipToBlob(file as File, (percent) => {
          setEvents((prev) => {
            const withoutLast = prev.slice(0, -1);
            const cappedProgress = Math.min(2 + Math.round(percent * 0.03), 5);
            return [...withoutLast, { step: "uploading", message: `Mengunggah ZIP... ${percent}%`, progress: cappedProgress }];
          });
        });

        pushEvent("uploading", "ZIP terunggah, memulai proses ekstraksi & push...", 5);

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "x-gh-token": token as string, "Content-Type": "application/json" },
          body: JSON.stringify({
            repoFullName: selectedRepo,
            branch,
            commitMessage,
            createBranchIfMissing: true,
            blobUrl,
          }),
        });

        if (!res.body) throw new Error("Server tidak mengirim response stream.");
        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          throw new Error(errJson?.error ?? "Gagal memulai proses di server.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const evt: UploadProgressEvent = JSON.parse(line);
            setEvents((prev) => [...prev, evt]);
            if (evt.step === "done" && evt.detail) {
              setResult(evt.detail as unknown as PushResult);
            }
          }
        }
      } catch (err) {
        pushEvent("error", err instanceof Error ? err.message : "Terjadi kesalahan koneksi.", 0);
      } finally {
        setIsRunning(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const last = events[events.length - 1];
  const currentStep = last?.step ?? null;
  const hasError = last?.step === "error";
  const isDone = last?.step === "done";

  function handlePushAnother() {
    resetForNewPush();
    router.push("/upload");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <header className="animate-fade-up mb-6 flex items-center justify-between">
        <Link href="/upload" className="flex items-center gap-1.5 font-mono text-sm text-slate-400 transition-colors hover:text-ember-soft">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <span className="font-mono text-[11px] text-slate-600">langkah 3 dari 3</span>
      </header>

      <h1 className="animate-fade-up mb-6 text-xl font-bold text-slate-100">
        {isDone ? "Push selesai" : hasError ? "Push gagal" : "Memproses push..."}
      </h1>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="lg:order-1">
          <div className="lg:sticky lg:top-6">
            <PipelineRail currentStep={currentStep} hasError={hasError} />
          </div>
        </div>

        <div className="space-y-6">
          <ProgressLog events={events} isRunning={isRunning} />
          {result && <ResultCard result={result} />}

          {(isDone || hasError) && (
            <div className="animate-fade-up flex flex-wrap gap-3">
              <button onClick={handlePushAnother} className="btn-secondary">
                <RotateCcw className="h-4 w-4" /> Push ZIP Lain
              </button>
              <Link href="/" className="btn-secondary">
                <Home className="h-4 w-4" /> Kembali ke Beranda
              </Link>
            </div>
          )}
        </div>
      </div>

      <Watermark />
    </main>
  );
}
