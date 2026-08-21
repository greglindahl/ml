import { useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Gallery, GalleryTableItem, enrichGallery, sortGalleries, GallerySortField } from "@/lib/mockFolderData";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Column definitions for manage columns
export const GALLERY_COLUMNS = [
  { key: "thumbnail", label: "Thumbnail" },
  { key: "name", label: "Gallery Name" },
  { key: "description", label: "Description" },
  { key: "creator", label: "Creator" },
  { key: "created", label: "Created" },
  { key: "lastAdded", label: "Last Added" },
  { key: "sharing", label: "Sharing" },
  { key: "downloads", label: "Downloads" },
  { key: "totalAssets", label: "Total Assets" },
] as const;

export type GalleryColumnKey = typeof GALLERY_COLUMNS[number]["key"];
export type GalleryColumnVisibility = Record<GalleryColumnKey, boolean>;

export const DEFAULT_GALLERY_COLUMN_VISIBILITY: GalleryColumnVisibility = {
  thumbnail: true,
  name: true,
  description: true,
  creator: true,
  created: true,
  lastAdded: true,
  sharing: true,
  downloads: true,
  totalAssets: true,
};

// Re-exported for existing importers; the type lives with the data now
export type { GalleryTableItem };

const GALLERY_MOVE_LIMIT = 5;
const MOVE_LIMIT_MESSAGE = "Too many galleries selected. You may only move up to 5 at a time.";

interface GalleryTableViewProps {
  galleries: GalleryTableItem[];
  isLoading?: boolean;
  onNavigate?: (galleryId: string) => void;
  onMoveGalleries?: (galleryIds: string[]) => void;
  onArchiveGallery?: (galleryId: string) => void;
  onUnarchiveGallery?: (galleryId: string) => void;
  /** Controlled perPage value */
  perPage: number;
  /** Controlled column visibility */
  columnVisibility: GalleryColumnVisibility;
  /** Controlled selection (PORTAL-12949): when provided with onSelectionChange,
      the header checkbox syncs with the parent's bulk banner both ways. */
  selectedGalleries?: Set<string>;
  onSelectionChange?: (next: Set<string>) => void;
}

type SortField = GallerySortField | null;
type SortDirection = "asc" | "desc";

