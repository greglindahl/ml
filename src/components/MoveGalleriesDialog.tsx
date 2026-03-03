import { useState } from "react";
import { Info, Images } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FlattenedFolder } from "@/lib/mockFolderData";

export interface MoveGalleryItem {
  id: string;
  name: string;
  currentLocation: string; // display string like "Season 25-26 > In-Game" or "Not in a folder"
}

interface MoveGalleriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  galleries: MoveGalleryItem[];
  flattenedFolders: FlattenedFolder[];
  onMove: (moves: Record<string, string | null>) => void;
}

export function MoveGalleriesDialog({
  open,
  onOpenChange,
  galleries,
  flattenedFolders,
  onMove,
}: MoveGalleriesDialogProps) {
  // Per-gallery target location: gallery ID -> folder ID (null = All Media / root)
  const [targets, setTargets] = useState<Record<string, string | null>>({});

  const handleTargetChange = (galleryId: string, value: string) => {
    setTargets((prev) => ({
      ...prev,
      [galleryId]: value === "all" ? null : value,
    }));
  };

  const handleApplyToAll = (sourceGalleryId: string) => {
    const sourceValue = targets[sourceGalleryId];
    if (sourceValue === undefined) return;
    setTargets((prev) => {
      const next: Record<string, string | null> = {};
      galleries.forEach((g) => {
        next[g.id] = sourceValue;
      });
      return next;
    });
  };

  const handleMove = () => {
    onMove(targets);
    setTargets({});
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setTargets({});
    onOpenChange(nextOpen);
  };

  const hasAnyTarget = Object.keys(targets).length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Move Galleries</DialogTitle>
          <DialogDescription>
            You're about to move {galleries.length} {galleries.length === 1 ? "gallery" : "galleries"}. Sharing settings, assets, and access will not be affected.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-auto space-y-3 py-2">
          {galleries.map((gallery) => {
            const hasTarget = targets[gallery.id] !== undefined;
            return (
              <div key={gallery.id} className="flex items-center gap-3 px-1">
                {/* Gallery thumbnail placeholder */}
                <div className="w-10 h-10 rounded bg-muted/50 border flex items-center justify-center flex-shrink-0">
                  <Images className="w-4 h-4 text-muted-foreground/50" />
                </div>

                {/* Name + current path stacked */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{gallery.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{gallery.currentLocation}</div>
                </div>

                {/* Target folder selector + Apply to All */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Select
                    value={targets[gallery.id] === null ? "all" : (targets[gallery.id] ?? "")}
                    onValueChange={(val) => handleTargetChange(gallery.id, val)}
                  >
                    <SelectTrigger className="w-[180px] h-8 text-sm">
                      <SelectValue placeholder="Select folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Media</SelectItem>
                      {flattenedFolders.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {hasTarget && galleries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleApplyToAll(gallery.id)}
                      className="text-xs text-primary hover:text-primary/80 whitespace-nowrap font-medium"
                    >
                      + Apply to All
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Alert className="bg-muted/50 border-muted">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs text-muted-foreground">
            Moving galleries happens in the background. They may not appear in their new location immediately and may be temporarily unavailable in search results.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={!hasAnyTarget}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
