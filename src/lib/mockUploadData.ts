/**
 * Mock multipart-upload model + simulation.
 *
 * Mirrors the production model in
 * `portal/web/greenflyPortal/src/app/core/upload/upload.model.ts` so the proto
 * exercises the same states the real uploader produces.
 *
 * The three timestamps are the point of this file: `createdAt` (upload START —
 * what prod orders All Assets by today, and why large files get buried),
 * `completedAt` (upload COMPLETION — Amber's proposed fix) and `capturedAt`
 * (when the shot was actually taken, stable regardless of transfer mechanics).
 * The refresh / new-assets work has to pick one; keeping all three on the mock
 * lets us try each without re-seeding.
 */

export type MultipartUploadStatus =
  | "PENDING"
  | "UPLOADING"
  | "PROCESSING"
  | "CANCELLED"
  | "FAILED"
  | "RECONNECTING"
  | "SUCCESS";

/** Prod: uploads still transferring or waiting to transfer. */
export const ACTIVE_UPLOAD_STATUSES: readonly MultipartUploadStatus[] = [
  "PENDING",
  "UPLOADING",
  "RECONNECTING",
];

/** Prod default part size when S3 init doesn't supply one. */
export const CHUNK_SIZE = 5 * 1024 * 1024;

/**
 * How long an upload sits in PROCESSING after the last chunk lands. This is the
 * window where the asset exists but isn't searchable or AI-tagged yet — the gap
 * the refresh pill is currently papering over.
 */
export const PROCESSING_MS = 2600;

export interface UploadChannel {
  name: string;
  initials: string;
}

export interface ChunkedUpload {
  queueId: string;
  uploadId: string;
  companyId: string;

  filename: string;
  fileSize: number;
  /** File.lastModified (ms). With name + size, what a reselected file must match to resume. */
  lastModified: number;
  kind: "image" | "video";

  status: MultipartUploadStatus;
  /** 0–100 */
  progress: number;
  completed: boolean;
  errorMessage: string | null;
  /** bytes per second, null when not transferring */
  speed: number | null;

  chunkSize: number;
  totalChunks: number;
  completedChunks: number;

  /** Upload started (prod's current ordering key). */
  createdAt: string;
  /** Last chunk landed + processing finished. Null until SUCCESS. */
  completedAt: string | null;
  /** When the media was captured. Independent of transfer. */
  capturedAt: string;

  needsFileReselection?: boolean;
  isResumed?: boolean;
  channel?: UploadChannel;

  /** Simulation-only: bytes transferred so far. */
  uploadedBytes: number;
  /** Simulation-only: bytes/sec this file transfers at. */
  throughput: number;
  /** Simulation-only: ms remaining in PROCESSING. */
  processingRemaining: number;

  /** Background auto-retry: which attempt is running (1-based), 0 when none. */
  autoRetryAttempt?: number;
  /** Simulation-only: ms until the current auto-retry attempt fires. */
  autoRetryRemaining?: number;
  /** Simulation-only: how many more attempts will fail before one succeeds. */
  failuresRemaining?: number;
}

/**
 * How many background retries run before a failure surfaces to the user.
 * Open question from the 9/30 call (once? 2-3?); needs engineering input.
 */
export const AUTO_RETRY_ATTEMPTS = 3;
/** Backoff before each attempt: 2s, 4s, 8s... */
export const autoRetryDelay = (attempt: number) => 1000 * 2 ** attempt;

export const autoRetryMessage = (attempt: number) =>
  `Connection lost. Retrying automatically (${attempt} of ${AUTO_RETRY_ATTEMPTS})…`;
export const RETRIES_EXHAUSTED_MESSAGE = `Upload failed after ${AUTO_RETRY_ATTEMPTS} retries. Click the refresh icon to try again.`;

const CHANNELS: UploadChannel[] = [
  { name: "Team Media", initials: "TM" },
  { name: "Game Day", initials: "GD" },
  { name: "Player Social", initials: "PS" },
];

const IMAGE_NAMES = [
  "warmups_sideline",
  "tunnel_walk",
  "first_quarter_action",
  "crowd_reaction",
  "bench_celebration",
  "postgame_handshake",
  "locker_room_huddle",
  "coach_sideline",
];

