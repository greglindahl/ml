import { Heart, Archive, MoreHorizontal, Download, Share2, Images, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ASSET_BULK_LIMIT = 20;
const ASSET_LIMIT_MESSAGE = "Too many assets selected. You may only perform this action on up to 20 at a time.";

interface AssetBulkActionBarProps {
  selectedCount: number;
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  /** Label for the gallery action — "Add to Gallery" or "Remove from Gallery" */
  galleryActionLabel?: string;
  onFavorite?: () => void;
  onArchive?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onGalleryAction?: () => void;
  onDelete?: () => void;
}

export function AssetBulkActionBar({
  selectedCount,
  allSelected,
  someSelected,
  onSelectAll,
  galleryActionLabel = "Add to Gallery",
  onFavorite,
  onArchive,
  onDownload,
  onShare,
  onGalleryAction,
  onDelete,
}: AssetBulkActionBarProps) {
  const isOverLimit = selectedCount > ASSET_BULK_LIMIT;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border rounded-lg mb-4">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onSelectAll}
          {...(someSelected ? { "data-state": "indeterminate" } : {})}
          aria-label="Select all assets"
        />
        <span className="text-sm font-medium">{selectedCount} selected</span>
      </div>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onFavorite}>
              <Heart className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Favorite</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onArchive}>
              <Archive className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Archive</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem onClick={onDownload}>
              <Download className="w-4 h-4 mr-2" /> Download
            </DropdownMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DropdownMenuItem disabled={isOverLimit} onClick={onShare}>
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </DropdownMenuItem>
                </div>
              </TooltipTrigger>
              {isOverLimit && <TooltipContent side="left">{ASSET_LIMIT_MESSAGE}</TooltipContent>}
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DropdownMenuItem disabled={isOverLimit} onClick={onGalleryAction}>
                    <Images className="w-4 h-4 mr-2" /> {galleryActionLabel}
                  </DropdownMenuItem>
                </div>
              </TooltipTrigger>
              {isOverLimit && <TooltipContent side="left">{ASSET_LIMIT_MESSAGE}</TooltipContent>}
            </Tooltip>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
