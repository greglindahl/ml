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
  createMockUpload,
  createMockUploadBatch,
  isActiveUpload,
  tickUpload,
  type ChunkedUpload,
} from "@/lib/mockUploadData";

/**
 * App-wide upload queue. Production keeps this in an NgRx feature slice
 * (`core/upload/state-upload-progress-window`) so the tray survives navigation;
 * a context does the same job here.
 */

const TICK_MS = 250;

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

  setCollapsed: (collapsed: boolean) => void;
  closeWindow: () => void;
  showWindow: () => void;

  /** Demo hooks so the failure treatments are reachable without waiting for one. */
  simulateNetworkDrop: (queueId: string) => void;
  simulateFailure: (queueId: string) => void;

  /**
   * Uploads that reached SUCCESS. The refresh / new-assets work reads this —
   * each one is an asset that has landed but that the library feed hasn't
   * surfaced yet.
   */
  completedUploads: ChunkedUpload[];
}

const UploadQueueContext = createContext<UploadQueueValue | null>(null);

export function UploadQueueProvider({ children }: { children: ReactNode }) {
  const [uploads, setUploads] = useState<ChunkedUpload[]>([]);
  const [isWindowVisible, setIsWindowVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Drive the simulation. One interval for the whole queue; it parks itself
  // when nothing is in flight so an idle tab isn't re-rendering four times a second.
  const lastTickRef = useRef<number>(Date.now());
  const needsTick = uploads.some(
    (u) => u.status === "PENDING" || u.status === "UPLOADING" || u.status === "PROCESSING",
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

  const simulateNetworkDrop = useCallback(
    (queueId: string) => {
      patch(queueId, { status: "RECONNECTING", speed: null });
    },
    [patch],
  );

  const simulateFailure = useCallback(
    (queueId: string) => {
      patch(queueId, {
        status: "FAILED",
        speed: null,
        errorMessage: "Network connection lost. Please retry when connection is restored.",
      });
    },
    [patch],
  );

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
   *   __uploadDemo.drop()    // first active upload → RECONNECTING
   *   __uploadDemo.fail()    // first active upload → FAILED (retry appears)
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
      list: () => uploads.map((u) => ({ queueId: u.queueId, file: u.filename, status: u.status })),
    };
  }, [uploads, simulateNetworkDrop, simulateFailure]);

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
      setCollapsed: setIsCollapsed,
      closeWindow,
      showWindow,
      simulateNetworkDrop,
      simulateFailure,
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
      closeWindow,
      showWindow,
      simulateNetworkDrop,
      simulateFailure,
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
