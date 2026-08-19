import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { cn } from "@/lib/utils";
import { AssetBulkActionBar } from "@/components/AssetBulkActionBar";
import { AssetTableView, DEFAULT_ASSET_COLUMN_VISIBILITY, ASSET_COLUMNS, type AssetColumnVisibility } from "@/components/AssetTableView";
import { SettingsDrawer, useDisplayLabel, usePerPagePreference, useColumnVisibility } from "@/components/SettingsDrawer";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SectionTabs } from "@/components/SectionTabs";
import { StickyHeaderBlock } from "@/components/StickyHeaderBlock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FacetedSearchWithTypeahead } from "@/components/FacetedSearchWithTypeahead";
import { GalleryDetailsFilterBar, GalleryDetailsFilterBarHandle, ActiveFilterChip } from "@/components/GalleryDetailsFilterBar";
import { FiltersSheet, FilterSection } from "@/components/FiltersSheet";
import { useLibrarySearch } from "@/hooks/useLibrarySearch";
import { getRelativeTime, LibraryAsset } from "@/lib/mockLibraryData";
import { FolderItem, getAllDescendantIds, flattenFolders, getGalleryLocationDisplay } from "@/lib/mockFolderData";
import { matchesDateRange, DateRangeValue, CustomRange } from "@/lib/dateRangeFilter";
import { relevanceScore } from "@/lib/relevance";
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
import { AssetDetailModal } from "@/components/AssetDetailModal";

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
  onArchiveGallery?: (galleryId: string) => void;
  onUnarchiveGallery?: (galleryId: string) => void;
  /** Deep link (&bulk=1): select all assets once they load, so the bulk bar is open on arrival. */
  initialSelectAll?: boolean;
}

// Sort options for gallery assets
type SortField = "relevance" | "dateCreated" | "captureDate" | "name" | "creator" | null;
type SortDir = "asc" | "desc";

const SORT_OPTIONS: { value: NonNullable<SortField>; label: string }[] = [
  { value: "dateCreated", label: "Added" },
  { value: "captureDate", label: "Captured" },
  { value: "name", label: "Name" },
  { value: "creator", label: "Creator" },
];

const SORT_LABELS: Record<NonNullable<SortField>, string> = {
  relevance: "Relevance",
  dateCreated: "Added",
  captureDate: "Captured",
  name: "Name",
  creator: "Creator",
};

