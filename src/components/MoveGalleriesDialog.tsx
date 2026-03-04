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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FlattenedFolder } from "@/lib/mockFolderData";

export interface MoveGalleryItem {
  id: string;
  name: string;
  currentLocation: string;
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
          <DialogDescription className="space-y-1">
            <span className="block">
              You're about to move {galleries.length} {galleries.length === 1 ? "gallery" : "galleries"} to a new location.
            </span>
            <span className="block">This changes where they appear in the folder hierarchy.</span>
            <span className="block">Sharing, assets, and access are not affected.</span>
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gallery</TableHead>
                <TableHead>Current Location</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {galleries.map((gallery) => (
                <TableRow key={gallery.id}>
                  <TableCell className="font-medium">{gallery.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{gallery.currentLocation}</TableCell>
                  <TableCell>
                    <Select
                      value={targets[gallery.id] === null ? "all" : (targets[gallery.id] ?? "")}
                      onValueChange={(val) => handleTargetChange(gallery.id, val)}
                    >
                      <SelectTrigger className="w-[180px] h-8 text-sm">
                        <SelectValue placeholder="Select Location" />
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
            This move will affect 10,000 media items and may take some time to complete. The move will continue in the background. <strong>Content will not be searchable until the move is finished.</strong>
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
