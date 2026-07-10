import { useState, useCallback, useMemo, useRef } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { cn } from "@/lib/utils";
import { AssetBulkActionBar } from "@/components/AssetBulkActionBar";
import { AssetTableView, DEFAULT_ASSET_COLUMN_VISIBILITY, ASSET_COLUMNS, type AssetColumnVisibility } from "@/components/AssetTableView";
import { SettingsDrawer, useDisplayLabel, usePerPagePreference, useColumnVisibility } from "@/components/SettingsDrawer";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FacetedSearchWithTypeahead } from "@/components/FacetedSearchWithTypeahead";
import { GalleryDetailsFilterBar, GalleryDetailsFilterBarHandle, ActiveFilterChip } from "@/components/GalleryDetailsFilterBar";
import { FiltersSheet, FilterSection } from "@/components/FiltersSheet";
import { useLibrarySearch } from "@/hooks/useLibrarySearch";
import { getRelativeTime, LibraryAsset } from "@/lib/mockLibraryData";
import { FolderItem, getAllDescendantIds, flattenFolders, getGalleryLocationDisplay } from "@/lib/mockFolderData";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoveGalleriesDialog, MoveGalleryItem } from "@/components/MoveGalleriesDialog";
import { toast } from "@/hooks/use-toast";
import { AssetCard, AssetCardState } from "@/components/AssetCard";

// Icon component for asset types
function AssetTypeIcon({ type, className }: { type: LibraryAsset["type"]; className?: string }) {
  switch (type) {
    case "video":
      return <i className={`bi bi-camera-video ${className || ""}`} />;
    default:
      return <i className={`bi bi-image ${className || ""}`} />;
  }
}

// Build breadcrumb path from root to the target folder/gallery
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

interface GalleryDetailsViewProps {
  galleryId: string;
  gallery: FolderItem;
  onNavigate: (folderId: string) => void;
  isMobile?: boolean;
  folderTree: FolderItem[];
}

// Sort options for gallery assets
type SortField = "dateCreated" | "captureDate" | "name" | "creator" | null;
type SortDir = "asc" | "desc";

const SORT_OPTIONS: { value: NonNullable<SortField>; label: string }[] = [
  { value: "dateCreated", label: "Added" },
  { value: "captureDate", label: "Captured" },
  { value: "name", label: "Name" },
  { value: "creator", label: "Creator" },
];

const SORT_LABELS: Record<NonNullable<SortField>, string> = {
  dateCreated: "Added",
  captureDate: "Captured",
  name: "Name",
  creator: "Creator",
};

