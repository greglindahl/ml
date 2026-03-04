import { useState, useMemo, useEffect } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Info, Folder } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FolderItem, FlattenedFolder } from "@/lib/mockFolderData";
import { getMaxDepth, getAllDescendantIds } from "@/lib/mockFolderData";

interface NestedFolderRow {
  name: string;
  path: string;
}

function collectNestedFolders(folder: FolderItem, parentPath: string): NestedFolderRow[] {
  const rows: NestedFolderRow[] = [{ name: folder.name, path: parentPath }];
  if (folder.children) {
    const childPath = parentPath ? `${parentPath} > ${folder.name}` : folder.name;
    for (const child of folder.children) {
      if (child.type === "folder") {
        rows.push(...collectNestedFolders(child, childPath));
      }
    }
  }
  return rows;
}

function countTotalAssets(folder: FolderItem): number {
  let total = 0;
  if (folder.type === "gallery" && folder.count) total += folder.count;
  if (folder.children) {
    for (const child of folder.children) {
      total += countTotalAssets(child);
    }
  }
  return total;
}

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

  const exceedsDepthLimit = targetDepth + movingDepth - 1 > 3;
  const hasSelected = targetLocationId !== undefined;

  const nestedRows = useMemo(() => collectNestedFolders(folder, breadcrumbPath), [folder, breadcrumbPath]);
  const totalAssets = useMemo(() => countTotalAssets(folder), [folder]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Move Folder</DialogTitle>
          <DialogDescription>
            Galleries, assets, and sharing are not affected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nested folders summary + scrollable table */}
          <p className="text-sm text-muted-foreground">{nestedRows.length} {nestedRows.length === 1 ? "folder" : "folders"} will be moved</p>
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
                          <Folder className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
              This move will affect <strong className="text-foreground">{totalAssets} media items</strong> and may take some time to complete. The move will continue in the background.{" "}
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
