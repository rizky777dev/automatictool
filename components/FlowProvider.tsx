"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { GitHubRepo, PushResult, UploadProgressEvent } from "@/types";

interface FlowContextValue {
  token: string | null;
  setToken: (t: string | null) => void;
  login: string | null;
  setLogin: (l: string | null) => void;
  repos: GitHubRepo[];
  setRepos: (r: GitHubRepo[]) => void;
  selectedRepo: string;
  setSelectedRepo: (r: string) => void;
  branch: string;
  setBranch: (b: string) => void;
  commitMessage: string;
  setCommitMessage: (m: string) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  events: UploadProgressEvent[];
  setEvents: Dispatch<SetStateAction<UploadProgressEvent[]>>;
  isRunning: boolean;
  setIsRunning: (v: boolean) => void;
  result: PushResult | null;
  setResult: (r: PushResult | null) => void;
  resetForNewPush: () => void;
}

// Sengaja HANYA React state (memori JS) — bukan localStorage/sessionStorage/cookie.
// Konsekuensinya: refresh browser = token & progres hilang (harus mulai dari /form
// lagi). Ini konsisten dengan prinsip keamanan "token tidak pernah disimpan".
const FlowContext = createContext<FlowContextValue | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [login, setLogin] = useState<string | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [commitMessage, setCommitMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [events, setEvents] = useState<UploadProgressEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<PushResult | null>(null);

  // Dipakai saat user mau push ZIP lain tanpa perlu masukin token ulang —
  // reset pilihan repo/file/progres, tapi token & daftar repo tetap dipertahankan.
  function resetForNewPush() {
    setSelectedRepo("");
    setBranch("main");
    setCommitMessage("");
    setFile(null);
    setEvents([]);
    setIsRunning(false);
    setResult(null);
  }

  return (
    <FlowContext.Provider
      value={{
        token,
        setToken,
        login,
        setLogin,
        repos,
        setRepos,
        selectedRepo,
        setSelectedRepo,
        branch,
        setBranch,
        commitMessage,
        setCommitMessage,
        file,
        setFile,
        events,
        setEvents,
        isRunning,
        setIsRunning,
        result,
        setResult,
        resetForNewPush,
      }}
    >
      {children}
    </FlowContext.Provider>
  );
}

export function useFlow(): FlowContextValue {
  const ctx = useContext(FlowContext);
  if (!ctx) {
    throw new Error("useFlow harus dipakai di dalam <FlowProvider>.");
  }
  return ctx;
}
