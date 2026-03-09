import { useState, useCallback, useMemo, useRef } from "react";
import { ChevronDown, ChevronRight, Grid3X3, List, CheckSquare, Image, Images, Video, MoreVertical, MoreHorizontal, Upload, Settings2, FolderOpen, Pencil, Move, Archive, Trash2, Folder, Plus, Heart, ArchiveRestore, Search, X } from "lucide-react";
import { AssetTableView } from "@/components/AssetTableView";
import { AssetBulkActionBar } from "@/components/AssetBulkActionBar";
import { GalleryTableView, GalleryTableItem } from "@/components/GalleryTableView";
import { FolderTableView } from "@/components/FolderTableView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FacetedSearchWithTypeahead } from "@/components/FacetedSearchWithTypeahead";
import { FilterBar } from "@/components/FilterBar";
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
import { DeleteFolderDialog } from "@/components/DeleteFolderDialog";
import { MoveGalleriesDialog, MoveGalleryItem } from "@/components/MoveGalleriesDialog";
import { toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

const GALLERY_MOVE_LIMIT = 5;
const MOVE_LIMIT_MESSAGE = "Too many galleries selected. You may only move up to 5 at a time.";
const ASSET_BULK_LIMIT = 20;

// Icon component for asset types
function AssetTypeIcon({ type, className }: { type: LibraryAsset["type"]; className?: string }) {
  switch (type) {
    case "video":
      return <Video className={className} />;
    default:
      return <Image className={className} />;
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
  onMoveGalleries?: (moves: Record<string, string | null>) => void;
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
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1 text-sm mb-6 flex-shrink-0 pt-4">
        {breadcrumbPath.map((item, index) => (
          <div key={item.id} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            {index < breadcrumbPath.length - 1 ? (
              <button
                onClick={() => onNavigate(item.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </button>
            ) : (
              <span className="text-foreground font-medium">{item.name}</span>
            )}
          </div>
        ))}
      </nav>

      {/* Folder Header */}
      <div className="flex items-start justify-between mb-6 flex-shrink-0">
        <h1 className="text-2xl font-semibold">{folder.name}</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                New
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canCreateSubfolder && (
                <DropdownMenuItem onClick={() => setNewFolderDialogOpen(true)}>
                  <Folder className="w-4 h-4 mr-2" />
                  New Folder
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setNewGalleryDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Gallery
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAddGalleryDialogOpen(true)}>
                <Images className="w-4 h-4 mr-2" />
                Add Existing Gallery
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMoveOpen(true)}>
                <Move className="w-4 h-4 mr-2" /> Move
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setArchiveOpen(true)}>
                <Archive className="w-4 h-4 mr-2" /> Archive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="border-b flex-shrink-0">
          <TabsList className="bg-transparent h-auto p-0 gap-6">
            <TabsTrigger
              value="assets"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Assets
            </TabsTrigger>
            <TabsTrigger
              value="galleries"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Galleries
            </TabsTrigger>
            <TabsTrigger
              value="folders"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Folders
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Assets Tab */}
        <TabsContent value="assets" className="flex-1 overflow-y-auto py-6 mt-0">
          {/* Faceted Search */}
          <div className="mb-4">
            <FacetedSearchWithTypeahead onSearch={handleSearch} assets={allAssets} placeholder="Search by people, tags, filenames…" />
          </div>

          {/* Filters and Controls - Single Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <FilterBar onFilterChange={handleFilterChange} onCustomDateChange={handleCustomDateChange} hideFilters={["folders"]} />

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-background">
                    120 per Page
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>24 per Page</DropdownMenuItem>
                  <DropdownMenuItem>48 per Page</DropdownMenuItem>
                  <DropdownMenuItem>120 per Page</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {assetsViewMode === "list" && (
                <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-background">
                  <Settings2 className="w-3.5 h-3.5" />
                  Manage Columns
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-background">
                    Sort
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Date (Newest)</DropdownMenuItem>
                  <DropdownMenuItem>Date (Oldest)</DropdownMenuItem>
                  <DropdownMenuItem>Name (A-Z)</DropdownMenuItem>
                  <DropdownMenuItem>Name (Z-A)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center border rounded-md bg-background">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 rounded-r-none ${assetsViewMode === "grid" ? "bg-muted" : ""}`}
                  onClick={() => setAssetsViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 rounded-none border-x ${assetsViewMode === "list" ? "bg-muted" : ""}`}
                  onClick={() => setAssetsViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 rounded-l-none ${selectedAssets.size > 0 ? "bg-muted" : ""}`}
                  onClick={() => {
                    if (selectedAssets.size > 0) {
                      setSelectedAssets(new Set());
                    } else {
                      setSelectedAssets(new Set(filteredResults.map(a => a.id)));
                    }
                  }}
                >
                  <CheckSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                <Image className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-1">No assets found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredResults.map((asset) => (
                  <div 
                    key={asset.id} 
                    className={`group cursor-pointer bg-card rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${selectedAssets.has(asset.id) ? "ring-2 ring-primary" : ""}`}
                    onClick={() => {
                      if (selectedAssets.size > 0) {
                        const next = new Set(selectedAssets);
                        if (next.has(asset.id)) next.delete(asset.id); else next.add(asset.id);
                        setSelectedAssets(next);
                      }
                    }}
                  >
                    {/* Thumbnail area */}
                    <div className="aspect-[4/3] bg-muted/50 flex items-center justify-center relative">
                      {/* Checkbox overlay */}
                      {(selectedAssets.size > 0) && (
                        <div className="absolute top-2 left-2 z-10">
                          <Checkbox
                            checked={selectedAssets.has(asset.id)}
                            onCheckedChange={(checked) => {
                              const next = new Set(selectedAssets);
                              if (checked) next.add(asset.id); else next.delete(asset.id);
                              setSelectedAssets(next);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select ${asset.name}`}
                          />
                        </div>
                      )}
                      {selectedAssets.size === 0 && (
                        <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Checkbox
                            checked={false}
                            onCheckedChange={() => {
                              setSelectedAssets(new Set([asset.id]));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select ${asset.name}`}
                          />
                        </div>
                      )}
                      <AssetTypeIcon type={asset.type} className="w-10 h-10 text-muted-foreground/40" />
                      {/* Metadata badges */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                        {asset.aspectRatio && (
                          <span className="text-[10px] font-medium text-muted-foreground bg-background/90 px-1.5 py-0.5 rounded">
                            {asset.aspectRatio}
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-muted-foreground bg-background/90 px-1.5 py-0.5 rounded uppercase">
                          {asset.type}
                        </span>
                      </div>
                      {asset.duration && (
                        <span className="absolute bottom-2 left-2 text-[10px] font-medium text-muted-foreground bg-background/90 px-1.5 py-0.5 rounded">
                          {asset.duration}
                        </span>
                      )}
                    </div>
                    {/* Card info */}
                    <div className="p-3">
                      <div className="font-medium text-sm truncate mb-1">{asset.name}</div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">
                            {asset.creator}
                          </div>
                          {asset.tags.length > 0 && (
                            <div className="text-xs text-primary truncate">
                              {asset.tags[0]}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-primary flex-shrink-0">
                          {getRelativeTime(asset.dateCreated)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
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
            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-white">
                    Creator
                    <ChevronDown className="w-3 h-3 opacity-50" />
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
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-white">
                    Groups
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>All Groups</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-white">
                    Date Range
                    <ChevronDown className="w-3 h-3 opacity-50" />
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
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-white">
                    Last Added Date
                    <ChevronDown className="w-3 h-3 opacity-50" />
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
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Archived Only</span>
                <Switch checked={archivedGalleriesOnly} onCheckedChange={setArchivedGalleriesOnly} className="scale-75" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-background">
                    120 per Page
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>24 per Page</DropdownMenuItem>
                  <DropdownMenuItem>48 per Page</DropdownMenuItem>
                  <DropdownMenuItem>120 per Page</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {galleriesViewMode === "list" && (
                <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-background">
                  <Settings2 className="w-3.5 h-3.5" />
                  Manage Columns
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-background">
                    Sort
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Date (Newest)</DropdownMenuItem>
                  <DropdownMenuItem>Date (Oldest)</DropdownMenuItem>
                  <DropdownMenuItem>Name (A-Z)</DropdownMenuItem>
                  <DropdownMenuItem>Name (Z-A)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center border rounded-md bg-background">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 rounded-r-none ${galleriesViewMode === "grid" ? "bg-muted" : ""}`}
                  onClick={() => setGalleriesViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 rounded-none border-l ${galleriesViewMode === "list" ? "bg-muted" : ""}`}
                  onClick={() => setGalleriesViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 rounded-l-none border-l ${isAnyGallerySelected ? "bg-muted" : ""}`}
                  onClick={() => toggleSelectAllGalleries()}
                >
                  <CheckSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
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
                  <Heart className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: "Archived", description: `${selectedGalleries.size} ${selectedGalleries.size === 1 ? "gallery" : "galleries"} archived.` })}>
                  <Archive className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
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
                              <Move className="w-4 h-4 mr-2" /> Move
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
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
                  <Images className="w-12 h-12 text-muted-foreground/30 mb-4" />
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredGalleries.map((gallery) => {
                  const isSelected = selectedGalleries.has(gallery.id);
                  return (
                    <div
                      key={gallery.id}
                      className={`group cursor-pointer bg-card rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow text-left relative ${isSelected ? "ring-2 ring-primary" : ""}`}
                    >
                      {archivedGalleriesOnly && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2 z-10 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnarchiveFolder?.(gallery.id);
                            toast({ title: "Gallery unarchived", description: `"${gallery.name}" has been unarchived.` });
                          }}
                        >
                          Unarchive
                        </Button>
                      )}
                      {/* Checkbox overlay */}
                      <div
                        className={`absolute top-2 left-2 z-10 ${isAnyGallerySelected || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                        onClick={(e) => { e.stopPropagation(); toggleGallerySelection(gallery.id); }}
                      >
                        <Checkbox checked={isSelected} />
                      </div>
                      {/* Thumbnail area */}
                      <div
                        className="aspect-[4/3] bg-muted/50 flex items-center justify-center"
                        onClick={() => { if (!archivedGalleriesOnly) onNavigate(gallery.id); }}
                      >
                        <Images className="w-10 h-10 text-muted-foreground/40" />
                      </div>
                      {/* Card info */}
                      <div className="p-3" onClick={() => { if (!archivedGalleriesOnly) onNavigate(gallery.id); }}>
                        <div className="font-medium text-sm truncate mb-1">{gallery.name}</div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
                            {gallery.count || 0} Assets
                          </span>
                          <span className="text-xs text-primary flex-shrink-0">
                            2 days ago
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {getGalleryLocationDisplay(gallery.id, folderTree)}
                        </div>
                      </div>
                    </div>
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
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Label htmlFor="archived-folders-detail" className="text-sm text-muted-foreground">Archived Only</Label>
              <Switch id="archived-folders-detail" checked={archivedFoldersOnly} onCheckedChange={setArchivedFoldersOnly} />
            </div>
            <div className="flex items-center border rounded-md bg-background">
              <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-r-none ${folderViewMode === "grid" ? "bg-muted" : ""}`} onClick={() => setFolderViewMode("grid")}>
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-l-none border-l ${folderViewMode === "table" ? "bg-muted" : ""}`} onClick={() => setFolderViewMode("table")}>
                <List className="w-4 h-4" />
              </Button>
            </div>
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
                    <FolderOpen className="h-16 w-16 text-muted-foreground/30" />
                    <Images className="h-6 w-6 text-muted-foreground/40 absolute -bottom-1 -right-2" />
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
                  <Folder className="w-12 h-12 text-muted-foreground/30 mb-4" />
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredChildFolders.map((child) => (
                  <div
                    key={child.id}
                    onClick={() => { if (!archivedFoldersOnly) onNavigate(child.id); }}
                    className="group cursor-pointer bg-card rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow text-left relative"
                  >
                    {archivedFoldersOnly && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 z-10 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnarchiveFolder?.(child.id);
                          toast({ title: "Folder unarchived", description: `"${child.name}" has been unarchived.` });
                        }}
                      >
                        Unarchive
                      </Button>
                    )}
                    <div className="aspect-[4/3] bg-muted/50 flex items-center justify-center">
                      <FolderOpen className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                    <div className="p-3">
                      <div className="font-medium text-sm truncate mb-1">{child.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {child.children?.length || 0} items
                      </div>
                    </div>
                  </div>
                ))}
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
        onMove={(moves) => {
          setMoveGalleriesOpen(false);
          setSelectedGalleries(new Set());
          onMoveGalleries?.(moves);
          const count = Object.keys(moves).length;
          toast({ title: "Galleries moved", description: `${count} ${count === 1 ? "gallery" : "galleries"} moved successfully.` });
        }}
      />
    </div>
  );
}
