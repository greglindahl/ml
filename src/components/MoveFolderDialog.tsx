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
import { toast as sonnerToast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FolderItem, FlattenedFolder } from "@/lib/mockFolderData";
import { getMaxDepth, getAllDescendantIds, countTotalAssets, findFolderAncestorIds } from "@/lib/mockFolderData";
import { MOVE_MEDIA_ITEM_LIMIT, OVERNIGHT_MOVE_MEDIA_LIMIT, OVERNIGHT_WINDOW_LABEL, moveTier } from "@/lib/limits";

import { collectNestedFolders } from "@/lib/mockFolderData";

type MovePhase = "form" | "submitting" | "error";

// Danger-treatment failure toast: slides in from the bottom-left, auto-dismisses after 10s.
function showMoveFailureToast(folder: FolderItem) {
  sonnerToast.custom(
    (t) => (
      <div className="flex items-start gap-3 rounded-lg bg-[#FCE7EB] p-4 w-[380px] shadow-lg">
        <i className="bi bi-x-circle-fill text-[#E63757] text-[20px] flex-shrink-0 inline-flex items-center justify-center leading-none" />
        <div className="flex-1 text-[#12263F]">
          <p className="font-bold text-[16px] leading-tight mb-1">Move couldn't be completed</p>
          <p className="text-[14px] leading-snug">
            "{folder.name}" exceeds the {MOVE_MEDIA_ITEM_LIMIT.toLocaleString()} media item limit for a single move, so nothing was moved. Try moving subfolders individually in smaller batches.
          </p>
        </div>
        <button
          onClick={() => sonnerToast.dismiss(t)}
          aria-label="Dismiss"
          className="flex-shrink-0 text-[#6e84a3] hover:text-[#12263F] transition-colors"
        >
          <i className="bi bi-x-lg text-[16px] inline-flex items-center justify-center leading-none" />
        </button>
      </div>
    ),
    { position: "bottom-left", duration: 10_000 }
  );
}

interface MoveFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (targetLocationId: string | null) => void;
  /** Over the move-now limit but under the overnight ceiling: queue it for tonight. */
  onSchedule?: (targetLocationId: string | null, targetName: string) => void;
  /** Over the overnight ceiling: hand it to support. */
  onContactSupport?: () => void;
  folder: FolderItem;
  breadcrumbPath: string;
  flattenedFolders: FlattenedFolder[];
  folderTree: FolderItem[];
}

