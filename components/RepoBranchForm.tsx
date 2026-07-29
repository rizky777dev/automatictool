"use client";

import { GitBranch, MessageSquare, FolderGit2, Lock } from "lucide-react";
import type { GitHubRepo } from "@/types";

interface RepoBranchFormProps {
  repos: GitHubRepo[];
  selectedRepo: string;
  onRepoChange: (fullName: string) => void;
  branch: string;
  onBranchChange: (branch: string) => void;
  commitMessage: string;
  onCommitMessageChange: (msg: string) => void;
}

export default function RepoBranchForm({
  repos,
  selectedRepo,
  onRepoChange,
  branch,
  onBranchChange,
  commitMessage,
  onCommitMessageChange,
}: RepoBranchFormProps) {
  const selected = repos.find((r) => r.full_name === selectedRepo);

  return (
    <div className="animate-fade-up glass-panel p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ember-dim text-ember-soft">
          <FolderGit2 className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Target Repository</h2>
          <p className="font-mono text-[11px] text-slate-500">langkah 2 dari 3</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="repo-select" className="mb-1.5 block text-xs font-medium text-slate-400">
            Repository
          </label>
          <select
            id="repo-select"
            value={selectedRepo}
            onChange={(e) => onRepoChange(e.target.value)}
            className="input-field"
          >
            <option value="" disabled>
              Pilih repository...
            </option>
            {repos.map((r) => (
              <option key={r.id} value={r.full_name}>
                {r.full_name} {r.private ? "(private)" : ""}
              </option>
            ))}
          </select>
          {selected?.private && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-gold">
              <Lock className="h-3 w-3" /> Repository privat
            </p>
          )}
        </div>

        <div>
          <label htmlFor="branch-input" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <GitBranch className="h-3.5 w-3.5" /> Branch
          </label>
          <input
            id="branch-input"
            type="text"
            value={branch}
            onChange={(e) => onBranchChange(e.target.value)}
            placeholder="main"
            className="input-field font-mono"
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="commit-input" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <MessageSquare className="h-3.5 w-3.5" /> Commit Message
        </label>
        <input
          id="commit-input"
          type="text"
          value={commitMessage}
          onChange={(e) => onCommitMessageChange(e.target.value)}
          placeholder="feat: initial upload via ZIP pusher"
          maxLength={500}
          className="input-field"
        />
      </div>
    </div>
  );
}
