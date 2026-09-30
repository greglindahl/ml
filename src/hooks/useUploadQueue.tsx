import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AUTO_RETRY_ATTEMPTS,
  RETRIES_EXHAUSTED_MESSAGE,
  INTERRUPTED_MESSAGE,
  autoRetryDelay,
  MISMATCH_MESSAGE,
  NOT_STARTED_MESSAGE,
  checkSingleReselect,
  createMockUpload,
  createMockUploadBatch,
  isActiveUpload,
  isRetryable,
  tickUpload,
  type ChunkedUpload,
} from "@/lib/mockUploadData";
import { loadResumable, saveResumable } from "@/lib/uploadPersistence";

/**
 * App-wide upload queue. Production keeps this in an NgRx feature slice
 * (`core/upload/state-upload-progress-window`) so the tray survives navigation;
 * a context does the same job here.
 */

const TICK_MS = 250;

// Resume from where it stopped: the tick carries on from uploadedBytes, so
// the bar starts at its prior progress rather than 0.
const resume = (u: ChunkedUpload): ChunkedUpload => ({
  ...u,
  status: "UPLOADING",
  errorMessage: null,
  needsFileReselection: false,
  isResumed: true,
});

/** What a refresh leaves behind: the File is gone, so the row needs it reselected. */
const asInterrupted = (u: ChunkedUpload): ChunkedUpload => {
  const confirmedBytes = u.completedChunks * u.chunkSize;
  return {
    ...u,
    status: "FAILED",
    speed: null,
    needsFileReselection: true,
    isResumed: true,
    uploadedBytes: confirmedBytes,
    progress: (confirmedBytes / u.fileSize) * 100,
    errorMessage: u.completedChunks > 0 ? INTERRUPTED_MESSAGE : NOT_STARTED_MESSAGE,
  };
};

interface UploadQueueValue {
  uploads: ChunkedUpload[];
  activeCount: number;
  failedCount: number;
  hasActiveUploads: boolean;

  isWindowVisible: boolean;
  isCollapsed: boolean;

  /** Queue a batch and show the tray. */
  startUploads: (count?: number) => void;
  /** Queue specific files (used by the upload modal's picker/drop). */
  startUploadsForFiles: (files: File[]) => void;

  abortUpload: (queueId: string) => void;
  dismissUpload: (queueId: string) => void;
  retryUpload: (queueId: string) => void;
  /** Banner "Retry All": restart every failure whose file is still in memory. Returns how many. */
  retryAll: () => number;
  /** Row ↻ on an interrupted upload: prod's single-file reselect. */
  reselectFile: (queueId: string, file: File) => void;

  setCollapsed: (collapsed: boolean) => void;
  closeWindow: () => void;
  showWindow: () => void;

  /** Demo hooks so the failure treatments are reachable without waiting for one. */
  simulateNetworkDrop: (queueId: string) => void;
  simulateFailure: (queueId: string) => void;
  simulateInterrupt: () => number;

  /**
   * Uploads that reached SUCCESS. The refresh / new-assets work reads this —
   * each one is an asset that has landed but that the library feed hasn't
   * surfaced yet.
   */
  completedUploads: ChunkedUpload[];
}

const UploadQueueContext = createContext<UploadQueueValue | null>(null);

