import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderOpen, AlertTriangle, Info } from "lucide-react";
import type { FolderItem, FlattenedFolder } from "@/lib/mockFolderData";
import { getMaxDepth, getAllDescendantIds } from "@/lib/mockFolderData";

interface MoveFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (targetLocationId: string | null) => void;
  folder: FolderItem;
  breadcrumbPath: string;
  flattenedFolders: FlattenedFolder[];
  folderTree: FolderItem[];
}

export function MoveFolderDialog({
  open,
  onOpenChange,
  onMove,
  folder,
  breadcrumbPath,
  flattenedFolders,
  folderTree,
}: MoveFolderDialogProps) {
  const [targetLocationId, setTargetLocationId] = useState<string | null>(null);

  useEffect(() => {
    if (open) setTargetLocationId(null);
  }, [open]);

  // Exclude the folder itself and its descendants from valid targets
  const excludedIds = useMemo(() => getAllDescendantIds(folder), [folder]);

  const validLocations = useMemo(
    () => flattenedFolders.filter((f) => !excludedIds.includes(f.id)),
    [flattenedFolders, excludedIds]
  );

  // Depth validation: moving folder's subtree depth + target depth must be <= 4
  const movingDepth = useMemo(() => getMaxDepth(folder), [folder]);

  const targetDepth = useMemo(() => {
    if (targetLocationId === null) return 1; // root level
    const target = flattenedFolders.find((f) => f.id === targetLocationId);
    return target ? target.depth + 2 : 1; // depth is 0-indexed, +1 for 1-indexed, +1 for being a child
  }, [targetLocationId, flattenedFolders]);

  const exceedsDepthLimit = targetDepth + movingDepth - 1 > 4;
  const hasSelected = targetLocationId !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Move Folder</DialogTitle>
          <DialogDescription>
            Choose a new location for this folder. Moving a folder changes its location in the hierarchy. Nested folders and galleries move with it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Folder being moved */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
            <FolderOpen className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{folder.name}</p>
              <p className="text-xs text-muted-foreground truncate">{breadcrumbPath}</p>
            </div>
          </div>

          {/* Target location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <Select
              value={targetLocationId ?? ""}
              onValueChange={(v) => setTargetLocationId(v === "root" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select new location..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">All Media</SelectItem>
                {validLocations.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Depth limit error */}
          {exceedsDepthLimit && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>This move would exceed the 4-level folder limit. Choose a different location.</p>
            </div>
          )}

          {/* Info banner */}
          <div className="flex items-start gap-2 p-3 rounded-lg border bg-muted/50 text-sm text-muted-foreground">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              This move may take some time to complete. The move will continue in the background.{" "}
              <strong className="text-foreground">Content will not be searchable until the move is finished.</strong>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onMove(targetLocationId)} disabled={exceedsDepthLimit}>
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
