/**
 * Local storage for the upload tray, after prod's
 * `core/upload/upload-persistence.service.ts`: keyed per user, entries pruned
 * after the S3 multipart session's 12h TTL.
 *
 * Two lists:
 * - resumable: unfinished uploads, so a refresh can bring the rows back. The
 *   browser can't keep the File itself, so they return needing reselection.
 *   An entry lives until the upload succeeds or the user clicks X / closes the tray.
 * - history: a short-lived record of uploads that succeeded, metadata only.
 *   Prod doesn't keep this yet (call notes, PORTAL-13077); it's what lets a
 *   bulk reselect warn "already uploaded" instead of making a duplicate.
 */

import type { ChunkedUpload, FileDescriptor } from "@/lib/mockUploadData";

export const UPLOAD_TTL_MS = 12 * 60 * 60 * 1000;

// Prototype stand-in for the signed-in user's id.
const CURRENT_USER_ID = "proto-user";
const RESUMABLE_KEY = `gf-resumable-uploads-${CURRENT_USER_ID}`;
const HISTORY_KEY = `gf-upload-history-${CURRENT_USER_ID}`;

export interface UploadHistoryEntry extends FileDescriptor {
  completedAt: number;
}

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

// Resumable ---------------------------------------------------------------

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

// History -----------------------------------------------------------------

export function loadHistory(now = Date.now()): UploadHistoryEntry[] {
  const live = read<UploadHistoryEntry>(HISTORY_KEY).filter((h) => now - h.completedAt < UPLOAD_TTL_MS);
  write(HISTORY_KEY, live);
  return live;
}

export function recordSuccesses(uploads: ChunkedUpload[]) {
  const history = loadHistory();
  const seen = new Set(history.map(historyKey));
  const added = uploads
    .map((u) => ({ name: u.filename, size: u.fileSize, lastModified: u.lastModified, completedAt: Date.now() }))
    .filter((h) => !seen.has(historyKey(h)));
  if (added.length > 0) write(HISTORY_KEY, [...history, ...added]);
}

export const historyKey = (f: FileDescriptor) => `${f.name}|${f.size}|${f.lastModified}`;
