import { useState, useMemo, useRef, ReactNode } from "react";
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
import { FlattenedFolder, mockGalleries } from "@/lib/mockFolderData";
import { MOVE_MEDIA_ITEM_LIMIT } from "@/lib/limits";

export interface MoveGalleryItem {
  id: string;
  name: string;
  currentLocation: string;
  /** Media count for the affected-items notice; falls back to a mockGalleries lookup when omitted. */
  assetCount?: number;
}

interface MoveGalleriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  galleries: MoveGalleryItem[];
  flattenedFolders: FlattenedFolder[];
  onMove: (locationId: string | null) => void;
  /** Header copy overrides — used by the "Move to unarchive" flow; defaults keep the standard move copy. */
  title?: string;
  description?: ReactNode;
}

export function MoveGalleriesDialog({
  open,
  onOpenChange,
  galleries,
  flattenedFolders,
  onMove,
  title = "Move Galleries",
  description,
}: MoveGalleriesDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [locationSelected, setLocationSelected] = useState(false);
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);

  const totalAssets = useMemo(
    () => galleries.reduce((sum, g) => sum + (g.assetCount ?? mockGalleries.find((m) => m.id === g.id)?.assetCount ?? 0), 0),
    [galleries]
  );
  const exceedsMoveLimit = totalAssets > MOVE_MEDIA_ITEM_LIMIT;

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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="space-y-1">
            {description ?? (
              <>
                <span className="block">
                  You're about to move {galleries.length} {galleries.length === 1 ? "gallery" : "galleries"} to a new location.
                </span>
                <span className="block">This changes where they appear in the folder hierarchy.</span>
                <span className="block">Sharing, assets, and access are not affected.</span>
              </>
            )}
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

        {exceedsMoveLimit ? (
          <div className="flex items-start gap-3 rounded-md bg-[#F6C343] px-6 py-3 text-[#12263F] text-[15px] leading-snug tracking-[-0.01em]">
            <i className="bi bi-info-circle flex-shrink-0 mt-0.5 inline-flex items-center justify-center leading-none" />
            <p>
              <strong className="font-semibold">Too many items to move.</strong> This move would affect{" "}
              <strong className="font-semibold">{totalAssets.toLocaleString()} media items</strong>, which exceeds the{" "}
              {MOVE_MEDIA_ITEM_LIMIT.toLocaleString()} media item limit for a single move. Try moving fewer galleries in smaller batches.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-md bg-[#EDF2F9] px-6 py-3 text-[#12263F] text-[15px] leading-snug tracking-[-0.01em]">
            <i className="bi bi-info-circle flex-shrink-0 mt-0.5 inline-flex items-center justify-center leading-none" />
            <p>
              This move will affect <strong className="font-semibold">{totalAssets.toLocaleString()} media items</strong> and may take some time to complete. The move will continue in the background. <strong className="font-semibold">Content will not be searchable until the move is finished.</strong>
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={!locationSelected || exceedsMoveLimit}>
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