export function GalleryTableView({
  galleries,
  isLoading = false,
  onNavigate,
  onMoveGalleries,
  onArchiveGallery,
  onUnarchiveGallery,
  perPage,
  columnVisibility,
  selectedGalleries: controlledSelection,
  onSelectionChange,
}: GalleryTableViewProps) {
  // Selection is controlled by the parent when provided (PORTAL-12949: keeps the
  // bulk banner's master checkbox and the header checkbox in two-way sync);
  // falls back to internal state for older call sites.
  const [internalSelection, setInternalSelection] = useState<Set<string>>(new Set());
  const selectedGalleries = controlledSelection ?? internalSelection;
  const setSelectedGalleries = onSelectionChange ?? setInternalSelection;
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Enrich galleries with additional data for display. Items the parent already
  // enriched (stable index basis) pass through untouched — re-enriching by
  // received order would reshuffle values whenever the parent reorders the list.
  const enrichedGalleries = galleries.map((g, i) => (g.createdDate ? g : enrichGallery(g, i)));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedGalleries(new Set(galleries.map(g => g.id)));
    } else {
      setSelectedGalleries(new Set());
    }
  };

  const handleSelectGallery = (galleryId: string, checked: boolean) => {
    const newSelected = new Set(selectedGalleries);
    if (checked) {
      newSelected.add(galleryId);
    } else {
      newSelected.delete(galleryId);
    }
    setSelectedGalleries(newSelected);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <i className="bi bi-arrow-down-up w-3 h-3 ml-1 opacity-50 inline-flex items-center justify-center leading-none" />;
    }
    return sortDirection === "asc"
      ? <i className="bi bi-arrow-up w-3 h-3 ml-1 inline-flex items-center justify-center leading-none" />
      : <i className="bi bi-arrow-down w-3 h-3 ml-1 inline-flex items-center justify-center leading-none" />;
  };

  // Sort via the shared comparator so the grid dropdown and table headers agree
  // (also fixes "13 hours ago" sorting as oldest instead of newest)
  const sortedGalleries = sortField ? sortGalleries(enrichedGalleries, sortField, sortDirection) : enrichedGalleries;

  // Apply pagination
  const paginatedGalleries = sortedGalleries.slice(0, perPage);

  const allSelected = galleries.length > 0 && selectedGalleries.size === galleries.length;
  const someSelected = selectedGalleries.size > 0 && selectedGalleries.size < galleries.length;

  const formatDate = (date: Date | undefined) => {
    if (!date) return "-";
    return date.toLocaleDateString("en-US", { 
      month: "numeric", 
      day: "numeric",
      year: "2-digit"
    });
  };

  const formatLastAdded = (value: Date | string | undefined) => {
    if (!value) return "-";
    if (typeof value === "string") return value;
    return formatDate(value);
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table wrapperClassName="overflow-visible">
          <TableHeader className="sticky top-[var(--content-sticky-h,0px)] z-10">
            <TableRow>
              <TableHead className="w-12"><Checkbox disabled /></TableHead>
              <TableHead className="w-24"></TableHead>
              <TableHead className="text-xs tracking-wider">Gallery Name</TableHead>
              <TableHead className="text-xs tracking-wider">Description</TableHead>
              <TableHead className="text-xs tracking-wider">Creator</TableHead>
              <TableHead className="text-xs tracking-wider">Created</TableHead>
              <TableHead className="text-xs tracking-wider">Last Added</TableHead>
              <TableHead className="text-xs tracking-wider">Sharing</TableHead>
              <TableHead className="text-right text-xs tracking-wider">Downloads</TableHead>
              <TableHead className="text-right text-xs tracking-wider">Total Assets</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><div className="w-4 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-16 h-12 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-32 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-24 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-20 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-16 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-20 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-8 h-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="w-8 h-4 bg-muted rounded animate-pulse ml-auto" /></TableCell>
                <TableCell><div className="w-8 h-4 bg-muted rounded animate-pulse ml-auto" /></TableCell>
                <TableCell><div className="w-6 h-6 bg-muted rounded animate-pulse" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card">
      {/* Bulk action bar */}
      {/* Legacy inline actions row — hidden when the parent owns selection
          (the bulk banner is the single control surface per PORTAL-12949) */}
      {controlledSelection === undefined && selectedGalleries.size > 0 && onMoveGalleries && (
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 border-b">
          <span className="text-sm text-muted-foreground">
            {selectedGalleries.size} selected
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    disabled={selectedGalleries.size > GALLERY_MOVE_LIMIT}
                    onClick={() => onMoveGalleries(Array.from(selectedGalleries))}
                  >
                    <i className="bi bi-arrows-move w-3 h-3 inline-flex items-center justify-center leading-none" />
                    Move
                  </Button>
                </div>
              </TooltipTrigger>
              {selectedGalleries.size > GALLERY_MOVE_LIMIT && (
                <TooltipContent>
                  {MOVE_LIMIT_MESSAGE}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      <Table wrapperClassName="overflow-visible">
        <TableHeader className="sticky top-[var(--content-sticky-h,0px)] z-10">
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all galleries"
                {...(someSelected ? { "data-state": "indeterminate" } : {})}
              />
            </TableHead>
            {columnVisibility.thumbnail && <TableHead className="w-24"></TableHead>}
            {columnVisibility.name && (
              <TableHead className="min-w-[180px]">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center hover:text-foreground transition-colors uppercase text-xs tracking-wider"
                >
                  Gallery Name
                  {getSortIcon("name")}
                </button>
              </TableHead>
            )}
            {columnVisibility.description && (
              <TableHead className="min-w-[150px]">
                <button
                  onClick={() => handleSort("description")}
                  className="flex items-center hover:text-foreground transition-colors uppercase text-xs tracking-wider"
                >
                  Description
                  {getSortIcon("description")}
                </button>
              </TableHead>
            )}
            {columnVisibility.creator && (
              <TableHead className="min-w-[140px]">
                <button
                  onClick={() => handleSort("creator")}
                  className="flex items-center hover:text-foreground transition-colors uppercase text-xs tracking-wider"
                >
                  Creator
                  {getSortIcon("creator")}
                </button>
              </TableHead>
            )}
            {columnVisibility.created && (
              <TableHead className="min-w-[100px]">
                <button
                  onClick={() => handleSort("created")}
                  className="flex items-center hover:text-foreground transition-colors uppercase text-xs tracking-wider"
                >
                  Created
                  {getSortIcon("created")}
                </button>
              </TableHead>
            )}
            {columnVisibility.lastAdded && (
              <TableHead className="min-w-[110px]">
                <button
                  onClick={() => handleSort("lastAdded")}
                  className="flex items-center hover:text-foreground transition-colors uppercase text-xs tracking-wider"
                >
                  Last Added
                  {getSortIcon("lastAdded")}
                </button>
              </TableHead>
            )}
            {columnVisibility.sharing && (
              <TableHead className="min-w-[80px]">
                <button
                  onClick={() => handleSort("sharing")}
                  className="flex items-center hover:text-foreground transition-colors uppercase text-xs tracking-wider"
                >
                  Sharing
                  {getSortIcon("sharing")}
                </button>
              </TableHead>
            )}
            {columnVisibility.downloads && (
              <TableHead className="text-right min-w-[100px]">
                <button
                  onClick={() => handleSort("downloads")}
                  className="flex items-center justify-end w-full hover:text-foreground transition-colors uppercase text-xs tracking-wider"
                >
                  Downloads
                  {getSortIcon("downloads")}
                </button>
              </TableHead>
            )}
            {columnVisibility.totalAssets && (
              <TableHead className="text-right min-w-[100px]">
                <button
                  onClick={() => handleSort("totalAssets")}
                  className="flex items-center justify-end w-full hover:text-foreground transition-colors uppercase text-xs tracking-wider"
                >
                  Total Assets
                  {getSortIcon("totalAssets")}
                </button>
              </TableHead>
            )}
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedGalleries.map((gallery) => (
            <TableRow 
              key={gallery.id}
              data-state={selectedGalleries.has(gallery.id) ? "selected" : undefined}
            >
              {/* Checkbox */}
              <TableCell>
                <Checkbox 
                  checked={selectedGalleries.has(gallery.id)}
                  onCheckedChange={(checked) => handleSelectGallery(gallery.id, !!checked)}
                  aria-label={`Select ${gallery.name}`}
                />
              </TableCell>
              
              {/* Thumbnail */}
              {columnVisibility.thumbnail && (
                <TableCell>
                  <div className="relative w-16 h-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                    <i className="bi bi-images text-2xl text-muted-foreground/40" />
                    {/* Asset count badge */}
                    <span className="absolute top-0.5 left-0.5 text-[9px] font-bold text-white bg-primary px-1.5 py-0.5 rounded">
                      {gallery.assetCount}
                    </span>
                    {/* Video indicator */}
                    {gallery.hasVideo && (
                      <span className="absolute bottom-0.5 left-0.5 p-0.5 bg-primary rounded">
                        <i className="bi bi-camera-video text-[10px] text-primary-foreground" />
                      </span>
                    )}
                  </div>
                </TableCell>
              )}

              {/* Gallery Name */}
              {columnVisibility.name && (
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => onNavigate?.(gallery.id)}
                      className="font-medium text-sm text-primary hover:underline text-left truncate max-w-[200px]"
                    >
                      {gallery.name}
                    </button>
                    {(gallery.isPublic || gallery.archived) && (
                      <div className="flex items-center gap-1.5">
                        {gallery.isPublic && (
                          <i className="bi bi-folder-symlink text-primary text-xs" />
                        )}
                        {gallery.archived && (
                          <i className="bi bi-archive text-gray-700 text-xs" />
                        )}
                      </div>
                    )}
                    {gallery.isNew && (
                      <Badge variant="default" className="w-fit text-[10px] px-1.5 py-0 h-5">
                        NEW
                      </Badge>
                    )}
                  </div>
                </TableCell>
              )}

              {/* Description */}
              {columnVisibility.description && (
                <TableCell>
                  <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                    {gallery.description || "-"}
                  </span>
                </TableCell>
              )}

              {/* Creator */}
              {columnVisibility.creator && (
                <TableCell>
                  <span className="text-sm">{gallery.creator || "-"}</span>
                </TableCell>
              )}

              {/* Created Date */}
              {columnVisibility.created && (
                <TableCell>
                  <span className="text-sm">{formatDate(gallery.createdDate)}</span>
                </TableCell>
              )}

              {/* Last Added */}
              {columnVisibility.lastAdded && (
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatLastAdded(gallery.lastAdded)}
                  </span>
                </TableCell>
              )}

              {/* Sharing */}
              {columnVisibility.sharing && (
                <TableCell>
                  <span className={`text-sm ${gallery.sharingCount && gallery.sharingCount > 0 ? "text-primary" : "text-muted-foreground"}`}>
                    {gallery.sharingCount || 0}
                  </span>
                </TableCell>
              )}

              {/* Downloads */}
              {columnVisibility.downloads && (
                <TableCell className="text-right">
                  <span className="text-sm">{gallery.downloads || 0}</span>
                </TableCell>
              )}

              {/* Total Assets */}
              {columnVisibility.totalAssets && (
                <TableCell className="text-right">
                  <span className="text-sm font-medium">{gallery.assetCount}</span>
                </TableCell>
              )}
              
              {/* Actions Menu */}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <i className="bi bi-three-dots w-4 h-4 inline-flex items-center justify-center leading-none" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem>View Gallery</DropdownMenuItem>
                    <DropdownMenuItem>Edit Details</DropdownMenuItem>
                    <DropdownMenuItem>Share</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMoveGalleries?.([gallery.id])}>Move</DropdownMenuItem>
                    {gallery.archived === true ? (
                      <DropdownMenuItem onClick={() => onUnarchiveGallery?.(gallery.id)}>Unarchive</DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onArchiveGallery?.(gallery.id)}>Archive</DropdownMenuItem>
                    )}
                    <DropdownMenuItem>Download All</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
