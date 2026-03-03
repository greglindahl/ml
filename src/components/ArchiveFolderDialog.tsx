import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ArchiveFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchive: () => void;
  folderName: string;
}

export function ArchiveFolderDialog({ open, onOpenChange, onArchive, folderName }: ArchiveFolderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Archive Folder</DialogTitle>
          <DialogDescription>
            Are you sure you want to archive <strong>"{folderName}"</strong>? Archiving will hide this folder and its contents from the main library view. You can restore it later from the archive.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onArchive}>Archive</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