export function GalleryDetailsView({ galleryId, gallery, onNavigate, isMobile = false, folderTree }: GalleryDetailsViewProps) {
  const [activeTab, setActiveTab] = useState("assets");
  const [moveGalleriesOpen, setMoveGalleriesOpen] = useState(false);
  // View mode state (grid vs list)
  const [assetsViewMode, setAssetsViewMode] = useState<"grid" | "list">("grid");

  // Asset selection state for bulk actions
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  // Settings drawer state
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [displayLabel, setDisplayLabel] = useDisplayLabel();

  // Table preferences - persistent across sessions
  const [assetPerPage, setAssetPerPage] = usePerPagePreference("gallery-assets", 40);
  const [assetColumnVisibility, setAssetColumnVisibility] = useColumnVisibility<AssetColumnVisibility>("gallery-assets", DEFAULT_ASSET_COLUMN_VISIBILITY);

  // Filter chips state and ref
  const [filterChips, setFilterChips] = useState<ActiveFilterChip[]>([]);
  const filterBarHandleRef = useRef<GalleryDetailsFilterBarHandle | null>(null);

  // Filters sheet state for narrow widths
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField>("dateCreated");
  const [sortDirection, setSortDirection] = useState<SortDir>("desc");

  const handleSortChange = useCallback((field: NonNullable<SortField>) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }, [sortField]);

  // Filter state (driven by FilterBar)
  const [contentTypeFilter, setContentTypeFilter] = useState<Array<LibraryAsset["type"]>>([]);
  const [creatorFilter, setCreatorFilter] = useState<string[]>([]);
  const [aspectRatioFilter, setAspectRatioFilter] = useState<LibraryAsset["aspectRatio"][]>([]);
  const [peopleFilter, setPeopleFilter] = useState<string[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<"today" | "week" | "month" | "quarter" | "year" | "custom" | null>(null);
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

  // Use the library search hook
  const { results, allAssets, isLoading, search } = useLibrarySearch();

  // Build breadcrumb path
  const breadcrumbPath = useMemo(() => {
    const path = buildBreadcrumbPath(galleryId, folderTree);
    // Include "All Media" at the start
    return path ? [{ id: "all", name: "All Media", type: "folder" as const }, ...path.filter(p => p.id !== "all")] : [];
  }, [galleryId, folderTree]);

  // Get allowed folder IDs (the gallery itself)
  const allowedFolderIds = useMemo(() => {
    return getAllDescendantIds(gallery);
  }, [gallery]);

  // Filter results by gallery and all active filters
  const filteredResults = useMemo(() => {
    return results.filter((asset) => {
      // Folder filter (only show assets in this gallery)
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

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden px-6 md:px-9 content-container">
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

      {/* Gallery Header */}
      <div className="flex items-start justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Gallery Thumbnail */}
          <div className="w-[82px] h-[82px] rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={gallery.thumbnailUrl || `https://picsum.photos/seed/${galleryId}/200/200`}
              alt={gallery.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-[26px] font-semibold text-foreground mb-1">{gallery.name}</h1>
            {/* Feature Badges */}
            <div className="flex items-center gap-1.5">
              {/* Shared/External */}
              <div className="w-7 h-7 rounded-md bg-[#9747FF] flex items-center justify-center">
                <i className="bi bi-folder-symlink-fill text-white text-sm" />
              </div>
              {/* View Only */}
              <div className="w-7 h-7 rounded-md bg-[#6E84A3] flex items-center justify-center">
                <i className="bi bi-eye text-white text-sm" />
              </div>
              {/* Allow Upload */}
              <div className="w-7 h-7 rounded-md bg-[#6E84A3] flex items-center justify-center">
                <i className="bi bi-upload text-white text-sm" />
              </div>
              {/* Expiration/Date */}
              <div className="w-7 h-7 rounded-md bg-[#F6C343] flex items-center justify-center">
                <i className="bi bi-calendar-date text-[#12263F] text-sm" />
              </div>
              {/* Collection/Inbox */}
              <div className="w-7 h-7 rounded-md bg-[#39AFD1] flex items-center justify-center">
                <i className="bi bi-archive text-white text-sm" />
              </div>
              {/* Folder */}
              <div className="w-7 h-7 rounded-md bg-[#6E84A3] flex items-center justify-center">
                <i className="bi bi-folder text-white text-sm" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Button className="gap-2">
              <i className="bi bi-upload w-4 h-4 inline-flex items-center justify-center leading-none" />
              Upload
            </Button>
            <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/5">
              <i className="bi bi-share w-4 h-4 inline-flex items-center justify-center leading-none" />
              Share
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="border-primary text-primary hover:bg-primary/5">
                  <i className="bi bi-three-dots-vertical w-4 h-4 inline-flex items-center justify-center leading-none" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setMoveGalleriesOpen(true)}>
                  <i className="bi bi-arrows-move w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Move
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <i className="bi bi-trash w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <span className="text-xs text-muted-foreground">Shared with 3 user(s)</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="border-b flex-shrink-0">
          <TabsList>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="public-settings">Public Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="assets" className="flex-1 overflow-y-auto py-6 mt-0">
          {/* Search Row with Utility Cluster */}
          <div className="flex items-center gap-4 mb-3 cq-search-row">
            <div className="flex-1 min-w-0 cq-search-input">
              <FacetedSearchWithTypeahead onSearch={handleSearch} assets={allAssets} placeholder="Search by people, tags, filenames…" />
            </div>

            <div className="flex items-center gap-2 cq-compact-sm flex-shrink-0 cq-utility-cluster">
              {assetsViewMode === "grid" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 gap-2 px-3 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]" title={`Sort: ${sortField ? SORT_LABELS[sortField] : "Default"}`}>
                      <i className="bi bi-arrow-down-up w-4 h-4 inline-flex items-center justify-center leading-none" />
                      <span className="sort-label">{sortField ? SORT_LABELS[sortField] : "Default"}</span>
                      <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white w-48">
                    {SORT_OPTIONS.map(opt => (
                      <DropdownMenuItem key={opt.value} onClick={() => handleSortChange(opt.value)} className="flex items-center justify-between">
                        {opt.label}
                        {sortField === opt.value && <span className="text-xs text-muted-foreground ml-2">{sortDirection === "desc" ? "↓" : "↑"}</span>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <div className="flex items-center border border-gray-300 rounded-md bg-white">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 rounded-r-none text-[#6e84a3] ${assetsViewMode === "grid" ? "bg-gray-100" : ""}`}
                  onClick={() => setAssetsViewMode("grid")}
                >
                  <i className="bi bi-grid w-4 h-4 inline-flex items-center justify-center leading-none" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 rounded-none border-x border-gray-300 text-[#6e84a3] ${assetsViewMode === "list" ? "bg-gray-100" : ""}`}
                  onClick={() => setAssetsViewMode("list")}
                >
                  <i className="bi bi-table w-4 h-4 inline-flex items-center justify-center leading-none" />
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
                  <i className="bi bi-check-square w-4 h-4 inline-flex items-center justify-center leading-none" />
                </Button>
              </div>

              {/* Settings button */}
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-md border-gray-300 bg-white text-[#6e84a3]"
                onClick={() => setSettingsDrawerOpen(true)}
              >
                <i className="bi bi-gear w-4 h-4 inline-flex items-center justify-center leading-none" />
              </Button>
            </div>
          </div>

          {/* Filter Row */}
          <div className="mb-3">
            <GalleryDetailsFilterBar
              onFilterChange={handleFilterChange}
              onActiveFiltersChange={setFilterChips}
              handleRef={filterBarHandleRef}
              onOpenFiltersSheet={() => setFiltersSheetOpen(true)}
            />
          </div>

          {/* Applied Filter Chips - reserved height to prevent layout shift */}
          <div className="min-h-[24px] mb-4">
            {filterChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {filterChips.map((chip, i) => (
                  <Badge
                    key={`${chip.filterId}-${chip.value}-${i}`}
                    colorStyle="primary"
                    theme="soft"
                    shape="rounded"
                    className="gap-1.5 pr-1.5 cursor-pointer transition-colors hover:bg-primary/30 text-[13px] normal-case tracking-normal font-normal"
                    onClick={() => filterBarHandleRef.current?.removeValue(chip.filterId, chip.value)}
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
            )}
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
              galleryActionLabel="Remove from Gallery"
            />
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
                perPage={assetPerPage}
                columnVisibility={assetColumnVisibility}
              />
            ) : isLoading ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="group">
                    <Skeleton className="aspect-[5/6] rounded-[24px] mb-2" />
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
                      title={asset.name}
                      displayLabel={displayLabel}
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

        <TabsContent value="overview" className="flex-1 overflow-y-auto py-6 mt-0">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold mb-4">Gallery Overview</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Total Assets</div>
                  <div className="text-2xl font-semibold">{gallery.count || 0}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Created</div>
                  <div className="text-2xl font-semibold">Jun 26, 2024</div>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-2">Description</div>
                <p className="text-sm">No description available for this gallery.</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="public-settings" className="flex-1 overflow-y-auto py-6 mt-0">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold mb-4">Public Settings</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium mb-1">Public Access</div>
                  <div className="text-sm text-muted-foreground">Allow anyone with the link to view this gallery</div>
                </div>
                <Button variant="outline">Disabled</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium mb-1">Allow Uploads</div>
                  <div className="text-sm text-muted-foreground">Let external users upload content to this gallery</div>
                </div>
                <Button variant="outline">Disabled</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium mb-1">Download Permission</div>
                  <div className="text-sm text-muted-foreground">Allow viewers to download assets</div>
                </div>
                <Button variant="outline">Enabled</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <MoveGalleriesDialog
        open={moveGalleriesOpen}
        onOpenChange={setMoveGalleriesOpen}
        galleries={[{
          id: galleryId,
          name: gallery.name,
          currentLocation: getGalleryLocationDisplay(galleryId, folderTree),
        }]}
        flattenedFolders={flattenFolders(folderTree)}
        onMove={(locationId) => {
          setMoveGalleriesOpen(false);
          toast({ title: "Gallery moved", description: `"${gallery.name}" has been moved successfully.` });
        }}
      />

      {/* Filters Sheet (for narrow widths) */}
      <FiltersSheet
        open={filtersSheetOpen}
        onOpenChange={setFiltersSheetOpen}
        value={{}}
        onApply={() => {
          // TODO: Apply draft filters when controls are wired up
        }}
        title="Gallery Asset Filters"
      >
        <FilterSection label="Type" icon="bi-image">
          <div className="text-sm text-muted-foreground">Content type filters will go here</div>
        </FilterSection>
        <FilterSection label="Tags" icon="bi-tag">
          <div className="text-sm text-muted-foreground">Tags filters will go here</div>
        </FilterSection>
        <FilterSection label="Creator" icon="bi-person">
          <div className="text-sm text-muted-foreground">Creator filters will go here</div>
        </FilterSection>
        <FilterSection label="Capture Date" icon="bi-calendar">
          <div className="text-sm text-muted-foreground">Date range filters will go here</div>
        </FilterSection>
        <FilterSection label="Source" icon="bi-cloud-arrow-down">
          <div className="text-sm text-muted-foreground">Source filters will go here</div>
        </FilterSection>
      </FiltersSheet>

      {/* Settings Drawer */}
      <SettingsDrawer
        open={settingsDrawerOpen}
        onOpenChange={setSettingsDrawerOpen}
        displayLabel={displayLabel}
        onDisplayLabelChange={setDisplayLabel}
      >
        {/* Table preferences - always shown, disabled when not in table view */}
        {(() => {
          const isTableView = assetsViewMode === "list";
          return (
            <div className="space-y-4">
              {/* Per page dropdown */}
              <div className={cn("space-y-2", !isTableView && "opacity-50")}>
                <Label className="text-sm font-medium">Results per page</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={!isTableView}>
                    <Button variant="outline" className="w-full justify-between" disabled={!isTableView}>
                      {assetPerPage} per page
                      <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full bg-white">
                    {[10, 20, 40, 80].map(option => (
                      <DropdownMenuItem key={option} onClick={() => setAssetPerPage(option)}>
                        {option} per page
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {/* Column visibility */}
              <div className={cn("space-y-2", !isTableView && "opacity-50")}>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Manage Columns</Label>
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isTableView}
                    onClick={() => setAssetColumnVisibility(DEFAULT_ASSET_COLUMN_VISIBILITY)}
                  >
                    Default
                  </button>
                </div>
                <div className="space-y-2">
                  {ASSET_COLUMNS.map(col => (
                    <label key={col.key} className={cn("flex items-center gap-2", isTableView ? "cursor-pointer" : "cursor-not-allowed")}>
                      <Checkbox
                        checked={assetColumnVisibility[col.key]}
                        onCheckedChange={() => isTableView && setAssetColumnVisibility(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
                        disabled={!isTableView}
                      />
                      <span className="text-sm">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </SettingsDrawer>
    </div>
  );
}
