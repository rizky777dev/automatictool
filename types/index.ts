export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  html_url: string;
}

export interface ExtractedFile {
  path: string;
  content: Buffer;
  size: number;
}

/**
 * Urutan step ini merepresentasikan tahapan asli dari proses Git plumbing
 * (blob -> tree -> commit -> ref) yang benar-benar dijalankan aplikasi,
 * bukan sekadar label dekoratif. Dipakai juga untuk render "commit graph
 * rail" di UI sehingga progres yang ditampilkan selalu jujur/akurat.
 */
export type UploadStep =
  | "uploading" // upload ZIP dari browser ke Vercel Blob (client-side)
  | "validating"
  | "extracting"
  | "filtering"
  | "checking_branch"
  | "creating_blobs"
  | "creating_tree"
  | "creating_commit"
  | "updating_ref"
  | "done"
  | "error";

export interface UploadProgressEvent {
  step: UploadStep;
  message: string;
  progress: number; // 0-100
  detail?: Record<string, unknown>;
}

export interface PushResult {
  totalFiles: number;
  totalSizeBytes: number;
  skippedFiles: string[];
  commitUrl: string;
  repoUrl: string;
  branch: string;
  commitSha: string;
}