export function GalleryDetailsView({ galleryId, gallery, onNavigate, isMobile = false, folderTree, onArchiveGallery, onUnarchiveGallery, initialSelectAll = false }: GalleryDetailsViewProps) {
  const [activeTab, setActiveTab] = useState("assets");
  const [moveGalleriesOpen, setMoveGalleriesOpen] = useState(false);
  // View mode state (grid vs list)
  const [assetsViewMode, setAssetsViewMode] = useState<"grid" | "list">("grid");

  // Asset selection state for bulk actions
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  // Multi-select MODE flag (PORTAL-12949): banner shows while mode is on, even at 0 selected
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const inMultiSelect = multiSelectMode || selectedAssets.size > 0;

  // Asset detail modal state
  const [viewingAssetId, setViewingAssetId] = useState<string | null>(null);

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
  // PORTAL-12776: current text query + whether the user pinned a sort during it
  const [activeQuery, setActiveQuery] = useState("");
  const sortPinnedByUserRef = useRef(false);
  // Last explicitly chosen (non-relevance) sort — restored when the query clears
  const lastChosenSortRef = useRef<{ field: NonNullable<SortField>; dir: SortDir }>({ field: "dateCreated", dir: "desc" });

  const handleSortChange = useCallback((field: NonNullable<SortField>) => {
    if (activeQuery) sortPinnedByUserRef.current = true;
    if (sortField === field) {
      setSortDirection(prev => {
        const next = prev === "asc" ? "desc" : "asc";
        if (field !== "relevance") lastChosenSortRef.current = { field, dir: next };
        return next;
      });
    } else {
      setSortField(field);
      setSortDirection("desc");
      if (field !== "relevance") lastChosenSortRef.current = { field, dir: "desc" };
    }
  }, [sortField, activeQuery]);

  // Relevance is only offered while a text query is present
  const visibleSortOptions = activeQuery
    ? [{ value: "relevance" as const, label: "Relevance" }, ...SORT_OPTIONS]
    : SORT_OPTIONS;

  // Query present → Relevance unless pinned; query cleared → unpin + restore the
  // user's last selected sort (their choice persists in-app until changed)
  useEffect(() => {
    if (activeQuery) {
      if (!sortPinnedByUserRef.current) {
        setSortField("relevance");
        setSortDirection("desc");
      }
    } else {
      sortPinnedByUserRef.current = false;
      if (sortField === "relevance") {
        setSortField(lastChosenSortRef.current.field);
        setSortDirection(lastChosenSortRef.current.dir);
      }
    }
  }, [activeQuery, sortField]);

  // Filter state (driven by FilterBar)
  const [contentTypeFilter, setContentTypeFilter] = useState<Array<LibraryAsset["type"]>>([]);
  const [creatorFilter, setCreatorFilter] = useState<string[]>([]);
  const [orientationFilter, setOrientationFilter] = useState<LibraryAsset["orientation"][]>([]);
  const [peopleFilter, setPeopleFilter] = useState<string[]>([]);
  const [addedDateFilter, setAddedDateFilter] = useState<DateRangeValue | null>(null);
  const [capturedDateFilter, setCapturedDateFilter] = useState<DateRangeValue | null>(null);
  // Custom ranges keyed by date filter id ("added-date" / "captured-date")
  const [customDateRanges, setCustomDateRanges] = useState<Record<string, CustomRange>>({});

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
      if (orientationFilter.length && !orientationFilter.includes(asset.orientation)) return false;

      // People filter
      if (peopleFilter.length) {
        const lowerTags = asset.tags.map((t) => t.toLowerCase());
        const matchesAny = peopleFilter.some((p) => lowerTags.includes(p.toLowerCase()));
        if (!matchesAny) return false;
      }

      // Added Date filter (when the asset entered Greenfly)
      if (addedDateFilter && !matchesDateRange(asset.dateCreated, addedDateFilter, customDateRanges["added-date"])) return false;

      // Captured Date filter (when the media was originally shot)
      if (capturedDateFilter && !matchesDateRange(asset.captureDate, capturedDateFilter, customDateRanges["captured-date"])) return false;

      return true;
    });
  }, [
    results,
    allowedFolderIds,
    contentTypeFilter,
    creatorFilter,
    orientationFilter,
    peopleFilter,
    addedDateFilter,
    capturedDateFilter,
    customDateRanges,
  ]);

  // Apply the active sort — including Relevance while a text query is present
  // (PORTAL-12776). The dropdown previously rendered a sort that never applied.
  const sortedResults = useMemo(() => {
    if (!sortField) return filteredResults;
    if (sortField === "relevance") {
      const q = activeQuery.toLowerCase();
      return [...filteredResults].sort((a, b) => {
        const cmp = relevanceScore(a, q) - relevanceScore(b, q);
        if (cmp !== 0) return sortDirection === "asc" ? cmp : -cmp;
        return b.dateCreated.getTime() - a.dateCreated.getTime();
      });
    }
    return [...filteredResults].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "dateCreated": cmp = a.dateCreated.getTime() - b.dateCreated.getTime(); break;
        case "captureDate": cmp = a.captureDate.getTime() - b.captureDate.getTime(); break;
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "creator": cmp = a.creator.localeCompare(b.creator); break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [filteredResults, sortField, sortDirection, activeQuery]);

  // Apply the deep-linked select-all once assets have loaded (consume-once, so
  // clearing the selection afterwards doesn't re-trigger it).
  const bulkAppliedRef = useRef(false);
  useEffect(() => {
    if (initialSelectAll && !bulkAppliedRef.current && filteredResults.length > 0) {
      bulkAppliedRef.current = true;
      setSelectedAssets(new Set(sortedResults.map(a => a.id)));
    }
  }, [initialSelectAll, filteredResults]);

  // PORTAL-12949: selection clears (mode stays) on facet change, new search, or
  // page-size change. First results change is the initial load - skipping it keeps
  // the &bulk=1 deep-link selection applied above intact.
  const skipFirstClearRef = useRef(true);
  useEffect(() => {
    if (skipFirstClearRef.current) {
      skipFirstClearRef.current = false;
      return;
    }
    setSelectedAssets(new Set());
  }, [results, contentTypeFilter, creatorFilter, orientationFilter, peopleFilter, addedDateFilter, capturedDateFilter, customDateRanges, assetPerPage]);

  const viewingAsset = useMemo(() => {
    if (!viewingAssetId) return null;
    return sortedResults.find((a) => a.id === viewingAssetId) || null;
  }, [viewingAssetId, sortedResults]);

  const viewingAssetIndex = useMemo(() => {
    if (!viewingAssetId) return -1;
    return sortedResults.findIndex((a) => a.id === viewingAssetId);
  }, [viewingAssetId, sortedResults]);

  const handleViewAsset = useCallback((assetId: string) => {
    setViewingAssetId(assetId);
  }, []);

  const handlePreviousAsset = useCallback(() => {
    if (viewingAssetIndex > 0) {
      setViewingAssetId(sortedResults[viewingAssetIndex - 1].id);
    }
  }, [viewingAssetIndex, sortedResults]);

  const handleNextAsset = useCallback(() => {
    if (viewingAssetIndex < sortedResults.length - 1) {
      setViewingAssetId(sortedResults[viewingAssetIndex + 1].id);
    }
  }, [viewingAssetIndex, sortedResults]);

  // Handle search from FacetedSearch component
  const handleSearch = useCallback(
    (query: string, selectedFacets: string[]) => {
      const facets = selectedFacets.map((facet) => ({
        field: "tag",
        value: facet.toLowerCase(),
        label: facet,
      }));
      search(query, facets);
      setActiveQuery(query.trim());
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
      case "orientation":
        setOrientationFilter(values as LibraryAsset["orientation"][]);
        break;
      case "people":
        setPeopleFilter(values);
        break;
      case "added-date":
        setAddedDateFilter((values[0] as DateRangeValue) ?? null);
        break;
      case "captured-date":
        setCapturedDateFilter((values[0] as DateRangeValue) ?? null);
        break;
    }
  }, []);

  const handleCustomDateChange = useCallback((filterId: string, range: CustomRange) => {
    setCustomDateRanges(prev => ({ ...prev, [filterId]: range }));
  }, []);

  return (
    <div className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden px-6 md:px-9 content-container ${isMobile ? "pt-[72px]" : ""}`}>
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
                <DropdownMenuItem onClick={() => {
                  // TODO: Implement edit gallery
                }}>
                  <i className="bi bi-pencil-square w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Edit Gallery
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  toast({ title: "Link copied", description: "Gallery link copied to clipboard." });
                }}>
                  <i className="bi bi-link-45deg w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Copy Gallery Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMoveGalleriesOpen(true)}>
                  <i className="bi bi-arrows-move w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Move Gallery
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // TODO: Implement favorite gallery
                }}>
                  <i className="bi bi-heart w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Mark as Favorite
                </DropdownMenuItem>
                {gallery.archived === true ? (
                  <DropdownMenuItem onClick={() => onUnarchiveGallery?.(galleryId)}>
                    <i className="bi bi-archive w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Unarchive Gallery
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onArchiveGallery?.(galleryId)}>
                    <i className="bi bi-archive w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Archive Gallery
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <i className="bi bi-trash w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Delete Gallery
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <span className="text-xs text-muted-foreground">Shared with 3 user(s)</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <SectionTabs
          tabs={[
            { value: "assets", label: "Assets" },
            { value: "overview", label: "Overview" },
            { value: "public-settings", label: "Public Settings" },
          ]}
          value={activeTab}
          onValueChange={setActiveTab}
          isMobile={isMobile}
        />

        <TabsContent value="assets" className="flex-1 overflow-y-auto pb-6 mt-0">
          {/* Sticky header: search + filters + chips + bulk bar pin while content scrolls */}
          <StickyHeaderBlock>
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
                    {visibleSortOptions.map(opt => (
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
                  className={`h-10 w-10 rounded-l-none text-[#6e84a3] ${multiSelectMode ? "bg-gray-100" : ""}`}
                  onClick={() => {
                    if (multiSelectMode) {
                      setSelectedAssets(new Set());
                    }
                    setMultiSelectMode(!multiSelectMode);
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
              onCustomDateChange={handleCustomDateChange}
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
          {inMultiSelect && (
            <AssetBulkActionBar
              selectedCount={selectedAssets.size}
              allSelected={sortedResults.length > 0 && selectedAssets.size === sortedResults.length}
              someSelected={selectedAssets.size > 0 && selectedAssets.size < sortedResults.length}
              onSelectAll={(checked) => {
                if (checked) {
                  setSelectedAssets(new Set(sortedResults.map(a => a.id)));
                } else {
                  setSelectedAssets(new Set());
                }
              }}
              onMoveToGallery={() => {
                // TODO: Implement move to gallery
              }}
              onRemoveFromGallery={() => {
                // TODO: Implement remove from gallery
              }}
            />
          )}

          </StickyHeaderBlock>{/* End sticky header */}

          {/* Assets Grid/Table with Loading State */}
          <div className="min-h-[400px]">
            {assetsViewMode === "list" ? (
              <AssetTableView
                assets={sortedResults}
                isLoading={isLoading}
                selectedAssets={selectedAssets}
                onSelectAsset={(id, checked) => {
                  const next = new Set(selectedAssets);
                  if (checked) next.add(id); else next.delete(id);
                  setSelectedAssets(next);
                }}
                onSelectAll={(checked) => {
                  if (checked) setSelectedAssets(new Set(sortedResults.map(a => a.id)));
                  else setSelectedAssets(new Set());
                }}
                onOpenAsset={handleViewAsset}
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
            ) : sortedResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <i className="bi bi-image text-5xl text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-1">No assets found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
                {sortedResults.map((asset) => {
                  const isSelected = selectedAssets.has(asset.id);
                  const isAnySelected = inMultiSelect;

                  let cardState: AssetCardState = "default";
                  if (isAnySelected && !isSelected) {
                    cardState = "bulk-select";
                  } else if (isSelected) {
                    cardState = "selected";
                  }

                  return (
                    <div
                      key={asset.id}
                      onClick={() => {
                        // If in bulk select mode, toggle selection instead of opening detail
                        if (inMultiSelect) {
                          const next = new Set(selectedAssets);
                          if (next.has(asset.id)) {
                            next.delete(asset.id);
                          } else {
                            next.add(asset.id);
                          }
                          setSelectedAssets(next);
                        } else {
                          handleViewAsset(asset.id);
                        }
                      }}
                    >
                      <AssetCard
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
                    </div>
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
          assetCount: gallery.countType === "assets" ? gallery.count : undefined,
        }]}
        flattenedFolders={flattenFolders(folderTree)}
        onMove={(locationId) => {
          setMoveGalleriesOpen(false);
          toast({ title: "Gallery moved", description: `"${gallery.name}" has been moved successfully.` });
        }}
        movingArchivedOnly={gallery.archived === true}
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

      {/* Asset Detail Modal */}
      <AssetDetailModal
        open={viewingAssetId !== null}
        onOpenChange={(open) => {
          if (!open) setViewingAssetId(null);
        }}
        asset={viewingAsset}
        currentIndex={viewingAssetIndex}
        totalAssets={sortedResults.length}
        onPrevious={handlePreviousAsset}
        onNext={handleNextAsset}
      />
    </div>
  );
}