export function UploadQueueProvider({ children }: { children: ReactNode }) {
  // Unfinished uploads from before a refresh come back needing their files.
  const [uploads, setUploads] = useState<ChunkedUpload[]>(() => loadResumable().map(asInterrupted));
  const [isWindowVisible, setIsWindowVisible] = useState(() => uploads.length > 0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Bulk actions report counts synchronously; read the latest queue without re-creating them.
  const uploadsRef = useRef(uploads);
  uploadsRef.current = uploads;

  // Drive the simulation. One interval for the whole queue; it parks itself
  // when nothing is in flight so an idle tab isn't re-rendering four times a second.
  const lastTickRef = useRef<number>(Date.now());
  const needsTick = uploads.some(
    (u) =>
      u.status === "PENDING" ||
      u.status === "UPLOADING" ||
      u.status === "PROCESSING" ||
      (u.status === "RECONNECTING" && !!u.autoRetryAttempt),
  );

  useEffect(() => {
    if (!needsTick) return;

    lastTickRef.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;

      setUploads((prev) => {
        let changed = false;
        const next = prev.map((upload) => {
          const advanced = tickUpload(upload, dt);
          if (advanced !== upload) changed = true;
          return advanced;
        });
        return changed ? next : prev;
      });
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [needsTick]);

  // Keep local storage in step with the queue. Skip writes while only progress
  // numbers move, so the 250ms tick isn't serializing constantly.
  const persistedRef = useRef("");
  useEffect(() => {
    const signature = uploads.map((u) => `${u.queueId}:${u.status}:${u.completedChunks}`).join(",");
    if (signature === persistedRef.current) return;
    persistedRef.current = signature;
    saveResumable(uploads);
  }, [uploads]);

  const startUploads = useCallback((count = 6) => {
    setUploads((prev) => [...prev, ...createMockUploadBatch(count)]);
    setIsWindowVisible(true);
    setIsCollapsed(false);
  }, []);

  const startUploadsForFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;
    setUploads((prev) => [
      ...prev,
      ...files.map((file) =>
        createMockUpload({
          filename: file.name,
          fileSize: file.size || undefined,
          // Real picks keep their real lastModified so reviewers can reselect the same files.
          lastModified: file.lastModified,
          kind: file.type.startsWith("video") ? "video" : "image",
        }),
      ),
    ]);
    setIsWindowVisible(true);
    setIsCollapsed(false);
  }, []);

  const patch = useCallback((queueId: string, change: Partial<ChunkedUpload>) => {
    setUploads((prev) => prev.map((u) => (u.queueId === queueId ? { ...u, ...change } : u)));
  }, []);

  const abortUpload = useCallback(
    (queueId: string) => {
      patch(queueId, { status: "CANCELLED", completed: false, speed: null, errorMessage: null });
      // Prod aborts the S3 session and drops the row; nothing to abort here.
      setUploads((prev) => prev.filter((u) => u.queueId !== queueId));
    },
    [patch],
  );

  const dismissUpload = useCallback((queueId: string) => {
    setUploads((prev) => prev.filter((u) => u.queueId !== queueId));
  }, []);

  const retryUpload = useCallback(
    (queueId: string) => {
      patch(queueId, {
        status: "UPLOADING",
        errorMessage: null,
        needsFileReselection: false,
      });
    },
    [patch],
  );

  const retryAll = useCallback(() => {
    const retried = uploadsRef.current.filter(isRetryable).length;
    setUploads((prev) => prev.map((u) => (isRetryable(u) ? resume(u) : u)));
    return retried;
  }, []);

  const reselectFile = useCallback((queueId: string, file: File) => {
    setUploads((prev) =>
      prev.map((u) => {
        if (u.queueId !== queueId) return u;
        switch (checkSingleReselect(u, file)) {
          case "mismatch":
            return { ...u, errorMessage: MISMATCH_MESSAGE };
          case "resume":
            return resume(u);
          // Prod restarts a changed file from scratch without asking (the ticket wants a choice here).
          case "restart":
            return { ...resume(u), lastModified: file.lastModified, uploadedBytes: 0, completedChunks: 0, progress: 0 };
        }
      }),
    );
  }, []);

  /**
   * What a reload mid-transfer leaves behind in prod: in-flight rows come back
   * FAILED + needsFileReselection, progress kept at their confirmed parts.
   */
  const simulateInterrupt = useCallback(() => {
    const count = uploadsRef.current.filter(isActiveUpload).length;
    setUploads((prev) => prev.map((u) => (isActiveUpload(u) ? asInterrupted(u) : u)));
    setIsWindowVisible(true);
    setIsCollapsed(false);
    return count;
  }, []);

  // A dropped connection goes into background auto-retry first; the user only
  // sees a failure (and the Retry All banner) once the attempts run out.
  const startAutoRetry = useCallback(
    (queueId: string, failures: number) => {
      patch(queueId, {
        status: "RECONNECTING",
        speed: null,
        autoRetryAttempt: 1,
        autoRetryRemaining: autoRetryDelay(1),
        failuresRemaining: failures,
      });
    },
    [patch],
  );

  /** Transient drop: the first background retry gets it going again. */
  const simulateNetworkDrop = useCallback((queueId: string) => startAutoRetry(queueId, 0), [startAutoRetry]);

  /** Hard failure: every background retry fails, then the row surfaces as FAILED. */
  const simulateFailure = useCallback((queueId: string) => startAutoRetry(queueId, AUTO_RETRY_ATTEMPTS), [startAutoRetry]);

  /**
   * Design-review snapshot: one row in each state the new flow produces, so the
   * inline treatments can be compared side by side without waiting on timers.
   */
  const showScenario = useCallback(() => {
    const MB = 1024 * 1024;
    const part = (size: number, pct: number) => {
      const chunkSize = 5 * MB;
      const completedChunks = Math.floor((size * pct) / chunkSize);
      return { fileSize: size, completedChunks, uploadedBytes: completedChunks * chunkSize, progress: ((completedChunks * chunkSize) / size) * 100 };
    };
    setUploads([
      // Needs the file again (after a refresh): the reselect ask, inline.
      asInterrupted(createMockUpload({ filename: "press_conference_full_204.mov", kind: "video", ...part(480 * MB, 0.62) })),
      // Background retries used up.
      createMockUpload({
        filename: "tunnel_walk_4410.jpg",
        kind: "image",
        ...part(24 * MB, 0.4),
        status: "FAILED",
        errorMessage: RETRIES_EXHAUSTED_MESSAGE,
      }),
      // Retrying in the background: the user doesn't need to act yet. Parked
      // on attempt 2 (no countdown) so it holds still for the call.
      createMockUpload({ filename: "q1_highlight_reel_318.mov", kind: "video", ...part(310 * MB, 0.35), status: "RECONNECTING", autoRetryAttempt: 2, autoRetryRemaining: Infinity, failuresRemaining: 1 }),
      createMockUpload({ filename: "crowd_reaction_7712.jpg", kind: "image", fileSize: 18 * MB }),
      createMockUpload({ filename: "bench_celebration_2291.jpg", kind: "image", ...part(9 * MB, 1), status: "SUCCESS", completed: true, progress: 100, completedAt: new Date().toISOString() }),
    ]);
    setIsWindowVisible(true);
    setIsCollapsed(false);
  }, []);

  const closeWindow = useCallback(() => {
    setUploads([]);
    setIsWindowVisible(false);
  }, []);

  const showWindow = useCallback(() => setIsWindowVisible(true), []);

  const activeCount = uploads.filter(isActiveUpload).length;
  const failedCount = uploads.filter((u) => u.status === "FAILED").length;
  const completedUploads = useMemo(() => uploads.filter((u) => u.completed), [uploads]);

  /**
   * Demo handles for design review. The failure treatments (RECONNECTING, FAILED
   * + retry) are real states the prod tray renders, but nothing in a happy-path
   * simulation reaches them. Kept off the tray chrome so it stays a faithful
   * copy; drive them from the console instead:
   *
   *   __uploadDemo.drop()    // first active upload drops; the first background retry recovers it
   *   __uploadDemo.fail()    // first active upload drops; every background retry fails → FAILED
   *   __uploadDemo.scenario()  // every state side by side, for design review
   *   __uploadDemo.interrupt() // every in-flight upload → interrupted, needs file reselection
   *   __uploadDemo.list()    // queueIds + statuses
   */
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__uploadDemo = {
      drop: (queueId?: string) => {
        const target = queueId ?? uploads.find(isActiveUpload)?.queueId;
        if (target) simulateNetworkDrop(target);
        return target ?? "no active upload";
      },
      fail: (queueId?: string) => {
        const target = queueId ?? uploads.find(isActiveUpload)?.queueId;
        if (target) simulateFailure(target);
        return target ?? "no active upload";
      },
      scenario: () => {
        showScenario();
        return "tray seeded: reselect, retries used up, retrying, uploading, done";
      },
      interrupt: () => `${simulateInterrupt()} uploads interrupted`,
      list: () => uploads.map((u) => ({ queueId: u.queueId, file: u.filename, status: u.status })),
    };
  }, [uploads, simulateNetworkDrop, simulateFailure, simulateInterrupt, showScenario]);

  // Prod warns before unload while transfers are in flight.
  useEffect(() => {
    if (activeCount === 0) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [activeCount]);

  const value = useMemo<UploadQueueValue>(
    () => ({
      uploads,
      activeCount,
      failedCount,
      hasActiveUploads: activeCount > 0,
      isWindowVisible,
      isCollapsed,
      startUploads,
      startUploadsForFiles,
      abortUpload,
      dismissUpload,
      retryUpload,
      retryAll,
      reselectFile,
      setCollapsed: setIsCollapsed,
      closeWindow,
      showWindow,
      simulateNetworkDrop,
      simulateFailure,
      simulateInterrupt,
      completedUploads,
    }),
    [
      uploads,
      activeCount,
      failedCount,
      isWindowVisible,
      isCollapsed,
      startUploads,
      startUploadsForFiles,
      abortUpload,
      dismissUpload,
      retryUpload,
      retryAll,
      reselectFile,
      closeWindow,
      showWindow,
      simulateNetworkDrop,
      simulateFailure,
      simulateInterrupt,
      completedUploads,
    ],
  );

  return <UploadQueueContext.Provider value={value}>{children}</UploadQueueContext.Provider>;
}

export function useUploadQueue(): UploadQueueValue {
  const ctx = useContext(UploadQueueContext);
  if (!ctx) throw new Error("useUploadQueue must be used within an UploadQueueProvider");
  return ctx;
}
