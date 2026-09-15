import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ACTIVE_UPLOAD_STATUSES,
  formatSpeed,
  type ChunkedUpload,
} from "@/lib/mockUploadData";

interface UploadProgressWindowItemProps {
  upload: ChunkedUpload;
  onAbort: () => void;
  onDismiss: () => void;
  onRetry: () => void;
}

/** Short relative time — uploads live on a seconds-to-minutes scale. */
function useRelativeTime(iso: string): string {
  const [, force] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 10_000);
    return () => window.clearInterval(id);
  }, []);

  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export function UploadProgressWindowItem({
  upload,
  onAbort,
  onDismiss,
  onRetry,
}: UploadProgressWindowItemProps) {
  const relativeTime = useRelativeTime(upload.createdAt);

  const isReconnecting = upload.status === "RECONNECTING";
  const isProcessing = upload.status === "PROCESSING";
  const showSuccessIcon = upload.completed;
  const showRetryButton = upload.status === "FAILED";
  const showAbortButton = ACTIVE_UPLOAD_STATUSES.includes(upload.status);
  const showDismissButton = upload.completed || upload.needsFileReselection || upload.status === "FAILED";

  const progressTone = isReconnecting
    ? "bg-sky-500"
    : upload.errorMessage
      ? "bg-destructive"
      : "bg-primary";

  return (
    <div className="p-3 flex flex-col gap-2">
      {/* Filename + destination + actions */}
      <div className="flex items-center justify-between mb-0.5 gap-3">
        <div className="flex items-center flex-1 min-w-0 gap-2.5">
          <div
            className={cn(
              "w-9 h-9 rounded flex-shrink-0 flex items-center justify-center bg-muted text-muted-foreground",
            )}
          >
            <i
              className={cn(
                "bi w-4 h-4 inline-flex items-center justify-center leading-none",
                upload.kind === "video" ? "bi-camera-video" : "bi-image",
              )}
              aria-hidden="true"
            />
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[13px] font-medium truncate">{upload.filename}</span>
              </TooltipTrigger>
              <TooltipContent>{upload.filename}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex gap-2 items-center flex-shrink-0">
          {upload.channel && (
            <>
              <i
                className="bi bi-arrow-right text-muted-foreground w-4 h-4 inline-flex items-center justify-center leading-none"
                aria-hidden="true"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-[9px] font-semibold inline-flex items-center justify-center flex-shrink-0">
                    {upload.channel.initials}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{upload.channel.name}</TooltipContent>
              </Tooltip>
            </>
          )}

          <i
            className={cn(
              "bi bi-check-circle-fill text-emerald-600 w-4 h-4 inline-flex items-center justify-center leading-none flex-shrink-0",
              !showSuccessIcon && "invisible",
            )}
            role="img"
            aria-label="Upload complete"
            aria-hidden={!showSuccessIcon}
          />

          {showRetryButton && (
            <button
              type="button"
              className="text-primary p-0 flex-shrink-0 hover:opacity-70 transition-opacity"
              onClick={onRetry}
              aria-label={upload.needsFileReselection ? "Select file to resume upload" : "Retry upload"}
            >
              <i
                className="bi bi-arrow-clockwise w-4 h-4 inline-flex items-center justify-center leading-none"
                aria-hidden="true"
              />
            </button>
          )}

          {(showAbortButton || showDismissButton) && (
            <button
              type="button"
              className="text-primary p-0 flex-shrink-0 hover:opacity-70 transition-opacity"
              onClick={showAbortButton ? onAbort : onDismiss}
              aria-label={showAbortButton ? "Cancel" : "Dismiss"}
            >
              <i
                className="bi bi-x-lg w-4 h-4 inline-flex items-center justify-center leading-none"
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </div>

      {/* Progress + speed */}
      <div className="flex flex-row gap-3 items-center justify-between">
        <div className="flex-1">
          <Progress
            value={upload.progress}
            className="h-[5px]"
            indicatorClassName={cn(progressTone, isProcessing && "animate-pulse")}
          />
        </div>
        {upload.speed !== null && (
          <small className="text-[11px] text-muted-foreground text-right flex-shrink-0 tabular-nums w-[68px]">
            {formatSpeed(upload.speed)}
          </small>
        )}
      </div>

      {/* Status line */}
      <div className="flex justify-between mt-0.5 items-center gap-2">
        {isReconnecting ? (
          <div className="flex items-center gap-2 text-sky-600 flex-1 min-w-0 mr-2">
            <i
              className="bi bi-wifi-off flex-shrink-0 w-4 h-4 inline-flex items-center justify-center leading-none"
              aria-hidden="true"
            />
            <span className="text-[11px] break-words">
              Network connection lost. Attempting to reconnect...
            </span>
          </div>
        ) : upload.errorMessage ? (
          <div className="flex items-center gap-2 text-destructive flex-1 min-w-0 mr-2">
            <i
              className="bi bi-exclamation-circle flex-shrink-0 w-4 h-4 inline-flex items-center justify-center leading-none"
              aria-hidden="true"
            />
            <span className="text-[11px] break-words">{upload.errorMessage}</span>
          </div>
        ) : isProcessing ? (
          // Not in prod's template — surfaced here because this window (asset
          // uploaded, not yet searchable or AI-tagged) is exactly what the
          // refresh-pill work has to account for.
          <small className="text-[11px] text-muted-foreground">Processing…</small>
        ) : (
          <small className="text-[11px] text-muted-foreground tabular-nums">
            {Math.round(upload.progress)}%
          </small>
        )}

        <small className="text-[11px] text-muted-foreground flex-shrink-0 ml-auto">
          {relativeTime}
        </small>
      </div>
    </div>
  );
}
