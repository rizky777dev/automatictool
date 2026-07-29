"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { KeyRound, Loader2, CheckCircle2, AlertTriangle, Eye, EyeOff, Lock } from "lucide-react";
import type { GitHubRepo } from "@/types";

interface TokenFormProps {
  onConnected: (token: string, login: string, repos: GitHubRepo[]) => void;
}

export default function TokenForm({ onConnected }: TokenFormProps) {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [login, setLogin] = useState<string | null>(null);

  async function handleConnect() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/repos", {
        method: "GET",
        headers: { "x-gh-token": token },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal terhubung ke GitHub.");
      setStatus("success");
      setLogin(data.login);
      onConnected(token, data.login, data.repos ?? []);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }

  return (
    <div className="animate-fade-up glass-panel p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ember-dim text-ember-soft">
          <KeyRound className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Hubungkan Akun GitHub</h2>
          <p className="font-mono text-[11px] text-slate-500">langkah 1 dari 3</p>
        </div>
      </div>

      <label htmlFor="pat-input" className="mb-1.5 block text-xs font-medium text-slate-400">
        Personal Access Token (PAT)
      </label>
      <div className="relative">
        <input
          id="pat-input"
          type={showToken ? "text" : "password"}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && token && status !== "loading" && handleConnect()}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          className="input-field pr-10 font-mono"
          autoComplete="off"
          spellCheck={false}
          data-1p-ignore
        />
        <button
          type="button"
          onClick={() => setShowToken((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
          tabIndex={-1}
          aria-label={showToken ? "Sembunyikan token" : "Tampilkan token"}
        >
          {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-600">
        <Lock className="h-3 w-3" /> Diproses di memori server, tidak pernah disimpan.
      </p>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleConnect}
        disabled={!token || status === "loading"}
        className="btn-primary mt-4 w-full"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Memvalidasi...
          </>
        ) : status === "success" ? (
          <>
            <CheckCircle2 className="h-4 w-4" /> Terhubung sebagai {login}
          </>
        ) : (
          <>
            <KeyRound className="h-4 w-4" /> Hubungkan
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex items-start gap-2 overflow-hidden rounded-lg border border-danger/30 bg-danger-dim p-3 text-xs text-red-300"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
