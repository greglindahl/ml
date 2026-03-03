import { useState, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import type { FlattenedFolder, Gallery } from "@/lib/mockFolderData";

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
}

export function NewFolderDialog({
  open,
  onOpenChange,
  onCreateFolder,
  flattenedFolders,
  galleries,
}: NewFolderDialogProps) {
  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState<string | null>(null);
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<string[]>([]);
  const [nameError, setNameError] = useState(false);
  const [gallerySearch, setGallerySearch] = useState("");

  const resetForm = useCallback(() => {
    setName("");
    setLocationId(null);
    setSelectedGalleryIds([]);
    setNameError(false);
    setGallerySearch("");
  }, []);

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

  const toggleGallery = useCallback((galleryId: string) => {
    setSelectedGalleryIds((prev) =>
      prev.includes(galleryId)
        ? prev.filter((id) => id !== galleryId)
        : [...prev, galleryId]
    );
  }, []);

  const selectedGalleryLabel =
    selectedGalleryIds.length === 0
      ? "Select galleries..."
      : `${selectedGalleryIds.length} selected`;

  return (
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
                  .filter((f) => f.depth < 2) // Only allow folders at depth 0-1 as parents (max 3 levels)
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate text-muted-foreground">
                    {selectedGalleryLabel}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search galleries..."
                    value={gallerySearch}
                    onChange={(e) => setGallerySearch(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                  {galleries
                    .filter((g) =>
                      g.name.toLowerCase().includes(gallerySearch.toLowerCase())
                    )
                    .map((gallery) => (
                      <label
                        key={gallery.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm hover:bg-accent cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedGalleryIds.includes(gallery.id)}
                          onCheckedChange={() => toggleGallery(gallery.id)}
                        />
                        <span className="truncate">{gallery.name}</span>
                      </label>
                    ))}
                </div>
              </PopoverContent>
            </Popover>
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
  );
}
