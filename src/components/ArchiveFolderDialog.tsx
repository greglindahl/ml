import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import "bootstrap-icons/font/bootstrap-icons.css";
import type { FolderItem } from "@/lib/mockFolderData";
import { collectNestedFolders } from "@/lib/mockFolderData";

interface ArchiveFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchive: () => void;
  folder: FolderItem;
  breadcrumbPath: string;
}

export function ArchiveFolderDialog({ open, onOpenChange, onArchive, folder, breadcrumbPath }: ArchiveFolderDialogProps) {
  const nestedRows = useMemo(() => collectNestedFolders(folder, breadcrumbPath), [folder, breadcrumbPath]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Archive Folder</DialogTitle>
          <DialogDescription>
            Archiving a folder hides it from users. If you decide later you want to make an archived folder available, you can unarchive it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            {nestedRows.length} {nestedRows.length === 1 ? "folder" : "folders"} will be archived
          </p>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="text-xs font-medium">Folder</TableHead>
                  <TableHead className="text-xs font-medium">Current Location</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
            <ScrollArea className="max-h-[200px]">
              <Table>
                <TableBody>
                  {nestedRows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          <i className="bi bi-folder w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium">{row.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-sm text-muted-foreground">{row.path}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-2 p-3 rounded-lg border bg-muted/50 text-sm text-muted-foreground">
            <i className="bi bi-info-circle w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>Galleries and assets are not deleted.</p>
          </div>
        </div>

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
