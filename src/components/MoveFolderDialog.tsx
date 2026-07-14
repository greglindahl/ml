import { useState, useMemo, useEffect, useRef } from "react";
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
import "bootstrap-icons/font/bootstrap-icons.css";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FolderItem, FlattenedFolder } from "@/lib/mockFolderData";
import { getMaxDepth, getAllDescendantIds, countTotalAssets } from "@/lib/mockFolderData";
import { MOVE_MEDIA_ITEM_LIMIT } from "@/lib/limits";

import { collectNestedFolders } from "@/lib/mockFolderData";

type MovePhase = "form" | "submitting" | "error";

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
  const contentRef = useRef<HTMLDivElement>(null);
  const [targetLocationId, setTargetLocationId] = useState<string | null>(null);
  const [phase, setPhase] = useState<MovePhase>("form");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      setTargetLocationId(null);
      setPhase("form");
    }
  }, [open]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

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
  const exceedsMoveLimit = totalAssets > MOVE_MEDIA_ITEM_LIMIT;

  const handleMove = () => {
    setPhase("submitting");
    timerRef.current = setTimeout(() => {
      if (folder.simulateMoveRejection) {
        setPhase("error");
      } else {
        onMove(targetLocationId);
      }
    }, 1200);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && phase === "submitting") return;
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" ref={contentRef}>
        {phase === "error" ? (
          <>
            <DialogHeader>
              <DialogTitle>Move Folder</DialogTitle>
              <DialogDescription className="sr-only">
                The move could not be completed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-sm">
                <i className="bi bi-exclamation-triangle w-4 h-4 flex-shrink-0 mt-0.5 inline-flex items-center justify-center leading-none" />
                <div className="space-y-1">
                  <p className="font-semibold">Move couldn't be completed</p>
                  <p>
                    "{folder.name}" exceeds the {MOVE_MEDIA_ITEM_LIMIT.toLocaleString()} media item limit for a single move, so nothing was moved.
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Move its subfolders individually in smaller batches, then try again.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </>
        ) : (
          <>
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
                              <i className="bi bi-folder w-4 h-4 text-muted-foreground flex-shrink-0 inline-flex items-center justify-center leading-none" />
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
                  value={targetLocationId === null ? "root" : (targetLocationId ?? "root")}
                  onValueChange={(v) => setTargetLocationId(v === "root" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new location..." />
                  </SelectTrigger>
                  <SelectContent container={contentRef.current}>
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
                  <i className="bi bi-exclamation-triangle w-4 h-4 flex-shrink-0 mt-0.5 inline-flex items-center justify-center leading-none" />
                  <p>This move would exceed the 4-level folder limit. Choose a different location.</p>
                </div>
              )}

              {/* Move size limit warning */}
              {exceedsMoveLimit ? (
                <div className="flex items-start gap-3 rounded-md bg-[#F6C343] px-6 py-3 text-[#12263F] text-[15px] leading-snug tracking-[-0.01em]">
                  <i className="bi bi-info-circle flex-shrink-0 mt-0.5 inline-flex items-center justify-center leading-none" />
                  <p>
                    <strong className="font-semibold">Too many items to move.</strong> This move would affect{" "}
                    <strong className="font-semibold">{totalAssets.toLocaleString()} media items</strong>, which exceeds the{" "}
                    {MOVE_MEDIA_ITEM_LIMIT.toLocaleString()} media item limit for a single move. Try moving subfolders individually in smaller batches.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 rounded-lg border bg-muted/50 text-sm text-muted-foreground">
                  <i className="bi bi-info-circle w-4 h-4 flex-shrink-0 mt-0.5 inline-flex items-center justify-center leading-none" />
                  <p>
                    This move will affect <strong className="text-foreground">{totalAssets.toLocaleString()} media items</strong> and may take some time to complete. The move will continue in the background.{" "}
                    <strong className="text-foreground">Content will not be searchable until the move is finished.</strong>
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={phase === "submitting"}>
                Cancel
              </Button>
              <Button onClick={handleMove} disabled={exceedsDepthLimit || exceedsMoveLimit || phase === "submitting"}>
                {phase === "submitting" ? (
                  <>
                    <i className="bi bi-arrow-repeat animate-spin w-4 h-4 inline-flex items-center justify-center leading-none" />
                    Moving...
                  </>
                ) : (
                  "Move"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
