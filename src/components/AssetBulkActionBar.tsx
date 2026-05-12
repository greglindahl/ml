import "bootstrap-icons/font/bootstrap-icons.css";
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
              <i className="bi bi-heart w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Favorite</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onArchive}>
              <i className="bi bi-archive w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Archive</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <i className="bi bi-three-dots w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem onClick={onDownload}>
              <i className="bi bi-download w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Download
            </DropdownMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DropdownMenuItem disabled={isOverLimit} onClick={onShare}>
                    <i className="bi bi-share w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Share
                  </DropdownMenuItem>
                </div>
              </TooltipTrigger>
              {isOverLimit && <TooltipContent side="left">{ASSET_LIMIT_MESSAGE}</TooltipContent>}
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DropdownMenuItem disabled={isOverLimit} onClick={onGalleryAction}>
                    <i className="bi bi-images w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> {galleryActionLabel}
                  </DropdownMenuItem>
                </div>
              </TooltipTrigger>
              {isOverLimit && <TooltipContent side="left">{ASSET_LIMIT_MESSAGE}</TooltipContent>}
            </Tooltip>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <i className="bi bi-trash w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
