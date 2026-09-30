/**
 * Local storage for the upload tray, after prod's
 * `core/upload/upload-persistence.service.ts`: keyed per user, entries pruned
 * after the S3 multipart session's 12h TTL.
 *
 * Unfinished uploads are kept so a refresh can bring the rows back. The
 * browser can't keep the File itself, so they return needing reselection. An
 * entry lives until the upload succeeds or the user clicks X / closes the tray.
 */

import type { ChunkedUpload } from "@/lib/mockUploadData";

export const UPLOAD_TTL_MS = 12 * 60 * 60 * 1000;

// Prototype stand-in for the signed-in user's id.
const CURRENT_USER_ID = "proto-user";
const RESUMABLE_KEY = `gf-resumable-uploads-${CURRENT_USER_ID}`;

const read = <T>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const write = (key: string, value: unknown[]) => {
  try {
    if (value.length === 0) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the tray still works, it just won't survive a refresh.
  }
};

/** Unfinished uploads worth bringing back after a refresh. */
export const isPersistable = (u: ChunkedUpload) => u.status !== "SUCCESS" && u.status !== "CANCELLED" && u.status !== "PROCESSING";

export function loadResumable(now = Date.now()): ChunkedUpload[] {
  const live = read<ChunkedUpload>(RESUMABLE_KEY).filter((u) => now - new Date(u.createdAt).getTime() < UPLOAD_TTL_MS);
  write(RESUMABLE_KEY, live); // prune the expired ones, as prod does
  return live;
}

export function saveResumable(uploads: ChunkedUpload[]) {
  // Speed and throughput are live simulation state, not worth keeping.
  write(RESUMABLE_KEY, uploads.filter(isPersistable).map((u) => ({ ...u, speed: null })));
}
