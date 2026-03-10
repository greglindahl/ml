import { useState, useCallback, useEffect, useMemo } from "react";
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

export interface NewFolderData {
  name: string;
  locationId: string | null;
  galleryIds: string[];
}

interface NewFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFolder: (data: NewFolderData) => void;
  flattenedFolders: FlattenedFolder[];
  galleries: Gallery[];
  defaultLocationId?: string | null;
  folderTree?: FolderItem[];
  onCreateGallery?: (data: NewGalleryData) => Gallery | void;
}

export function NewFolderDialog({
  open,
  onOpenChange,
  onCreateFolder,
  flattenedFolders,
  galleries,
  defaultLocationId = null,
  folderTree = [],
  onCreateGallery,
}: NewFolderDialogProps) {
  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState<string | null>(defaultLocationId);
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<string[]>([]);
  const [nameError, setNameError] = useState(false);
  const [addGalleryOpen, setAddGalleryOpen] = useState(false);
  const [newGalleryDialogOpen, setNewGalleryDialogOpen] = useState(false);

  const assignedGalleryIds = useMemo(() => collectAssignedGalleryIds(folderTree), [folderTree]);

  useEffect(() => {
    if (open) setLocationId(defaultLocationId);
  }, [open, defaultLocationId]);

  const resetForm = useCallback(() => {
    setName("");
    setLocationId(defaultLocationId);
    setSelectedGalleryIds([]);
    setNameError(false);
  }, [defaultLocationId]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) resetForm();
      onOpenChange(open);
    },
    [onOpenChange, resetForm]
  );

  const handleCreate = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(true);
      return;
    }
    onCreateFolder({
      name: trimmed,
      locationId,
      galleryIds: selectedGalleryIds,
    });
    resetForm();
  }, [name, locationId, selectedGalleryIds, onCreateFolder, resetForm]);

  const removeGallery = useCallback((galleryId: string) => {
    setSelectedGalleryIds((prev) => prev.filter((id) => id !== galleryId));
  }, []);

  const selectedGalleries = galleries.filter((g) => selectedGalleryIds.includes(g.id));

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
            <DialogDescription className="sr-only">
              Create a new folder in your library
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="folder-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="folder-name"
                placeholder="Enter folder name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(false);
                }}
                className={nameError ? "border-destructive" : ""}
                autoFocus
              />
              {nameError && (
                <p className="text-xs text-destructive">Name is required</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={locationId ?? ""}
                onValueChange={(v) => setLocationId(v === "root" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">All Media</SelectItem>
                  {flattenedFolders
                    .filter((f) => f.depth < 2)
                    .map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
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
