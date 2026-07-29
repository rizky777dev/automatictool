import JSZip from "jszip";
import type { ExtractedFile } from "@/types";
import {
  MAX_EXTRACTED_SIZE_BYTES,
  MAX_COMPRESSION_RATIO,
  MAX_ZIP_ENTRIES,
} from "./validation";

export class ZipSecurityError extends Error {}

/**
 * Daftar pola folder/file yang otomatis diabaikan saat push ke GitHub.
 * Dicocokkan terhadap tiap segmen path (bukan hanya nama file), jadi
 * "sub/node_modules/x.js" juga tersaring.
 */
const IGNORED_SEGMENTS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".turbo",
  ".cache",
  "coverage",
  ".DS_Store",
  "__pycache__",
  ".vscode",
  ".idea",
]);

const IGNORED_FILENAMES = new Set([".env", ".env.local", ".env.production", ".DS_Store", "Thumbs.db"]);

const IGNORED_FILENAME_PATTERNS: RegExp[] = [
  /^\.env(\..+)?$/i,
  /\.log$/i,
  /\.lock$/i, // package-lock, yarn.lock dsb — opsional besar, aman diskip
];

function isPathSafe(rawPath: string): boolean {
  // Tolak path absolut, drive letter Windows, dan ../ traversal
  if (rawPath.startsWith("/") || rawPath.startsWith("\\")) return false;
  if (/^[A-Za-z]:/.test(rawPath)) return false;
  const normalized = rawPath.replace(/\\/g, "/");
  const segments = normalized.split("/");
  if (segments.some((seg) => seg === "..")) return false;
  if (normalized.includes("\0")) return false;
  return true;
}

function shouldIgnore(normalizedPath: string): boolean {
  const segments = normalizedPath.split("/");
  const fileName = segments[segments.length - 1] ?? "";

  if (segments.some((seg) => IGNORED_SEGMENTS.has(seg))) return true;
  if (IGNORED_FILENAMES.has(fileName)) return true;
  if (IGNORED_FILENAME_PATTERNS.some((re) => re.test(fileName))) return true;

  return false;
}

export interface ExtractionResult {
  files: ExtractedFile[];
  skipped: string[];
  totalSize: number;
}

/**
 * Ekstrak ZIP sepenuhnya di memori (buffer), tanpa pernah menulis ke disk.
 * Melakukan validasi keamanan pada setiap entri sebelum diterima.
 */
export async function extractZipSafely(zipBuffer: Buffer): Promise<ExtractionResult> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(zipBuffer);
  } catch {
    throw new ZipSecurityError("File ZIP korup atau tidak valid.");
  }

  const entries = Object.values(zip.files);

  if (entries.length === 0) {
    throw new ZipSecurityError("File ZIP kosong.");
  }
  if (entries.length > MAX_ZIP_ENTRIES) {
    throw new ZipSecurityError(
      `File ZIP berisi terlalu banyak entri (${entries.length}). Maksimum ${MAX_ZIP_ENTRIES}.`
    );
  }

  const files: ExtractedFile[] = [];
  const skipped: string[] = [];
  let totalSize = 0;
  const compressedTotal = zipBuffer.length;

  for (const entry of entries) {
    const rawPath = entry.name;

    if (!isPathSafe(rawPath)) {
      // Path traversal / path absolut terdeteksi — seluruh ZIP ditolak,
      // bukan cuma entrinya, karena ini indikasi ZIP dibuat secara jahat.
      throw new ZipSecurityError(
        `Terdeteksi path berbahaya dalam ZIP: "${rawPath}". Proses dibatalkan demi keamanan.`
      );
    }

    const normalizedPath = rawPath.replace(/\\/g, "/").replace(/^\.?\//, "");

    if (entry.dir) continue;

    if (shouldIgnore(normalizedPath)) {
      skipped.push(normalizedPath);
      continue;
    }

    // Estimasi rasio kompresi per-entri sebagai proteksi zip-bomb.
    // JSZip menyimpan info internal ukuran uncompressed di _data bila tersedia.
    const uncompressedSizeGuess =
      (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;

    if (uncompressedSizeGuess > 0 && compressedTotal > 0) {
      const ratio = uncompressedSizeGuess / compressedTotal;
      if (ratio > MAX_COMPRESSION_RATIO) {
        throw new ZipSecurityError(
          `Rasio kompresi mencurigakan pada "${normalizedPath}" (kemungkinan zip bomb). Proses dibatalkan.`
        );
      }
    }

    const content = await entry.async("nodebuffer");
    totalSize += content.length;

    if (totalSize > MAX_EXTRACTED_SIZE_BYTES) {
      throw new ZipSecurityError(
        `Ukuran total hasil ekstraksi melebihi batas aman (${Math.round(
          MAX_EXTRACTED_SIZE_BYTES / 1024 / 1024
        )} MB). Kemungkinan zip bomb.`
      );
    }

    files.push({ path: normalizedPath, content, size: content.length });
  }

  if (files.length === 0) {
    throw new ZipSecurityError("Tidak ada file valid untuk di-push setelah filtering.");
  }

  return { files, skipped, totalSize };
}
