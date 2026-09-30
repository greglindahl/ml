import { useCallback, useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUploadQueue } from "@/hooks/useUploadQueue";
import { UploadProgressWindowItem } from "@/components/UploadProgressWindowItem";
import { CancelUploadsDialog } from "@/components/CancelUploadsDialog";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { needsReselection, sortUploadsForDisplay } from "@/lib/mockUploadData";
import { cn } from "@/lib/utils";

/**
 * Floating upload tray. Mirrors production's `upload-progress-window`:
 * bottom-right on desktop at a fixed 25rem, full-width bottom sheet on mobile,
 * draggable by the header within the viewport, collapsible to the header alone,
 * and gated behind a confirm dialog when closing would abandon live transfers.
 *
 * Prod uses CDK drag-drop; this does the same job with pointer events so the
 * proto doesn't take a drag dependency for one free-drag surface.
 */
export function UploadProgressWindow() {
  const {
    uploads,
    activeCount,
    failedCount,
    isWindowVisible,
    isCollapsed,
    setCollapsed,
    closeWindow,
    abortUpload,
    dismissUpload,
    retryUpload,
    retryAll,
    reselectFile,
    startUploadsForFiles,
  } = useUploadQueue();

  const isMobile = useIsMobile();
  const windowRef = useRef<HTMLDivElement>(null);

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOrigin = useRef({ pointerX: 0, pointerY: 0, offsetX: 0, offsetY: 0 });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const sorted = sortUploadsForDisplay(uploads);
  const reselectCount = uploads.filter(needsReselection).length;
  const reselectInputRef = useRef<HTMLInputElement>(null);
  const [duplicates, setDuplicates] = useState<File[]>([]);

  // Surfaces only once background auto-retry has given up. Kept for the 10/1 dev
  // discussion (may be redundant then): in-memory failures restart now; if any
  // were interrupted, the same click opens one picker to reselect them all.
  const handleRetryAll = () => {
    const { retried } = retryAll();
    if (reselectCount > 0) {
      reselectInputRef.current?.click();
    } else {
      toast({ title: `Retrying ${retried} ${retried === 1 ? "upload" : "uploads"}` });
    }
  };

  const handleFilesReselected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // so picking the same files again still fires
    if (files.length === 0) return;
    const { resumed, alreadyUploaded, unmatchedFiles, stillWaiting } = retryAll(files);
    if (alreadyUploaded.length > 0) setDuplicates(alreadyUploaded);
    const notes = [
      unmatchedFiles > 0 && `${unmatchedFiles} selected ${unmatchedFiles === 1 ? "file didn't" : "files didn't"} match a failed upload.`,
      stillWaiting > 0 && `${stillWaiting} ${stillWaiting === 1 ? "upload still needs its file" : "uploads still need their files"}; reselect ${stillWaiting === 1 ? "it" : "them"} from the row.`,
    ].filter(Boolean);
    if (resumed === 0 && notes.length === 0) return; // only duplicates: the dialog says it all
    toast({
      title: resumed > 0 ? `Resuming ${resumed} ${resumed === 1 ? "upload" : "uploads"}` : "No matching files found",
      description: notes.join(" ") || undefined,
    });
  };

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      // Don't start a drag from the header's buttons.
      if ((event.target as HTMLElement).closest("button")) return;
      if (isMobile) return;

      event.currentTarget.setPointerCapture(event.pointerId);
      dragOrigin.current = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        offsetX: offset.x,
        offsetY: offset.y,
      };
      setIsDragging(true);
    },
    [isMobile, offset.x, offset.y],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;

      const nextX = dragOrigin.current.offsetX + (event.clientX - dragOrigin.current.pointerX);
      const nextY = dragOrigin.current.offsetY + (event.clientY - dragOrigin.current.pointerY);

      // Keep the window inside the viewport, same intent as prod's
      // cdkDragBoundary + adjustPositionIfOutOfBounds.
      const rect = windowRef.current?.getBoundingClientRect();
      if (!rect) {
        setOffset({ x: nextX, y: nextY });
        return;
      }

      const baseLeft = rect.left - offset.x;
      const baseTop = rect.top - offset.y;

      const minX = -baseLeft;
      const maxX = window.innerWidth - rect.width - baseLeft;
      const minY = -baseTop;
      const maxY = window.innerHeight - rect.height - baseTop;

      setOffset({
        x: Math.min(Math.max(nextX, minX), maxX),
        y: Math.min(Math.max(nextY, minY), maxY),
      });
    },
    [isDragging, offset.x, offset.y],
  );

  const endDrag = useCallback(() => setIsDragging(false), []);

  // If the viewport shrinks under a dragged window, pull it back into view.
  useEffect(() => {
    if (isMobile) return;

    const onResize = () => {
      const rect = windowRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (rect.top >= 0 && rect.left >= 0 && rect.right <= window.innerWidth) return;
      setOffset({ x: 0, y: 0 });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isMobile]);

  const handleCloseRequest = useCallback(() => {
    // Prod closes silently when there's no unfinished work to lose.
    if (activeCount === 0 && failedCount === 0) {
      closeWindow();
      return;
    }
    setConfirmOpen(true);
  }, [activeCount, failedCount, closeWindow]);

  if (!isWindowVisible) return null;

  return (
    <>
      <div
        ref={windowRef}
        className={cn(
          "fixed bg-card rounded-lg shadow-lg border z-50 overflow-hidden",
          // Mobile: full-width sheet pinned to the bottom.
          "left-0 right-0 bottom-0 rounded-b-none",
          // Desktop: fixed width, bottom-right.
          "md:left-auto md:right-6 md:bottom-6 md:w-[25rem] md:max-w-[calc(100vw-3rem)] md:rounded-b-lg",
          isDragging ? "select-none" : "transition-[height] duration-200",
        )}
        style={isMobile ? undefined : { transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        <div
          className={cn(
            "flex items-center justify-between p-3 border-b bg-card select-none",
            !isMobile && (isDragging ? "cursor-grabbing" : "cursor-move"),
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="mb-0 font-semibold text-[15px]">Uploads</span>
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-medium tabular-nums">
              {uploads.length}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-2">
            {!isMobile && (
              <i
                className="bi bi-grip-horizontal text-muted-foreground w-4 h-4 inline-flex items-center justify-center leading-none"
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              className="p-1 hover:opacity-70 transition-opacity"
              onClick={() => setCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? "Expand" : "Collapse"}
            >
              <i
                className={cn(
                  "bi w-4 h-4 inline-flex items-center justify-center leading-none",
                  isCollapsed ? "bi-chevron-down" : "bi-chevron-up",
                )}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              className="p-1 hover:opacity-70 transition-opacity"
              onClick={handleCloseRequest}
              aria-label="Close"
            >
              <i
                className="bi bi-x-lg w-4 h-4 inline-flex items-center justify-center leading-none"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* Bulk retry, pinned above the rows (PORTAL-13077). Row ↻ still retries one. */}
        {!isCollapsed && failedCount > 0 && (
          <div className="border-b bg-primary/5 flex items-start gap-2 px-3 py-2.5" role="status">
            <i className="bi bi-exclamation-circle text-primary w-4 h-4 mt-px inline-flex items-center justify-center leading-none flex-shrink-0" aria-hidden="true" />
            <p className="flex-1 min-w-0 text-[12px] leading-snug text-foreground">
              {failedCount} {failedCount === 1 ? "upload" : "uploads"} failed.
              {/* The why lives on each row as an inline error (9/30 call). */}
            </p>
            <button
              type="button"
              onClick={handleRetryAll}
              className="flex-shrink-0 text-[12px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              Retry All
            </button>
            <input ref={reselectInputRef} type="file" multiple className="hidden" onChange={handleFilesReselected} aria-hidden="true" tabIndex={-1} />
          </div>
        )}

        {!isCollapsed && (
          <div className="overflow-auto bg-card max-h-[25rem] max-md:max-h-[50vh]">
            {sorted.map((upload) => (
              <div key={upload.queueId} className="border-b last:border-b-0">
                <UploadProgressWindowItem
                  upload={upload}
                  onAbort={() => abortUpload(upload.queueId)}
                  onDismiss={() => dismissUpload(upload.queueId)}
                  onRetry={() => retryUpload(upload.queueId)}
                  onReselect={(file) => reselectFile(upload.queueId, file)}
                />
              </div>
            ))}

            {sorted.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-[13px]">No uploads</div>
            )}
          </div>
        )}
      </div>

      {/* Duplicate check against recent successes, e.g. "this song already exists: add again or skip?" */}
      <AlertDialog open={duplicates.length > 0} onOpenChange={(open) => !open && setDuplicates([])}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {duplicates.length === 1 ? "This file was already uploaded" : `${duplicates.length} files were already uploaded`}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  {duplicates.length === 1 ? "It's" : "They're"} already in the library. Uploading again will add a duplicate.
                </p>
                <ul className="max-h-40 overflow-auto text-foreground text-[13px] list-disc pl-5">
                  {duplicates.map((f) => (
                    <li key={`${f.name}|${f.size}|${f.lastModified}`} className="truncate">{f.name}</li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Skip</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                startUploadsForFiles(duplicates);
                setDuplicates([]);
              }}
            >
              Upload Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CancelUploadsDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        completedCount={uploads.filter((u) => u.completed).length}
        totalCount={uploads.length}
        activeCount={activeCount}
        failedCount={failedCount}
        onConfirm={() => {
          setConfirmOpen(false);
          closeWindow();
        }}
        onMinimize={() => {
          setConfirmOpen(false);
          setCollapsed(true);
        }}
      />
    </>
  );
}

