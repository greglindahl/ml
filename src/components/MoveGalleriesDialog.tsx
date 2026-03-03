import { useState } from "react";
import { Info } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

        <div className="max-h-[340px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="uppercase text-xs tracking-wider">Gallery</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Current Location</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {galleries.map((gallery) => (
                <TableRow key={gallery.id}>
                  <TableCell className="font-medium text-sm">{gallery.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {gallery.currentLocation}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={targets[gallery.id] ?? ""}
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
