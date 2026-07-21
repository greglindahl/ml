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
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FlattenedFolder } from "@/lib/mockFolderData";

interface MoveToUnarchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Destination options — caller pre-filters out archived folders. */
  flattenedFolders: FlattenedFolder[];
  onMove: (locationId: string | null, unarchive: boolean) => void;
}

// Guidance dialog for a gallery that can't be unarchived in place because an
// ancestor folder is archived: the user moves it to All Media or an active
// folder, optionally unarchiving it as part of the move.
export function MoveToUnarchiveDialog({
  open,
  onOpenChange,
  flattenedFolders,
  onMove,
}: MoveToUnarchiveDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [locationSelected, setLocationSelected] = useState(false);
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [unarchiveWhenMoved, setUnarchiveWhenMoved] = useState(true);

  const selectedLocationLabel = useMemo(() => {
    if (!locationSelected) return "Select Location";
    if (!locationId) return "All Media";
    const found = flattenedFolders.find((f) => f.id === locationId);
    return found ? found.displayName : "Select Location";
  }, [locationId, locationSelected, flattenedFolders]);

  const resetState = () => {
    setLocationId(null);
    setLocationSelected(false);
    setUnarchiveWhenMoved(true);
  };

  const handleMove = () => {
    onMove(locationId, unarchiveWhenMoved);
    resetState();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" ref={contentRef}>
        <DialogHeader>
          <DialogTitle>Move to unarchive</DialogTitle>
          <DialogDescription>
            This gallery can't be unarchived because it's located in an archived folder.
            To unarchive it, move the gallery to All Media or another active folder.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Checkbox
            id="unarchive-when-moved"
            checked={unarchiveWhenMoved}
            onCheckedChange={(checked) => setUnarchiveWhenMoved(checked === true)}
          />
          <Label htmlFor="unarchive-when-moved" className="font-normal cursor-pointer">
            Unarchive gallery when moved
          </Label>
        </div>

        <div className="space-y-2">
          <Label>Move to:</Label>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={!locationSelected}>
            Move Gallery
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
