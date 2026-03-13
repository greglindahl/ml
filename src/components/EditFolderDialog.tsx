import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Images, Plus, X, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlattenedFolder, Gallery, FolderItem } from "@/lib/mockFolderData";
import { collectAssignedGalleryIds } from "@/lib/mockFolderData";
import { AddGalleryDialog } from "./AddGalleryDialog";
import { NewGalleryDialog, type NewGalleryData } from "./NewGalleryDialog";

interface EditFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; locationId: string | null; galleryIds: string[] }) => void;
  folder: FolderItem;
  currentLocationId: string | null;
  currentGalleryIds: string[];
  flattenedFolders: FlattenedFolder[];
  galleries: Gallery[];
  folderTree?: FolderItem[];
  onCreateGallery?: (data: NewGalleryData) => Gallery | void;
}

export function EditFolderDialog({
  open,
  onOpenChange,
  onSave,
  folder,
  currentLocationId,
  currentGalleryIds,
  flattenedFolders,
  galleries,
  folderTree = [],
  onCreateGallery,
}: EditFolderDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState(folder.name);
  const [locationId, setLocationId] = useState<string | null>(currentLocationId);
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<string[]>(currentGalleryIds);
  const [nameError, setNameError] = useState(false);
  const [addGalleryOpen, setAddGalleryOpen] = useState(false);
  const [newGalleryDialogOpen, setNewGalleryDialogOpen] = useState(false);
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);

  const selectedLocationLabel = useMemo(() => {
    if (!locationId) return "Select Location";
    const found = flattenedFolders.find((f) => f.id === locationId);
    return found ? found.displayName : "Select Location";
  }, [locationId, flattenedFolders]);

  const assignedGalleryIds = useMemo(() => collectAssignedGalleryIds(folderTree), [folderTree]);

  useEffect(() => {
    if (open) {
      setName(folder.name);
      setLocationId(currentLocationId);
      setSelectedGalleryIds(currentGalleryIds);
      setNameError(false);
    }
  }, [open, folder, currentLocationId, currentGalleryIds]);

  const handleSave = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(true);
      return;
    }
    onSave({ name: trimmed, locationId, galleryIds: selectedGalleryIds });
  }, [name, locationId, selectedGalleryIds, onSave]);

  const removeGallery = useCallback((galleryId: string) => {
    setSelectedGalleryIds((prev) => prev.filter((id) => id !== galleryId));
  }, []);

  const selectedGalleries = galleries.filter((g) => selectedGalleryIds.includes(g.id));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" ref={contentRef}>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription className="sr-only">Edit folder details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-folder-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-folder-name"
                placeholder="Enter folder name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(false);
                }}
                className={nameError ? "border-destructive" : ""}
                autoFocus
              />
              {nameError && <p className="text-xs text-destructive">Name is required</p>}
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={locationPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedLocationLabel}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                            setLocationPopoverOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", !locationId ? "opacity-100" : "opacity-0")} />
                          All Media
                        </CommandItem>
                        {flattenedFolders.map((f) => (
                          <CommandItem
                            key={f.id}
                            value={f.displayName}
                            onSelect={() => {
                              setLocationId(f.id);
                              setLocationPopoverOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", locationId === f.id ? "opacity-100" : "opacity-0")} />
                            {f.displayName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Add Galleries */}
            <div className="space-y-2">
              <Label>Add Galleries</Label>
              <div
                className="flex items-center justify-between border rounded-md px-3 py-2.5 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setAddGalleryOpen(true)}
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Images className="w-4 h-4" />
                  <span>Select Gallery</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddGalleryOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {selectedGalleries.length > 0 && (
                <div className="space-y-1">
                  {selectedGalleries.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Images className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{g.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 flex-shrink-0"
                        onClick={() => removeGallery(g.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddGalleryDialog
        open={addGalleryOpen}
        onOpenChange={setAddGalleryOpen}
        galleries={galleries.filter((g) => !selectedGalleryIds.includes(g.id))}
        disabledGalleryIds={assignedGalleryIds}
        onSelectGalleries={(ids) => {
          setSelectedGalleryIds((prev) => [...new Set([...prev, ...ids])]);
          setAddGalleryOpen(false);
        }}
        onCreateNew={() => setNewGalleryDialogOpen(true)}
      />

      <NewGalleryDialog
        open={newGalleryDialogOpen}
        onOpenChange={setNewGalleryDialogOpen}
        flattenedFolders={flattenedFolders}
        onCreateGallery={(data) => {
          if (onCreateGallery) {
            const result = onCreateGallery(data);
            if (result && result.id) {
              setSelectedGalleryIds((prev) => [...new Set([...prev, result.id])]);
            }
          }
          setNewGalleryDialogOpen(false);
        }}
      />
    </>
  );
}
