import { useState, useMemo, useRef } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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
  onMove: (locationId: string | null) => void;
}

export function MoveGalleriesDialog({
  open,
  onOpenChange,
  galleries,
  flattenedFolders,
  onMove,
}: MoveGalleriesDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [locationSelected, setLocationSelected] = useState(false);
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);

  const selectedLocationLabel = useMemo(() => {
    if (!locationSelected) return "Select Location";
    if (!locationId) return "All Media";
    const found = flattenedFolders.find((f) => f.id === locationId);
    return found ? found.displayName : "Select Location";
  }, [locationId, locationSelected, flattenedFolders]);

  const handleMove = () => {
    onMove(locationId);
    setLocationId(null);
    setLocationSelected(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setLocationId(null);
      setLocationSelected(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl" ref={contentRef}>
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

        <div className="max-h-[300px] overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gallery</TableHead>
                <TableHead>Current Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {galleries.map((gallery) => (
                <TableRow key={gallery.id}>
                  <TableCell className="font-medium">{gallery.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{gallery.currentLocation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Single location picker */}
        <div className="space-y-2">
          <Label>New Location</Label>
          <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={locationPopoverOpen}
                className="w-full justify-between font-normal"
              >
                {selectedLocationLabel}
                <i className="bi bi-chevron-expand ml-2 h-4 w-4 shrink-0 opacity-50 inline-flex items-center justify-center leading-none" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" container={contentRef.current}>
              <Command>
                <CommandInput placeholder="Search locations..." />
                <CommandList>
                  <CommandEmpty>No location found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="All Media"
                      onSelect={() => {
                        setLocationId(null);
                        setLocationSelected(true);
                        setLocationPopoverOpen(false);
                      }}
                    >
                      <i className={cn("bi bi-check mr-2 h-4 w-4", locationSelected && !locationId ? "opacity-100" : "opacity-0")} />
                      All Media
                    </CommandItem>
                    {flattenedFolders.map((f) => (
                      <CommandItem
                        key={f.id}
                        value={f.displayName}
                        onSelect={() => {
                          setLocationId(f.id);
                          setLocationSelected(true);
                          setLocationPopoverOpen(false);
                        }}
                      >
                        <i className={cn("bi bi-check mr-2 h-4 w-4", locationId === f.id ? "opacity-100" : "opacity-0")} />
                        {f.displayName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <Alert className="bg-muted/50 border-muted">
          <i className="bi bi-info-circle h-4 w-4 inline-flex items-center justify-center leading-none" />
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
            disabled={!locationSelected}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
