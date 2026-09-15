import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CancelUploadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completedCount: number;
  totalCount: number;
  activeCount: number;
  failedCount: number;
  /** Abandon everything unfinished and close the tray. */
  onConfirm: () => void;
  /** Keep uploading, collapse the tray to its header. */
  onMinimize: () => void;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * Confirm step before closing the upload tray with work in flight.
 * Copy matches production's `cancel-uploads-modal`.
 */
export function CancelUploadsDialog({
  open,
  onOpenChange,
  completedCount,
  totalCount,
  activeCount,
  failedCount,
  onConfirm,
  onMinimize,
}: CancelUploadsDialogProps) {
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  if (allCompleted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Uploads Complete</DialogTitle>
            <DialogDescription>All uploads have finished successfully.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onConfirm}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const consequence =
    activeCount > 0 && failedCount > 0
      ? `Closing will stop ${activeCount} ${plural(activeCount, "upload", "uploads")} and remove ${failedCount} ${plural(failedCount, "failed upload", "failed uploads")} from the upload tray.`
      : activeCount > 0
        ? `Closing will stop ${activeCount} ${plural(activeCount, "upload", "uploads")}.`
        : `Closing will remove ${failedCount} ${plural(failedCount, "failed upload", "failed uploads")} from the upload tray.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Uploads</DialogTitle>
          <DialogDescription>
            <strong className="text-foreground">
              {totalCount === 1
                ? `${completedCount} of 1 upload is complete.`
                : `${completedCount} of ${totalCount} uploads are complete.`}
            </strong>{" "}
            {consequence}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-between gap-2">
          <Button variant="link" className="p-0 h-auto no-underline" onClick={onMinimize}>
            Minimize
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onConfirm}>
              Cancel Uploads
            </Button>
            <Button onClick={() => onOpenChange(false)}>Continue Uploads</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
