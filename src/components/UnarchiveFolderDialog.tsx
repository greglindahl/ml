import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { FolderItem } from "@/lib/mockFolderData";
import { countTotalAssets } from "@/lib/mockFolderData";
import { TooLargeNotice, isTooLarge } from "@/components/TooLarge";

interface UnarchiveFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnarchive: () => void;
  folder: FolderItem;
}

export function UnarchiveFolderDialog({ open, onOpenChange, onUnarchive, folder }: UnarchiveFolderDialogProps) {
  const mediaCount = countTotalAssets(folder);
  const tooLarge = isTooLarge(mediaCount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unarchive Folder</DialogTitle>
          <DialogDescription>
            You're about to unarchive "{folder.name}". This will unarchive associated galleries and sub-folders.
          </DialogDescription>
        </DialogHeader>

        {tooLarge && <TooLargeNotice action="unarchiveFolder" context={{ count: mediaCount }} />}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onUnarchive} disabled={tooLarge}>Unarchive</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
