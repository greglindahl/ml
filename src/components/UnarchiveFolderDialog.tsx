import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UnarchiveFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnarchive: () => void;
  folderName: string;
}

export function UnarchiveFolderDialog({ open, onOpenChange, onUnarchive, folderName }: UnarchiveFolderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unarchive Folder</DialogTitle>
          <DialogDescription>
            You're about to unarchive "{folderName}". This will unarchive associated galleries and sub-folders.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onUnarchive}>Unarchive</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
