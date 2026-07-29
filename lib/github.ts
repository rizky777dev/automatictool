import { Octokit } from "@octokit/rest";
import type { ExtractedFile, PushResult, UploadStep } from "@/types";

export function createOctokit(token: string): Octokit {
  // Token hanya hidup di memori proses request ini — tidak pernah ditulis
  // ke disk, database, atau log.
  return new Octokit({ auth: token, request: { timeout: 20000 } });
}

export async function verifyTokenAndListRepos(token: string) {
  const octokit = createOctokit(token);
  const { data: user } = await octokit.users.getAuthenticated();
  const repos = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
    per_page: 100,
    sort: "updated",
    visibility: "all",
  });
  return {
    login: user.login,
    repos: repos.map((r) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      private: r.private,
      default_branch: r.default_branch ?? "main",
      html_url: r.html_url,
    })),
  };
}

interface PushOptions {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  commitMessage: string;
  files: ExtractedFile[];
  createBranchIfMissing: boolean;
  onProgress?: (step: UploadStep, message: string, progress: number) => void;
}

export async function pushFilesToRepo(opts: PushOptions): Promise<PushResult> {
  const { token, owner, repo, branch, commitMessage, files, createBranchIfMissing, onProgress } = opts;
  const octokit = createOctokit(token);

  onProgress?.("checking_branch", "Memeriksa branch target...", 52);

  let baseSha: string | undefined;
  try {
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    baseSha = refData.object.sha;
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status === 404 && createBranchIfMissing) {
      // Branch belum ada — buat dari default branch repo
      const { data: repoData } = await octokit.repos.get({ owner, repo });
      const { data: defaultRef } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${repoData.default_branch}`,
      });
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branch}`,
        sha: defaultRef.object.sha,
      });
      baseSha = defaultRef.object.sha;
    } else {
      throw new Error(
        status === 404
          ? `Branch "${branch}" tidak ditemukan dan opsi buat-otomatis dimatikan.`
          : `Gagal mengakses branch: ${(err as Error).message}`
      );
    }
  }

  onProgress?.("creating_blobs", "Mengunggah blob file ke GitHub...", 58);

  const { data: baseCommit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: baseSha!,
  });

  // Upload tiap file sebagai blob. Dijalankan berurutan dengan batching
  // kecil agar tidak menabrak rate limit GitHub pada repo besar.
  const BATCH_SIZE = 8;
  const treeItems: { path: string; mode: "100644"; type: "blob"; sha: string }[] = [];

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (file) => {
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo,
          content: file.content.toString("base64"),
          encoding: "base64",
        });
        return { path: file.path, mode: "100644" as const, type: "blob" as const, sha: blob.sha };
      })
    );
    treeItems.push(...results);
    const pct = 58 + Math.round(((i + batch.length) / files.length) * 22);
    onProgress?.(
      "creating_blobs",
      `Mengunggah blob (${i + batch.length}/${files.length})...`,
      Math.min(pct, 80)
    );
  }

  onProgress?.("creating_tree", "Membuat Git Tree...", 87);

  const { data: newTree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseCommit.tree.sha,
    tree: treeItems,
  });

  onProgress?.("creating_commit", "Melakukan commit...", 92);

  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message: commitMessage,
    tree: newTree.sha,
    parents: [baseSha!],
  });

  onProgress?.("updating_ref", "Memperbarui referensi branch...", 96);

  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  });

  const totalSizeBytes = files.reduce((sum, f) => sum + f.size, 0);

  return {
    totalFiles: files.length,
    totalSizeBytes,
    skippedFiles: [],
    commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`,
    repoUrl: `https://github.com/${owner}/${repo}`,
    branch,
    commitSha: newCommit.sha,
  };
}
