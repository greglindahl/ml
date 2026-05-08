import { useState, useCallback, useMemo, useRef } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { AssetTableView } from "@/components/AssetTableView";
import { AssetBulkActionBar } from "@/components/AssetBulkActionBar";
import { GalleryTableView, GalleryTableItem } from "@/components/GalleryTableView";
import { FolderTableView } from "@/components/FolderTableView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FacetedSearchWithTypeahead } from "@/components/FacetedSearchWithTypeahead";
import { FilterBar, FilterBarHandle } from "@/components/FilterBar";
import { Badge } from "@/components/ui/badge";
import { useLibrarySearch } from "@/hooks/useLibrarySearch";
import { getRelativeTime, LibraryAsset } from "@/lib/mockLibraryData";
import { FolderItem, getAllDescendantIds, flattenFolders, mockGalleries, Gallery, FlattenedFolder, getGalleryLocationDisplay, collectAssignedGalleryIds } from "@/lib/mockFolderData";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AddGalleryDialog } from "@/components/AddGalleryDialog";
import { NewGalleryDialog, type NewGalleryData } from "@/components/NewGalleryDialog";
import { NewFolderDialog, type NewFolderData } from "@/components/NewFolderDialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditFolderDialog } from "@/components/EditFolderDialog";
import { MoveFolderDialog } from "@/components/MoveFolderDialog";
import { ArchiveFolderDialog } from "@/components/ArchiveFolderDialog";
import { UnarchiveFolderDialog } from "@/components/UnarchiveFolderDialog";
import { DeleteFolderDialog } from "@/components/DeleteFolderDialog";
import { MoveGalleriesDialog, MoveGalleryItem } from "@/components/MoveGalleriesDialog";
import { toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { AssetCard, AssetCardState } from "@/components/AssetCard";
import { GalleryCard, GalleryCardState } from "@/components/GalleryCard";
import { FolderCard, FolderCardState } from "@/components/FolderCard";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

const GALLERY_MOVE_LIMIT = 5;
const MOVE_LIMIT_MESSAGE = "Too many galleries selected. You may only move up to 5 at a time.";
const ASSET_BULK_LIMIT = 20;

// Icon component for asset types
function AssetTypeIcon({ type, className }: { type: LibraryAsset["type"]; className?: string }) {
  switch (type) {
    case "video":
      return <i className={`bi bi-camera-video ${className || ""}`} />;
    default:
      return <i className={`bi bi-image ${className || ""}`} />;
  }
}

// Build breadcrumb path from root to the target folder
function buildBreadcrumbPath(targetId: string, items: FolderItem[], path: FolderItem[] = []): FolderItem[] | null {
  for (const item of items) {
    if (item.id === targetId) {
      return [...path, item];
    }
    if (item.children) {
      const found = buildBreadcrumbPath(targetId, item.children, [...path, item]);
      if (found) return found;
    }
  }
  return null;
}

// Get child galleries from a folder
function getChildGalleries(folder: FolderItem): FolderItem[] {
  if (!folder.children) return [];
  const galleries: FolderItem[] = [];
  for (const child of folder.children) {
    if (child.type === "gallery") {
      galleries.push(child);
    } else if (child.type === "folder" && child.children) {
      galleries.push(...getChildGalleries(child));
    }
  }
  return galleries;
}

interface FolderDetailsViewProps {
  folderId: string;
  folder: FolderItem;
  onNavigate: (folderId: string) => void;
  isMobile?: boolean;
  folderTree: FolderItem[];
  onEditFolder?: (folderId: string, data: { name: string; locationId: string | null; galleryIds: string[] }) => void;
  onMoveFolder?: (folderId: string, targetLocationId: string | null) => void;
  onArchiveFolder?: (folderId: string) => void;
  onUnarchiveFolder?: (folderId: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onCreateGallery?: (data: NewGalleryData) => void;
  onAddGalleriesToFolder?: (galleryIds: string[], targetFolderId: string | null) => void;
  onCreateFolder?: (data: NewFolderData) => void;
  onMoveGalleries?: (galleryIds: string[], locationId: string | null) => void;
  galleryList?: Gallery[];
  flattenedFolders?: FlattenedFolder[];
}

export function FolderDetailsView({ folderId, folder, onNavigate, isMobile = false, folderTree, onEditFolder, onMoveFolder, onArchiveFolder, onUnarchiveFolder, onDeleteFolder, onCreateGallery, onAddGalleriesToFolder, onCreateFolder, onMoveGalleries, galleryList, flattenedFolders }: FolderDetailsViewProps) {
  const [activeTab, setActiveTab] = useState("assets");
  
  // Dialog states
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addGalleryDialogOpen, setAddGalleryDialogOpen] = useState(false);
  const [newGalleryDialogOpen, setNewGalleryDialogOpen] = useState(false);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [unarchiveOpen, setUnarchiveOpen] = useState(false);
  const [moveGalleriesOpen, setMoveGalleriesOpen] = useState(false);
  const [moveGalleryItems, setMoveGalleryItems] = useState<MoveGalleryItem[]>([]);
  
  // Gallery selection state for grid view bulk actions
  const [selectedGalleries, setSelectedGalleries] = useState<Set<string>>(new Set());
  
  // Asset selection state for bulk actions
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  
  // View mode state (grid vs list) - independent for assets and galleries
  const [assetsViewMode, setAssetsViewMode] = useState<"grid" | "list">("grid");
  const [galleriesViewMode, setGalleriesViewMode] = useState<"grid" | "list">("grid");
  
  // Archive toggle states
  const [archivedFoldersOnly, setArchivedFoldersOnly] = useState(false);
  const [archivedGalleriesOnly, setArchivedGalleriesOnly] = useState(false);
  const [folderSearchQuery, setFolderSearchQuery] = useState("");
  const [folderViewMode, setFolderViewMode] = useState<"grid" | "table">("grid");
  // folderSearchInputRef removed — now using FacetedSearchWithTypeahead
  
  // Filter state (driven by FilterBar)
  const [contentTypeFilter, setContentTypeFilter] = useState<Array<LibraryAsset["type"]>>([]);
  const [creatorFilter, setCreatorFilter] = useState<string[]>([]);
  const [aspectRatioFilter, setAspectRatioFilter] = useState<LibraryAsset["aspectRatio"][]>([]);
  const [peopleFilter, setPeopleFilter] = useState<string[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<"today" | "week" | "month" | "quarter" | "year" | "custom" | null>(null);
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const filterBarHandleRef = useRef<FilterBarHandle | null>(null);

  // Use the library search hook
  const { results, allAssets, isLoading, search } = useLibrarySearch();

  // Build breadcrumb path
  const breadcrumbPath = useMemo(() => {
    const path = buildBreadcrumbPath(folderId, folderTree);
    // Include "All Media" at the start
    return path ? [{ id: "all", name: "All Media", type: "folder" as const }, ...path.filter(p => p.id !== "all")] : [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, folderTree]);

  // Depth constraint: folders allowed at levels 1-3, level 4 is galleries only
  const folderDepth = breadcrumbPath.length - 1; // exclude "All Media" root
  const canCreateSubfolder = folderDepth < 3;

  // Get child galleries for the Galleries tab
  const childGalleries = useMemo(() => getChildGalleries(folder), [folder]);

  // Get allowed folder IDs (folder + all descendants)
  const allowedFolderIds = useMemo(() => {
    return getAllDescendantIds(folder);
  }, [folder]);

  // Filter results by folder and all active filters
  const filteredResults = useMemo(() => {
    return results.filter((asset) => {
      // Folder filter (only show assets in this folder and descendants)
      if (!asset.folderId || !allowedFolderIds.includes(asset.folderId)) return false;

      // Content type filter
      if (contentTypeFilter.length && !contentTypeFilter.includes(asset.type)) return false;

      // Creator filter
      if (creatorFilter.length && !creatorFilter.includes(asset.creatorId)) return false;

      // Aspect ratio filter
      if (aspectRatioFilter.length && !aspectRatioFilter.includes(asset.aspectRatio)) return false;

      // People filter
      if (peopleFilter.length) {
        const lowerTags = asset.tags.map((t) => t.toLowerCase());
        const matchesAny = peopleFilter.some((p) => lowerTags.includes(p.toLowerCase()));
        if (!matchesAny) return false;
      }

      // Date range filter
      if (dateRangeFilter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const assetDate = new Date(asset.dateCreated.getFullYear(), asset.dateCreated.getMonth(), asset.dateCreated.getDate());
        
        if (dateRangeFilter === "custom" && customDateRange.from && customDateRange.to) {
          const fromDate = new Date(customDateRange.from.getFullYear(), customDateRange.from.getMonth(), customDateRange.from.getDate());
          const toDate = new Date(customDateRange.to.getFullYear(), customDateRange.to.getMonth(), customDateRange.to.getDate());
          if (assetDate < fromDate || assetDate > toDate) return false;
        } else {
          const diffDays = Math.floor((today.getTime() - assetDate.getTime()) / 86400000);
          const matches =
            dateRangeFilter === "today"
              ? diffDays === 0
              : dateRangeFilter === "week"
                ? diffDays <= 7
                : dateRangeFilter === "month"
                  ? diffDays <= 30
                  : dateRangeFilter === "quarter"
                    ? diffDays <= 90
                    : diffDays <= 365;
          if (!matches) return false;
        }
      }

      return true;
    });
  }, [
    results,
    allowedFolderIds,
    contentTypeFilter,
    creatorFilter,
    aspectRatioFilter,
    peopleFilter,
    dateRangeFilter,
    customDateRange,
  ]);

  // Handle search from FacetedSearch component
  const handleSearch = useCallback(
    (query: string, selectedFacets: string[]) => {
      const facets = selectedFacets.map((facet) => ({
        field: "tag",
        value: facet.toLowerCase(),
        label: facet,
      }));
      search(query, facets);
    },
    [search]
  );

  const handleFilterChange = useCallback((filterId: string, values: string[]) => {
    switch (filterId) {
      case "creator":
        setCreatorFilter(values);
        break;
      case "content-type":
        setContentTypeFilter(values as Array<LibraryAsset["type"]>);
        break;
      case "aspect-ratio":
        setAspectRatioFilter(values as LibraryAsset["aspectRatio"][]);
        break;
      case "people":
        setPeopleFilter(values);
        break;
      case "date-range":
        setDateRangeFilter((values[0] as "today" | "week" | "month" | "quarter" | "year" | "custom") ?? null);
        break;
    }
  }, []);

  const handleCustomDateChange = useCallback((range: { from: Date | undefined; to: Date | undefined }) => {
    setCustomDateRange(range);
  }, []);

  const handleMoveGalleries = useCallback((galleryIds: string[]) => {
    const items: MoveGalleryItem[] = galleryIds.map((id) => {
      const gallery = childGalleries.find((g) => g.id === id);
      return {
        id,
        name: gallery?.name || id,
        currentLocation: getGalleryLocationDisplay(id, folderTree),
      };
    });
    setMoveGalleryItems(items);
    setMoveGalleriesOpen(true);
  }, [childGalleries, folderTree]);

  // Gallery selection helpers
  const isAnyGallerySelected = selectedGalleries.size > 0;
  const allGalleriesSelected = childGalleries.length > 0 && selectedGalleries.size === childGalleries.length;

  const toggleGallerySelection = useCallback((id: string) => {
    setSelectedGalleries(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAllGalleries = useCallback(() => {
    if (allGalleriesSelected) {
      setSelectedGalleries(new Set());
    } else {
      setSelectedGalleries(new Set(childGalleries.map(g => g.id)));
    }
  }, [allGalleriesSelected, childGalleries]);

  const handleBulkMoveGalleries = useCallback(() => {
    handleMoveGalleries(Array.from(selectedGalleries));
  }, [selectedGalleries, handleMoveGalleries]);

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden px-4 md:px-8 xl:px-16">
      {/* Breadcrumb Navigation - fixed height to prevent layout shift */}
      <nav className="flex items-center gap-[6px] text-[13px] tracking-[-0.13px] mb-2 flex-shrink-0 h-[44px] items-end">
        {breadcrumbPath.map((item, index) => (
          <div key={item.id} className="flex items-center gap-[6px]">
            {index > 0 && <i className="bi bi-chevron-right text-[11px] text-[#95aac9]" />}
            {index < breadcrumbPath.length - 1 ? (
              <button
                onClick={() => onNavigate(item.id)}
                className="text-[#2c7be5] hover:text-[#2c7be5]/80 transition-colors"
              >
                {item.name}
              </button>
            ) : (
              <span className="text-[#95aac9]">{item.name}</span>
            )}
          </div>
        ))}
      </nav>

      {/* Folder Header */}
      <div className="flex items-start justify-between mb-6 flex-shrink-0">
        <h1 className="text-[26px] font-semibold text-foreground">{folder.name}</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                New
                <i className="bi bi-chevron-down w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canCreateSubfolder && (
                <DropdownMenuItem onClick={() => setNewFolderDialogOpen(true)}>
                  <i className="bi bi-folder w-4 h-4 mr-2" />
                  New Folder
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setNewGalleryDialogOpen(true)}>
                <i className="bi bi-plus w-4 h-4 mr-2" />
                New Gallery
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAddGalleryDialogOpen(true)}>
                <i className="bi bi-images w-4 h-4 mr-2" />
                Add Existing Gallery
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="gap-2">
            <i className="bi bi-upload w-4 h-4" />
            Upload
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <i className="bi bi-three-dots-vertical w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <i className="bi bi-pencil w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMoveOpen(true)}>
                <i className="bi bi-arrows-move w-4 h-4 mr-2" /> Move
              </DropdownMenuItem>
              {folder.archived ? (
                <DropdownMenuItem onClick={() => setUnarchiveOpen(true)}>
                  <i className="bi bi-archive w-4 h-4 mr-2" /> Unarchive
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setArchiveOpen(true)}>
                  <i className="bi bi-archive w-4 h-4 mr-2" /> Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive">
                <i className="bi bi-trash w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="border-b flex-shrink-0">
          <TabsList>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="galleries">Galleries</TabsTrigger>
            <TabsTrigger value="folders">Folders</TabsTrigger>
          </TabsList>
        </div>

        {/* Assets Tab */}
        <TabsContent value="assets" className="flex-1 overflow-y-auto py-6 mt-0">
          {/* Faceted Search */}
          <div className="mb-3">
            <FacetedSearchWithTypeahead onSearch={handleSearch} assets={allAssets} placeholder="Search by people, tags, filenames…" />
          </div>

          {/* Filters and Controls - Single Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <FilterBar onFilterChange={handleFilterChange} onCustomDateChange={handleCustomDateChange} hideFilters={["folders"]} handleRef={filterBarHandleRef} />

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]">
                    Sort: Added Date
                    <i className="bi bi-chevron-down w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Date (Newest)</DropdownMenuItem>
                  <DropdownMenuItem>Date (Oldest)</DropdownMenuItem>
                  <DropdownMenuItem>Name (A-Z)</DropdownMenuItem>
                  <DropdownMenuItem>Name (Z-A)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center border border-gray-300 rounded-md bg-white">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 rounded-r-none text-[#6e84a3] ${assetsViewMode === "grid" ? "bg-gray-100" : ""}`}
                  onClick={() => setAssetsViewMode("grid")}
                >
                  <i className="bi bi-grid-3x3 w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 rounded-none border-x border-gray-300 text-[#6e84a3] ${assetsViewMode === "list" ? "bg-gray-100" : ""}`}
                  onClick={() => setAssetsViewMode("list")}
                >
                  <i className="bi bi-list w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 rounded-l-none text-[#6e84a3] ${selectedAssets.size > 0 ? "bg-gray-100" : ""}`}
                  onClick={() => {
                    if (selectedAssets.size > 0) {
                      setSelectedAssets(new Set());
                    } else {
                      setSelectedAssets(new Set(filteredResults.map(a => a.id)));
                    }
                  }}
                >
                  <i className="bi bi-check-square w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Applied Filter Chips - reserved height to prevent layout shift */}
          <div className="min-h-[24px] mb-4">
            {(() => {
              const chips: { label: string; value: string; sourceId: string }[] = [];
              peopleFilter.forEach(v => chips.push({ label: v, value: v, sourceId: "people" }));
              creatorFilter.forEach(v => chips.push({ label: v, value: v, sourceId: "creator" }));
              contentTypeFilter.forEach(v => chips.push({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v, sourceId: "content-type" }));
              aspectRatioFilter.forEach(v => chips.push({ label: v, value: v, sourceId: "aspect-ratio" }));
              if (dateRangeFilter) {
                const dateLabels: Record<string, string> = { today: "Today", week: "Last 7 Days", month: "Last 30 Days", quarter: "Last 90 Days", year: "Last Year", custom: "Custom Date" };
                chips.push({ label: dateLabels[dateRangeFilter] || dateRangeFilter, value: dateRangeFilter, sourceId: "date-range" });
              }

              if (chips.length === 0) return null;

              return (
                <div className="flex flex-wrap items-center gap-1.5">
                  {chips.map((chip, i) => (
                    <Badge
                      key={`${chip.sourceId}-${chip.value}-${i}`}
                      colorStyle="primary"
                      theme="soft"
                      shape="rounded"
                      className="gap-1.5 pr-1.5 cursor-pointer transition-colors hover:bg-primary/30 text-[13px] normal-case tracking-normal font-normal"
                      onClick={() => filterBarHandleRef.current?.removeValue(chip.sourceId, chip.value)}
                    >
                      {chip.label}
                      <i className="bi bi-x text-sm ml-0.5" />
                    </Badge>
                  ))}
                  <button
                    onClick={() => filterBarHandleRef.current?.clearAll()}
                    className="text-[13px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                  >
                    Clear all
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Asset Bulk Action Bar */}
          {selectedAssets.size > 0 && (
            <AssetBulkActionBar
              selectedCount={selectedAssets.size}
              allSelected={filteredResults.length > 0 && selectedAssets.size === filteredResults.length}
              someSelected={selectedAssets.size > 0 && selectedAssets.size < filteredResults.length}
              onSelectAll={(checked) => {
                if (checked) {
                  setSelectedAssets(new Set(filteredResults.map(a => a.id)));
                } else {
                  setSelectedAssets(new Set());
                }
              }}
              galleryActionLabel="Add to Gallery"
            />
          )}

          {/* Table Controls - shown above table in list view */}
          {assetsViewMode === "list" && (
            <div className="flex items-center justify-between mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]">
                    40 per page
                    <i className="bi bi-chevron-down w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white">
                  <DropdownMenuItem>20 per page</DropdownMenuItem>
                  <DropdownMenuItem>40 per page</DropdownMenuItem>
                  <DropdownMenuItem>80 per page</DropdownMenuItem>
                  <DropdownMenuItem>120 per page</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]">
                    <i className="bi bi-table text-base" />
                    Manage Columns
                    <i className="bi bi-chevron-down w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white">
                  <DropdownMenuItem>Configure columns...</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Assets Grid/Table with Loading State */}
          <div className="min-h-[400px]">
            {assetsViewMode === "list" ? (
              <AssetTableView 
                assets={filteredResults} 
                isLoading={isLoading}
                selectedAssets={selectedAssets}
                onSelectAsset={(id, checked) => {
                  const next = new Set(selectedAssets);
                  if (checked) next.add(id); else next.delete(id);
                  setSelectedAssets(next);
                }}
                onSelectAll={(checked) => {
                  if (checked) setSelectedAssets(new Set(filteredResults.map(a => a.id)));
                  else setSelectedAssets(new Set());
                }}
              />
            ) : isLoading ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="group">
                    <Skeleton className="aspect-[4/3] rounded-lg mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <i className="bi bi-image text-5xl text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-1">No assets found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
                {filteredResults.map((asset) => {
                  const isSelected = selectedAssets.has(asset.id);
                  const isAnySelected = selectedAssets.size > 0;

                  let cardState: AssetCardState = "default";
                  if (isAnySelected && !isSelected) {
                    cardState = "bulk-select";
                  } else if (isSelected) {
                    cardState = "selected";
                  }

                  return (
                    <AssetCard
                      key={asset.id}
                      creatorName={asset.creator}
                      duration={asset.duration}
                      timestamp={getRelativeTime(asset.dateCreated)}
                      thumbnailUrl={asset.thumbnailUrl}
                      state={cardState}
                      onSelect={() => {
                        const next = new Set(selectedAssets);
                        if (next.has(asset.id)) {
                          next.delete(asset.id);
                        } else {
                          next.add(asset.id);
                        }
                        setSelectedAssets(next);
                      }}
                      onFavorite={() => {
                        // TODO: Implement favorite functionality
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Galleries Tab */}
        <TabsContent value="galleries" className="flex-1 overflow-y-auto py-6 mt-0">
          {/* Faceted Search */}
          <div className="mb-4">
            <FacetedSearchWithTypeahead onSearch={handleSearch} assets={allAssets} />
          </div>

          {/* Filters and Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300">
                    Creator
                    <i className="bi bi-chevron-down w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>All Creators</DropdownMenuItem>
                  <DropdownMenuItem>John Smith</DropdownMenuItem>
                  <DropdownMenuItem>Jane Doe</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300">
                    Groups
                    <i className="bi bi-chevron-down w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>All Groups</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300">
                    Date Range
                    <i className="bi bi-chevron-down w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>All Time</DropdownMenuItem>
                  <DropdownMenuItem>Last 7 Days</DropdownMenuItem>
                  <DropdownMenuItem>Last 30 Days</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300">
                    Last Added Date
                    <i className="bi bi-chevron-down w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Any Time</DropdownMenuItem>
                  <DropdownMenuItem>Today</DropdownMenuItem>
                  <DropdownMenuItem>This Week</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Archived toggle */}
              <div className="inline-flex items-center gap-2 h-8 px-2">
                <span className="text-[15px] font-normal text-muted-foreground whitespace-nowrap">Archived Only</span>
                <Switch checked={archivedGalleriesOnly} onCheckedChange={setArchivedGalleriesOnly} className="scale-75" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]">
                    Sort: Added Date
                    <i className="bi bi-chevron-down w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Date (Newest)</DropdownMenuItem>
                  <DropdownMenuItem>Date (Oldest)</DropdownMenuItem>
                  <DropdownMenuItem>Name (A-Z)</DropdownMenuItem>
                  <DropdownMenuItem>Name (Z-A)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center border border-gray-300 rounded-md bg-white">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 rounded-r-none text-[#6e84a3] ${galleriesViewMode === "grid" ? "bg-gray-100" : ""}`}
                  onClick={() => setGalleriesViewMode("grid")}
                >
                  <i className="bi bi-grid-3x3 w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 rounded-none border-l border-gray-300 text-[#6e84a3] ${galleriesViewMode === "list" ? "bg-gray-100" : ""}`}
                  onClick={() => setGalleriesViewMode("list")}
                >
                  <i className="bi bi-list w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 rounded-l-none border-l border-gray-300 text-[#6e84a3] ${isAnyGallerySelected ? "bg-gray-100" : ""}`}
                  onClick={() => toggleSelectAllGalleries()}
                >
                  <i className="bi bi-check-square w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Applied Filter Chips - reserved height to prevent layout shift */}
          <div className="min-h-[24px] mb-4">
            {/* Filter chips would go here when filters are active */}
          </div>

          {/* Bulk Action Bar */}
          {isAnyGallerySelected && galleriesViewMode === "grid" && (
            <div className="flex items-center justify-between mb-4 px-3 py-2 bg-muted/50 border rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={allGalleriesSelected}
                  onCheckedChange={toggleSelectAllGalleries}
                />
                <span className="text-sm font-medium">{selectedGalleries.size} selected</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: "Favorited", description: `${selectedGalleries.size} ${selectedGalleries.size === 1 ? "gallery" : "galleries"} favorited.` })}>
                  <i className="bi bi-heart w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: "Archived", description: `${selectedGalleries.size} ${selectedGalleries.size === 1 ? "gallery" : "galleries"} archived.` })}>
                  <i className="bi bi-archive w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <i className="bi bi-three-dots w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <DropdownMenuItem
                              disabled={selectedGalleries.size > GALLERY_MOVE_LIMIT}
                              onClick={handleBulkMoveGalleries}
                            >
                              <i className="bi bi-arrows-move w-4 h-4 mr-2" /> Move
                            </DropdownMenuItem>
                          </div>
                        </TooltipTrigger>
                        {selectedGalleries.size > GALLERY_MOVE_LIMIT && (
                          <TooltipContent side="left">
                            {MOVE_LIMIT_MESSAGE}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                      <i className="bi bi-trash w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          {/* Table Controls - shown above table in list view */}
          {galleriesViewMode === "list" && (
            <div className="flex items-center justify-between mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]">
                    40 per page
                    <i className="bi bi-chevron-down w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white">
                  <DropdownMenuItem>20 per page</DropdownMenuItem>
                  <DropdownMenuItem>40 per page</DropdownMenuItem>
                  <DropdownMenuItem>80 per page</DropdownMenuItem>
                  <DropdownMenuItem>120 per page</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]">
                    <i className="bi bi-table text-base" />
                    Manage Columns
                    <i className="bi bi-chevron-down w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white">
                  <DropdownMenuItem>Configure columns...</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {(() => {
            const filteredGalleries = childGalleries.filter(g => archivedGalleriesOnly ? g.archived === true : g.archived !== true);

            if (galleriesViewMode === "list") {
              return (
                <GalleryTableView 
                  galleries={filteredGalleries.map(g => ({ 
                    id: g.id, 
                    name: g.name, 
                    assetCount: g.count || 0, 
                    timeAgo: "2 days ago" 
                  }))} 
                  onNavigate={onNavigate}
                  onMoveGalleries={handleMoveGalleries}
                />
              );
            }
            
            if (filteredGalleries.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <i className="bi bi-images text-5xl text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{archivedGalleriesOnly ? "No archived galleries" : "No galleries yet"}</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-8">
                    {archivedGalleriesOnly ? "Archive a gallery to see it here." : "Add existing galleries to this folder or create a new one."}
                  </p>
                  {!archivedGalleriesOnly && (
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setAddGalleryDialogOpen(true)}>Add Galleries</Button>
                  )}
                </div>
              );
            }
            
            return (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                {filteredGalleries.map((gallery) => {
                  const isSelected = selectedGalleries.has(gallery.id);

                  let cardState: GalleryCardState = "default";
                  if (isAnyGallerySelected && !isSelected) {
                    cardState = "bulk-select";
                  } else if (isSelected) {
                    cardState = "selected";
                  }

                  // Find matching gallery from mockGalleries for thumbnailUrl
                  const galleryData = mockGalleries.find(g => g.id === gallery.id);

                  return (
                    <GalleryCard
                      key={gallery.id}
                      name={gallery.name}
                      assetCount={gallery.count || 0}
                      timeAgo="2 days ago"
                      thumbnailUrl={galleryData?.thumbnailUrl}
                      state={cardState}
                      onSelect={() => {
                        if (isAnyGallerySelected) {
                          toggleGallerySelection(gallery.id);
                        } else {
                          onNavigate(gallery.id);
                        }
                      }}
                      onFavorite={() => {
                        // TODO: Implement favorite functionality
                      }}
                      onShare={() => {
                        // TODO: Implement share functionality
                      }}
                      onMoreOptions={() => {
                        // TODO: Implement more options menu
                      }}
                    />
                  );
                })}
              </div>
            );
          })()}
        </TabsContent>

        {/* Folders Tab */}
        <TabsContent value="folders" className="flex-1 overflow-y-auto py-6 mt-0">
          {/* Search row */}
          <div className="mb-4">
            <FacetedSearchWithTypeahead onSearch={(query) => setFolderSearchQuery(query)} placeholder="Search" />
          </div>

          {/* Controls row */}
          <div className="flex flex-wrap items-center justify-end gap-4 mb-6">
            {/* Archived Only toggle hidden — functionality preserved, toggle lives in sidebar */}
            {false && (
            <div className="flex items-center gap-2">
              <Label htmlFor="archived-folders-detail" className="text-sm text-muted-foreground">Archived Only</Label>
              <Switch id="archived-folders-detail" checked={archivedFoldersOnly} onCheckedChange={setArchivedFoldersOnly} />
            </div>
            )}
            <div className="flex items-center border border-gray-300 rounded-md bg-white">
              <Button variant="ghost" size="icon" className={`h-10 w-10 rounded-r-none text-[#6e84a3] ${folderViewMode === "grid" ? "bg-gray-100" : ""}`} onClick={() => setFolderViewMode("grid")}>
                <i className="bi bi-grid-3x3 w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className={`h-10 w-10 rounded-l-none border-l border-gray-300 text-[#6e84a3] ${folderViewMode === "table" ? "bg-gray-100" : ""}`} onClick={() => setFolderViewMode("table")}>
                <i className="bi bi-list w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Applied Filter Chips - reserved height to prevent layout shift */}
          <div className="min-h-[24px] mb-4">
            {/* Filter chips would go here when filters are active */}
          </div>

          {/* Empty state or folder children */}
          {(() => {
            const childFolders = (folder.children || []).filter(c => c.type === "folder");
            const searchFiltered = folderSearchQuery
              ? childFolders.filter(c => c.name.toLowerCase().includes(folderSearchQuery.toLowerCase()))
              : childFolders;
            const filteredChildFolders = searchFiltered.filter(c => archivedFoldersOnly ? c.archived === true : c.archived !== true);
            
            if (childFolders.length === 0 && !archivedFoldersOnly) {
              return (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                  <div className="relative mb-6">
                    <i className="bi bi-folder2-open text-6xl text-muted-foreground/30" />
                    <i className="bi bi-images text-xl text-muted-foreground/40 absolute -bottom-1 -right-2" />
                  </div>
                  {canCreateSubfolder ? (
                    <>
                      <h3 className="text-xl font-semibold mb-2">This folder is empty</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mb-1">
                        Folders help you group galleries and other folders by season, event, campaign, or purpose.
                      </p>
                      <p className="text-sm text-muted-foreground max-w-sm mb-8">
                        You can add existing content or create something new. Nothing outside this folder is affected.
                      </p>
                      <Button className="mb-3 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setAddGalleryDialogOpen(true)}>Add Galleries</Button>
                      <button className="text-sm font-medium text-foreground hover:underline" onClick={() => setNewFolderDialogOpen(true)}>New Folder</button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold mb-2">Folder limit reached</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mb-8">
                        Folders can only be nested three levels deep. You can still add galleries to organize content in this folder.
                      </p>
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setAddGalleryDialogOpen(true)}>Add Galleries</Button>
                    </>
                  )}
                </div>
              );
            }
            
            if (filteredChildFolders.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <i className="bi bi-folder text-5xl text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium mb-1">{archivedFoldersOnly ? "No archived folders" : "No folders"}</h3>
                  <p className="text-sm text-muted-foreground">{archivedFoldersOnly ? "Archive a folder to see it here." : "No sub-folders in this folder."}</p>
                </div>
              );
            }
            
            return folderViewMode === "table" ? (
              <FolderTableView
                folders={filteredChildFolders}
                onNavigate={onNavigate}
                archivedFoldersOnly={archivedFoldersOnly}
                onUnarchiveFolder={onUnarchiveFolder}
              />
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                {filteredChildFolders.map((child) => {
                  // Count galleries in this folder
                  const galleryCount = child.children?.filter(c => c.type === "gallery").length || 0;

                  return (
                    <FolderCard
                      key={child.id}
                      name={child.name}
                      galleryCount={galleryCount}
                      state="default"
                      onSelect={() => onNavigate(child.id)}
                      onMoreOptions={() => {
                        // TODO: Implement more options menu
                      }}
                    />
                  );
                })}
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* Folder Action Dialogs */}
      <EditFolderDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={(data) => {
          setEditOpen(false);
          onEditFolder?.(folderId, data);
          toast({ title: "Folder updated", description: `"${data.name}" has been saved.` });
        }}
        folder={folder}
        currentLocationId={breadcrumbPath.length > 2 ? breadcrumbPath[breadcrumbPath.length - 2].id : null}
        currentGalleryIds={folder.children?.filter(c => c.type === "gallery").map(c => c.id) ?? []}
        flattenedFolders={flattenFolders(folderTree)}
        galleries={mockGalleries}
        folderTree={folderTree}
        onCreateGallery={onCreateGallery}
      />
      <MoveFolderDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        onMove={(targetId) => {
          setMoveOpen(false);
          onMoveFolder?.(folderId, targetId);
          toast({ title: "Folder moved", description: `"${folder.name}" has been moved.` });
        }}
        folder={folder}
        breadcrumbPath={breadcrumbPath.map(b => b.name).join(" > ")}
        flattenedFolders={flattenFolders(folderTree)}
        folderTree={folderTree}
      />
      <ArchiveFolderDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        onArchive={() => {
          setArchiveOpen(false);
          onArchiveFolder?.(folderId);
          toast({ title: "Folder archived", description: `"${folder.name}" has been archived.` });
        }}
        folder={folder}
        breadcrumbPath={breadcrumbPath.map(b => b.name).join(" > ")}
      />
      <UnarchiveFolderDialog
        open={unarchiveOpen}
        onOpenChange={setUnarchiveOpen}
        onUnarchive={() => {
          setUnarchiveOpen(false);
          onUnarchiveFolder?.(folderId);
          toast({ title: "Folder unarchived", description: `"${folder.name}" has been unarchived.` });
        }}
        folderName={folder.name}
      />
      <DeleteFolderDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDelete={() => {
          setDeleteOpen(false);
          onDeleteFolder?.(folderId);
          toast({ title: "Folder deleted", description: `"${folder.name}" has been permanently deleted.`, variant: "destructive" });
        }}
        folder={folder}
      />
      <AddGalleryDialog
        open={addGalleryDialogOpen}
        onOpenChange={setAddGalleryDialogOpen}
        galleries={galleryList ?? mockGalleries}
        disabledGalleryIds={collectAssignedGalleryIds(folderTree)}
        onSelectGalleries={(ids) => {
          onAddGalleriesToFolder?.(ids, folderId);
          setAddGalleryDialogOpen(false);
        }}
        onCreateNew={() => setNewGalleryDialogOpen(true)}
      />
      <NewGalleryDialog
        open={newGalleryDialogOpen}
        onOpenChange={setNewGalleryDialogOpen}
        onCreateGallery={(data) => {
          onCreateGallery?.({ ...data, folderId: data.folderId ?? folderId });
          setNewGalleryDialogOpen(false);
          sonnerToast.success("Gallery created successfully");
        }}
        flattenedFolders={flattenedFolders ?? flattenFolders(folderTree)}
        defaultFolderId={folderId}
      />
      <NewFolderDialog
        open={newFolderDialogOpen}
        onOpenChange={setNewFolderDialogOpen}
        defaultLocationId={folderId}
        onCreateFolder={(data) => {
          const folderData = { ...data, locationId: data.locationId ?? folderId };
          onCreateFolder?.(folderData);
          setNewFolderDialogOpen(false);
          sonnerToast.success("Folder created successfully");
        }}
        flattenedFolders={flattenedFolders ?? flattenFolders(folderTree)}
        galleries={galleryList ?? mockGalleries}
        folderTree={folderTree}
        onCreateGallery={onCreateGallery}
      />
      <MoveGalleriesDialog
        open={moveGalleriesOpen}
        onOpenChange={setMoveGalleriesOpen}
        galleries={moveGalleryItems}
        flattenedFolders={flattenedFolders ?? flattenFolders(folderTree)}
        onMove={(locationId) => {
          const idsToMove = moveGalleryItems.map(g => g.id);
          setMoveGalleriesOpen(false);
          setSelectedGalleries(new Set());
          onMoveGalleries?.(idsToMove, locationId);
        }}
      />
    </div>
  );
}
