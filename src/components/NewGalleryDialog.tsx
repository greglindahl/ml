import React, { useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FlattenedFolder } from "@/lib/mockFolderData";

export interface NewGalleryData {
  name: string;
  isPublic: boolean;
  description: string;
  instructions: string;
  folderId: string | null;
  viewOnly: boolean;
  allowUpload: boolean;
  archiveDate: string;
}

interface NewGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGallery: (data: NewGalleryData) => void;
  flattenedFolders: FlattenedFolder[];
  /** Pre-select a folder when opened from within a folder */
  defaultFolderId?: string | null;
}

export function NewGalleryDialog({ open, onOpenChange, onCreateGallery, flattenedFolders, defaultFolderId }: NewGalleryDialogProps) {
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [folderId, setFolderId] = useState<string | null>(defaultFolderId ?? null);
  const [sharing, setSharing] = useState<string[]>([]);

  // Sync folderId when dialog opens or defaultFolderId changes
  React.useEffect(() => {
    if (open) {
      setFolderId(defaultFolderId ?? null);
    }
  }, [open, defaultFolderId]);
  const [sharingInput, setSharingInput] = useState("");
  const [viewOnly, setViewOnly] = useState(false);
  const [allowUpload, setAllowUpload] = useState(false);
  const [archiveDate, setArchiveDate] = useState("");

  const resetForm = () => {
    setName("");
    setIsPublic(false);
    setDescription("");
    setInstructions("");
    setFolderId(defaultFolderId ?? null);
    setSharing([]);
    setSharingInput("");
    setViewOnly(false);
    setAllowUpload(false);
    setArchiveDate("");
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onCreateGallery({
      name: name.trim(),
      isPublic,
      description,
      instructions,
      folderId,
      viewOnly,
      allowUpload,
      archiveDate,
    });
    resetForm();
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetForm();
  };

  const addSharingChip = () => {
    const val = sharingInput.trim();
    if (val && !sharing.includes(val)) {
      setSharing(prev => [...prev, val]);
    }
    setSharingInput("");
  };

  const removeSharingChip = (chip: string) => {
    setSharing(prev => prev.filter(s => s !== chip));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>New Gallery</DialogTitle>
            <button className="text-xs text-primary hover:underline mr-6" type="button">
              Create Multiple Galleries
            </button>
          </div>
          <DialogDescription>Create a new gallery to organize your assets.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="gallery-name">Name *</Label>
            <Input
              id="gallery-name"
              placeholder="Enter gallery name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Make Gallery Public */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="gallery-public"
              checked={isPublic}
              onCheckedChange={(v) => setIsPublic(v === true)}
            />
            <Label htmlFor="gallery-public" className="font-normal">Make Gallery Public</Label>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="gallery-description">Description</Label>
            <Textarea
              id="gallery-description"
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <Label htmlFor="gallery-instructions">Instructions</Label>
            <Textarea
              id="gallery-instructions"
              placeholder="Add instructions for contributors..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
            />
          </div>

          {/* Add to Folder */}
          <div className="space-y-1.5">
            <Label>Add to Folder</Label>
            <Select value={folderId ?? "none"} onValueChange={(v) => setFolderId(v === "none" ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {flattenedFolders.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sharing */}
          <div className="space-y-1.5">
            <Label>Sharing</Label>
            <div className="flex flex-wrap items-center gap-1.5 border rounded-md p-2 min-h-[40px]">
              {sharing.map(chip => (
                <span key={chip} className="inline-flex items-center gap-1 bg-muted text-sm px-2 py-0.5 rounded-full">
                  {chip}
                  <button type="button" onClick={() => removeSharingChip(chip)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                className="flex-1 min-w-[100px] text-sm bg-transparent outline-none"
                placeholder="Add people..."
                value={sharingInput}
                onChange={(e) => setSharingInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSharingChip(); } }}
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-1.5">
            <Label>Schedule</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select schedule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Only & Allow Upload */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="gallery-viewonly"
                checked={viewOnly}
                onCheckedChange={(v) => setViewOnly(v === true)}
              />
              <Label htmlFor="gallery-viewonly" className="font-normal">View Only</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="gallery-upload"
                checked={allowUpload}
                onCheckedChange={(v) => setAllowUpload(v === true)}
              />
              <Label htmlFor="gallery-upload" className="font-normal">Allow Upload</Label>
            </div>
          </div>

          {/* Archive Date */}
          <div className="space-y-1.5">
            <Label htmlFor="gallery-archive-date">Archive Date</Label>
            <Input
              id="gallery-archive-date"
              type="date"
              value={archiveDate}
              onChange={(e) => setArchiveDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
