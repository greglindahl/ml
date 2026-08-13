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
  onDownload?: () => void;
  onShare?: () => void;
  onGalleryAction?: () => void;
  onDelete?: () => void;
  onManageTags?: () => void;
  onManageDescription?: () => void;
  onManageNotes?: () => void;
  onBranding?: () => void;
}

export function AssetBulkActionBar({
  selectedCount,
  allSelected,
  someSelected,
  onSelectAll,
  galleryActionLabel = "Add to Gallery",
  onFavorite,
  onDownload,
  onShare,
  onGalleryAction,
  onDelete,
  onManageTags,
  onManageDescription,
  onManageNotes,
  onBranding,
}: AssetBulkActionBarProps) {
  const isOverLimit = selectedCount > ASSET_BULK_LIMIT;

  return (
    // Default toolbar treatment: surface.elevated fill, border.subtle, radius md
    <div className="flex items-center justify-between px-4 py-2 bg-white border border-[#E6E6E6] rounded-lg mb-4">
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
        {/* Direct actions: Download, gallery action, Slack share */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDownload}>
              <i className="bi bi-download w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* div wrapper: disabled buttons don't fire the pointer events the tooltip needs */}
            <div>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isOverLimit} onClick={onGalleryAction}>
                <i className="bi bi-folder-plus w-4 h-4 inline-flex items-center justify-center leading-none" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>{isOverLimit ? ASSET_LIMIT_MESSAGE : galleryActionLabel}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isOverLimit} onClick={onShare}>
                <i className="bi bi-slack w-4 h-4 inline-flex items-center justify-center leading-none" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>{isOverLimit ? ASSET_LIMIT_MESSAGE : "Share to Slack"}</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <i className="bi bi-three-dots-vertical w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem onClick={onDelete}>
              <i className="bi bi-trash w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Delete
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onManageTags}>
              <i className="bi bi-tag w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Manage Tags
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onManageDescription}>
              <i className="bi bi-text-left w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Manage Description
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onManageNotes}>
              <i className="bi bi-pencil-square w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Manage Notes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onFavorite}>
              <i className="bi bi-heart w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Mark as Favorite
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBranding}>
              <i className="bi bi-palette w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Mark for Branding
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