export function MoveFolderDialog({
  open,
  onOpenChange,
  onMove,
  onSchedule,
  onContactSupport,
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

  // Active folders can't move into an archived destination — the user must
  // unarchive it first. Archived folders can move anywhere (they stay archived).
  const targetFolder = useMemo(
    () => (targetLocationId === null ? null : flattenedFolders.find((f) => f.id === targetLocationId) ?? null),
    [targetLocationId, flattenedFolders]
  );
  const blockedByArchivedDest = folder.archived !== true && targetFolder?.archived === true;
  const hasSelected = targetLocationId !== undefined;

  const nestedRows = useMemo(() => collectNestedFolders(folder, breadcrumbPath), [folder, breadcrumbPath]);
  const totalAssets = useMemo(() => countTotalAssets(folder), [folder]);
  // now: move right away · overnight: schedule for tonight · support: CS moves it
  const tier = moveTier(totalAssets);
  // Where it lives now (null = All Media). Moving there is a no-op.
  const currentParentId = useMemo(() => {
    const ancestors = findFolderAncestorIds(folderTree, folder.id);
    return ancestors && ancestors.length > 0 ? ancestors[ancestors.length - 1] : null;
  }, [folderTree, folder.id]);
  const isCurrentLocation = targetLocationId === currentParentId;
  const blockedByStructure = exceedsDepthLimit || blockedByArchivedDest || isCurrentLocation;

  const handleMove = () => {
    setPhase("submitting");
    timerRef.current = setTimeout(() => {
      if (folder.simulateMoveRejection) {
        // Scenario B (in-dialog error phase) is disabled in favor of a failure
        // toast — restore by swapping these two lines for setPhase("error")
        // and un-commenting the error-phase JSX below.
        onOpenChange(false);
        showMoveFailureToast(folder);
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
        {/* Scenario B in-dialog error phase — disabled in favor of the failure toast (see handleMove). Restore by replacing the fragment below with this ternary:
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
        ) : (...)}
        */}
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

              {/* Same location: nothing to move. Kept separate from the size notice, which stays visible. */}
              {isCurrentLocation && (
                <p className="text-sm text-muted-foreground">"{folder.name}" is already here. Choose a different location.</p>
              )}

              {/* Archived destination error */}
              {blockedByArchivedDest && (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-sm">
                  <i className="bi bi-exclamation-triangle w-4 h-4 flex-shrink-0 mt-0.5 inline-flex items-center justify-center leading-none" />
                  <p>"{targetFolder?.name}" is archived. Unarchive it first, or choose an active location.</p>
                </div>
              )}

              {/* Depth limit error */}
              {exceedsDepthLimit && (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-sm">
                  <i className="bi bi-exclamation-triangle w-4 h-4 flex-shrink-0 mt-0.5 inline-flex items-center justify-center leading-none" />
                  <p>This move would exceed the 4-level folder limit. Choose a different location.</p>
                </div>
              )}

              {/* Move size: the count and the limit, before the user commits (PORTAL-12837),
                  plus a way forward that fits the size. */}
              {tier === "overnight" && (
                <div className="flex items-start gap-3 rounded-md bg-[#F6C343] px-6 py-3 text-[#12263F] text-[15px] leading-snug tracking-[-0.01em]">
                  <i className="bi bi-clock flex-shrink-0 mt-0.5 inline-flex items-center justify-center leading-none" />
                  <div className="space-y-1">
                    <p>
                      <strong className="font-semibold">Too large to move right now.</strong> This move affects{" "}
                      <strong className="font-semibold">{totalAssets.toLocaleString()} media items</strong>, over the{" "}
                      {MOVE_MEDIA_ITEM_LIMIT.toLocaleString()} limit for moving right away.
                    </p>
                    <p>
                      Schedule it for tonight at {OVERNIGHT_WINDOW_LABEL}, when it won't slow down search for your team. The
                      folder stays where it is until then.
                    </p>
                  </div>
                </div>
              )}
              {tier === "support" && (
                <div className="flex items-start gap-3 rounded-md bg-[#F6C343] px-6 py-3 text-[#12263F] text-[15px] leading-snug tracking-[-0.01em]">
                  <i className="bi bi-info-circle flex-shrink-0 mt-0.5 inline-flex items-center justify-center leading-none" />
                  <div className="space-y-1">
                    <p>
                      <strong className="font-semibold">Too large to move in the Library.</strong> This move affects{" "}
                      <strong className="font-semibold">{totalAssets.toLocaleString()} media items</strong>, over the{" "}
                      {OVERNIGHT_MOVE_MEDIA_LIMIT.toLocaleString()} limit even for an overnight move.
                    </p>
                    <p>Our support team can plan the move with you and run it for you.</p>
                  </div>
                </div>
              )}
              {tier === "now" && (
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
              {tier === "now" && (
                <Button onClick={handleMove} disabled={blockedByStructure || phase === "submitting"}>
                  {phase === "submitting" ? (
                    <>
                      <i className="bi bi-arrow-repeat animate-spin w-4 h-4 inline-flex items-center justify-center leading-none" />
                      Moving...
                    </>
                  ) : (
                    "Move"
                  )}
                </Button>
              )}
              {tier === "overnight" && (
                <Button
                  onClick={() => onSchedule?.(targetLocationId, targetFolder?.name ?? "All Media")}
                  disabled={blockedByStructure}
                >
                  <i className="bi bi-clock w-4 h-4 inline-flex items-center justify-center leading-none" />
                  Schedule for Tonight
                </Button>
              )}
              {tier === "support" && (
                <Button onClick={() => onContactSupport?.()}>
                  <i className="bi bi-headset w-4 h-4 inline-flex items-center justify-center leading-none" />
                  Contact Support
                </Button>
              )}
            </DialogFooter>
        </>
      </DialogContent>
    </Dialog>
  );
}
