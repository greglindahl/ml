import { useState, useMemo } from "react";
import { Search, Plus, Images } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Gallery } from "@/lib/mockFolderData";

interface AddGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  galleries: Gallery[];
  onSelectGalleries: (galleryIds: string[]) => void;
  onCreateNew: () => void;
}

export function AddGalleryDialog({ open, onOpenChange, galleries, onSelectGalleries, onCreateNew }: AddGalleryDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return galleries;
    const q = searchQuery.toLowerCase();
    return galleries.filter(g => g.name.toLowerCase().includes(q));
  }, [galleries, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    onSelectGalleries(Array.from(selectedIds));
    setSelectedIds(new Set());
    setSearchQuery("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedIds(new Set());
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Gallery</DialogTitle>
          <DialogDescription>Select existing galleries to add to this folder.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search galleries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 whitespace-nowrap"
            onClick={() => {
              onOpenChange(false);
              onCreateNew();
            }}
          >
            <Plus className="w-4 h-4" />
            New Gallery
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto border rounded-md divide-y max-h-[340px]">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Images className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No galleries found</p>
            </div>
          ) : (
            filtered.map(gallery => {
              const isSelected = selectedIds.has(gallery.id);
              return (
                <div
                  key={gallery.id}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent/50 transition-colors ${isSelected ? "bg-accent" : ""}`}
                  onClick={() => toggleSelect(gallery.id)}
                >
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Images className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{gallery.name}</div>
                    <div className="text-xs text-muted-foreground">{gallery.assetCount} assets · {gallery.timeAgo}</div>
                  </div>
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="flex-shrink-0 text-xs"
                    onClick={(e) => { e.stopPropagation(); toggleSelect(gallery.id); }}
                  >
                    {isSelected ? "Selected" : "Select"}
                  </Button>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={selectedIds.size === 0}>
            Add {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