const VIDEO_NAMES = [
  "q1_highlight_reel",
  "press_conference_full",
  "sideline_iso_cam",
  "drone_stadium_flyover",
  "postgame_interview",
  "warmup_bcam_master",
];

const MB = 1024 * 1024;

let seq = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${(seq++).toString(36)}`;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * MB) return `${(bytes / (1024 * MB)).toFixed(1)} GB`;
  if (bytes >= MB) return `${(bytes / MB).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function formatSpeed(bytesPerSecond: number): string {
  const mb = bytesPerSecond / MB;
  const kb = bytesPerSecond / 1024;
  if (mb >= 1) return `${mb.toFixed(1)} MB/s`;
  if (kb >= 1) return `${kb.toFixed(1)} KB/s`;
  return `${bytesPerSecond.toFixed(0)} B/s`;
}

/**
 * Build one queued upload. Sizes are deliberately lopsided — phone stills are a
 * few MB and finish almost immediately, camera video runs to hundreds of MB and
 * lands minutes later. That spread is what makes start-time ordering bury the
 * big files.
 */
export function createMockUpload(overrides: Partial<ChunkedUpload> = {}): ChunkedUpload {
  const kind: "image" | "video" = overrides.kind ?? (Math.random() < 0.6 ? "image" : "video");

  const fileSize =
    overrides.fileSize ??
    (kind === "image"
      ? Math.round(rand(2 * MB, 26 * MB))
      : Math.round(rand(80 * MB, 620 * MB)));

  const filename =
    overrides.filename ??
    (kind === "image"
      ? `${pick(IMAGE_NAMES)}_${Math.floor(rand(1000, 9999))}.jpg`
      : `${pick(VIDEO_NAMES)}_${Math.floor(rand(100, 999))}.mov`);

  const now = Date.now();
  const chunkSize = overrides.chunkSize ?? CHUNK_SIZE;

  return {
    queueId: nextId("q"),
    uploadId: nextId("s3"),
    companyId: "acme",

    filename,
    fileSize,
    // Saved to disk a little before it was queued.
    lastModified: now - Math.round(rand(60_000, 3 * 60 * 60_000)),
    kind,

    status: "PENDING",
    progress: 0,
    completed: false,
    errorMessage: null,
    speed: null,

    chunkSize,
    totalChunks: Math.max(1, Math.ceil(fileSize / chunkSize)),
    completedChunks: 0,

    createdAt: new Date(now).toISOString(),
    completedAt: null,
    // Captured shortly before the upload kicked off.
    capturedAt: new Date(now - Math.round(rand(30_000, 20 * 60_000))).toISOString(),

    channel: pick(CHANNELS),

    uploadedBytes: 0,
    // Camera-card transfers run slower per file than a phone on wifi.
    throughput: kind === "video" ? rand(2.5 * MB, 9 * MB) : rand(1.5 * MB, 6 * MB),
    processingRemaining: PROCESSING_MS,

    ...overrides,
  };
}

/** A batch with a realistic mix — several quick stills plus a couple of long video transfers. */
export function createMockUploadBatch(count = 6): ChunkedUpload[] {
  return Array.from({ length: count }, (_, i) =>
    createMockUpload({ kind: i % 3 === 2 ? "video" : "image" }),
  );
}

/**
 * Advance one upload by `dt` milliseconds. Pure-ish: returns a new object when
 * anything changed, the same reference when it didn't, so React can bail out.
 */
export function tickUpload(upload: ChunkedUpload, dt: number): ChunkedUpload {
  switch (upload.status) {
    case "PENDING":
      return { ...upload, status: "UPLOADING" };

    case "UPLOADING": {
      const uploadedBytes = Math.min(upload.fileSize, upload.uploadedBytes + upload.throughput * (dt / 1000));
      const completedChunks = Math.min(upload.totalChunks, Math.floor(uploadedBytes / upload.chunkSize));
      const progress = Math.min(100, (uploadedBytes / upload.fileSize) * 100);

      if (uploadedBytes >= upload.fileSize) {
        return {
          ...upload,
          uploadedBytes: upload.fileSize,
          completedChunks: upload.totalChunks,
          progress: 100,
          speed: null,
          status: "PROCESSING",
        };
      }

      return {
        ...upload,
        uploadedBytes,
        completedChunks,
        progress,
        // Jitter so the readout looks like a real connection rather than a ramp.
        speed: upload.throughput * rand(0.82, 1.18),
      };
    }

    case "PROCESSING": {
      const processingRemaining = upload.processingRemaining - dt;
      if (processingRemaining > 0) return { ...upload, processingRemaining };

      return {
        ...upload,
        processingRemaining: 0,
        status: "SUCCESS",
        completed: true,
        progress: 100,
        speed: null,
        completedAt: new Date().toISOString(),
      };
    }

    // Background auto-retry: count down to the next attempt, then either
    // resume or, once attempts run out, surface the failure.
    case "RECONNECTING": {
      if (!upload.autoRetryAttempt) return upload; // a plain drop from elsewhere holds as before
      const remaining = (upload.autoRetryRemaining ?? 0) - dt;
      if (remaining > 0) return { ...upload, autoRetryRemaining: remaining };

      const failuresRemaining = upload.failuresRemaining ?? 0;
      if (failuresRemaining === 0) {
        return { ...upload, status: "UPLOADING", autoRetryAttempt: 0, autoRetryRemaining: 0, errorMessage: null };
      }
      if (upload.autoRetryAttempt >= AUTO_RETRY_ATTEMPTS) {
        return {
          ...upload,
          status: "FAILED",
          autoRetryAttempt: 0,
          autoRetryRemaining: 0,
          failuresRemaining: 0,
          errorMessage: RETRIES_EXHAUSTED_MESSAGE,
        };
      }
      const attempt = upload.autoRetryAttempt + 1;
      return {
        ...upload,
        autoRetryAttempt: attempt,
        autoRetryRemaining: autoRetryDelay(attempt),
        failuresRemaining: failuresRemaining - 1,
      };
    }

    // FAILED / CANCELLED / SUCCESS hold until the user acts.
    default:
      return upload;
  }
}

/** Prod sorts uploads needing attention to the top, otherwise keeps queue order. */
export function sortUploadsForDisplay(uploads: ChunkedUpload[]): ChunkedUpload[] {
  return [...uploads].sort((a, b) => {
    const aNeeds = a.status === "FAILED" || a.status === "RECONNECTING";
    const bNeeds = b.status === "FAILED" || b.status === "RECONNECTING";
    if (aNeeds && !bNeeds) return -1;
    if (!aNeeds && bNeeds) return 1;
    return 0;
  });
}

export const isActiveUpload = (upload: ChunkedUpload) =>
  ACTIVE_UPLOAD_STATUSES.includes(upload.status);

/** Prod's copy for an upload restored after the page went away mid-transfer. */
export const INTERRUPTED_MESSAGE = "Upload interrupted. Please click the refresh icon to reselect file.";
export const NOT_STARTED_MESSAGE = "Upload was queued but not started. Please click the refresh icon to reselect file.";

/** Failed with the file still in memory: a plain retry picks up where it stopped. */
export const isRetryable = (upload: ChunkedUpload) => upload.status === "FAILED" && !upload.needsFileReselection;

/** Interrupted: the browser lost the file handle, so the user has to pick it again (inline, per row). */
export const needsReselection = (upload: ChunkedUpload) => upload.status === "FAILED" && !!upload.needsFileReselection;

export interface FileDescriptor {
  name: string;
  size: number;
  lastModified: number;
}

/** Prod's copy when a single-row reselect picks the wrong file. */
export const MISMATCH_MESSAGE = "Selected file doesn't match the original. Please select the correct file.";
/** Prod's single-row check: name + size must agree; a newer lastModified restarts from scratch. */
export function checkSingleReselect(upload: ChunkedUpload, file: FileDescriptor): "resume" | "restart" | "mismatch" {
  if (file.name !== upload.filename || file.size !== upload.fileSize) return "mismatch";
  return file.lastModified === upload.lastModified ? "resume" : "restart";
}
