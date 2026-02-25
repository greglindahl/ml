import { useState, useCallback, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Folder, ChevronDown, Plus, Upload, Grid3X3, List, CheckSquare, Image, Images, Video, Loader2, Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FacetedSearchWithDropdown } from "@/components/FacetedSearchWithDropdown";
import { FilterBar } from "@/components/FilterBar";
import { useLibrarySearch } from "@/hooks/useLibrarySearch";
import { getRelativeTime, LibraryAsset } from "@/lib/mockLibraryData";
import { folders, mockGalleries, mockFolderCards, FolderItem } from "@/lib/mockFolderData";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icon component for asset types
function AssetTypeIcon({ type, className }: { type: LibraryAsset["type"]; className?: string }) {
  switch (type) {
    case "video":
      return <Video className={className} />;
    default:
      return <Image className={className} />;
  }
}

interface LibraryScreenV4Props {
  isMobile?: boolean;
}

type GridSortField = "creator" | "dateCreated" | "captureDate" | "downloads" | "shares" | "galleries" | "tags" | "viewers" | "publicViews" | "status" | "favorites" | "lastDownloadDate" | null;
type SortDirection = "asc" | "desc";

const SORT_OPTIONS: { value: NonNullable<GridSortField>; label: string }[] = [
  { value: "creator", label: "Creator" },
  { value: "dateCreated", label: "Added Date" },
  { value: "captureDate", label: "Capture Date" },
  { value: "downloads", label: "Downloads" },
  { value: "shares", label: "Shares" },
  { value: "galleries", label: "Galleries" },
  { value: "tags", label: "Tags" },
  { value: "viewers", label: "Viewers" },
  
  { value: "status", label: "Approval Status" },
  { value: "favorites", label: "Favorites" },
  { value: "lastDownloadDate", label: "Last Download Date" },
];

const SORT_LABELS: Record<string, string> = Object.fromEntries(SORT_OPTIONS.map(o => [o.value, o.label]));

export function LibraryScreenV4({ isMobile = false }: LibraryScreenV4Props) {
  const [activeTab, setActiveTab] = useState("assets");
  // Default expanded on folders tab, collapsed on other tabs
  const [isFolderSidebarExpanded, setIsFolderSidebarExpanded] = useState(false);
  const [activeFolder, setActiveFolder] = useState("all");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // Track search query and filter bar state separately
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFacets, setSearchFacets] = useState<string[]>([]);
  const [filterBarState, setFilterBarState] = useState<Record<string, string[]>>({});
  
  // Auto-expand/collapse sidebar based on active tab
  useEffect(() => {
    setIsFolderSidebarExpanded(activeTab === "folders");
  }, [activeTab]);
  
  // Branded toggle state
  const [isBrandedActive, setIsBrandedActive] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<GridSortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSortChange = useCallback((field: NonNullable<GridSortField>) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }, [sortField]);

  // Use the library search hook
  const { results, allAssets, isLoading, totalCount, search } = useLibrarySearch();

  // Filter and sort results
  const filteredResults = useMemo(() => {
    let filtered = results.filter(asset => {
      if (isBrandedActive && !asset.isBranded) return false;
      return true;
    });

    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case "creator": comparison = a.creator.localeCompare(b.creator); break;
          case "dateCreated": comparison = a.dateCreated.getTime() - b.dateCreated.getTime(); break;
          case "captureDate": comparison = a.captureDate.getTime() - b.captureDate.getTime(); break;
          case "downloads": comparison = a.downloads - b.downloads; break;
          case "shares": comparison = a.shares - b.shares; break;
          case "galleries": comparison = a.galleries - b.galleries; break;
          case "tags": comparison = a.tags.length - b.tags.length; break;
          case "viewers": comparison = a.viewers - b.viewers; break;
        case "publicViews": comparison = a.publicViews - b.publicViews; break;
          case "status": comparison = a.status.localeCompare(b.status); break;
          case "favorites": comparison = a.favorites - b.favorites; break;
          case "lastDownloadDate":
            comparison = (a.lastDownloadDate?.getTime() ?? 0) - (b.lastDownloadDate?.getTime() ?? 0);
            break;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [results, isBrandedActive, sortField, sortDirection]);

  // Combined search that merges search facets with filter bar state
  const triggerSearch = useCallback((query: string, facets: string[], filters: Record<string, string[]>) => {
    // Convert string facets from search to facet objects
    const searchFacetObjs = facets.map(facet => ({
      field: "tag",
      value: facet.toLowerCase(),
      label: facet,
    }));

    // Convert filter bar state to facet objects
    const filterFacetObjs: { field: string; value: string; label: string }[] = [];
    
    Object.entries(filters).forEach(([filterId, values]) => {
      values.forEach(value => {
        // Map filter IDs to facet fields
        let field = filterId;
        if (filterId === "content-type") field = "type";
        if (filterId === "aspect-ratio") field = "aspect";
        if (filterId === "date-range") field = "date";
        if (filterId === "tags") field = "tag";
        if (filterId === "people") field = "tag"; // People are also tags
        if (filterId === "scene") field = "tag"; // Scene tags are also tags
        if (filterId === "brand") field = "tag"; // Brand tags are also tags
        
        filterFacetObjs.push({
          field,
          value,
          label: value,
        });
      });
    });

    const allFacets = [...searchFacetObjs, ...filterFacetObjs];
    search(query, allFacets);
  }, [search]);

  // Handle search from FacetedSearch component
  const handleSearch = useCallback((query: string, selectedFacets: string[]) => {
    setSearchQuery(query);
    setSearchFacets(selectedFacets);
    triggerSearch(query, selectedFacets, filterBarState);
  }, [triggerSearch, filterBarState]);

  // Handle filter bar changes
  const handleFilterChange = useCallback((filterId: string, values: string[]) => {
    setFilterBarState(prev => {
      const newState = { ...prev };
      if (values.length === 0) {
        delete newState[filterId];
      } else {
        newState[filterId] = values;
      }
      // Trigger search with updated filters
      triggerSearch(searchQuery, searchFacets, newState);
      return newState;
    });
  }, [triggerSearch, searchQuery, searchFacets]);

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const renderFolder = (folder: FolderItem, depth = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isActive = activeFolder === folder.id;
    const isGallery = folder.type === "gallery";
    const isAllFiles = folder.id === "all";
    const hasExpandableContent = hasChildren || (folder.count && folder.count > 0 && !isGallery);

    return (
      <div key={folder.id}>
        <button
          onClick={() => {
            setActiveFolder(folder.id);
            if (hasChildren) toggleFolderExpand(folder.id);
          }}
          className={`w-full flex items-center gap-2 py-1.5 text-sm rounded-md transition-colors ${
            isActive
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px`, paddingRight: 12 }}
        >
          {/* Chevron for expandable items */}
          {hasExpandableContent && !isAllFiles ? (
            <ChevronDown
              className={`w-4 h-4 flex-shrink-0 transition-transform text-muted-foreground ${
                isExpanded ? "" : "-rotate-90"
              }`}
            />
          ) : !isAllFiles ? (
            <span className="w-4 flex-shrink-0" />
          ) : null}
          
          {/* Icon - Gallery or Folder */}
          {!isAllFiles && (
            isGallery ? (
              <Images className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            ) : (
              <Folder className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            )
          )}
          
          {/* Name */}
          <span className={`truncate ${isActive ? "font-medium" : ""}`}>{folder.name}</span>
        </button>
        
        {/* Count displayed below the name */}
        {folder.count !== undefined && folder.countType && !isAllFiles && (
          <div 
            className="text-xs text-muted-foreground"
            style={{ paddingLeft: `${12 + depth * 16 + (hasExpandableContent ? 24 : 24)}px` }}
          >
            {folder.count} {folder.countType}
          </div>
        )}
        
        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {folder.children!.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Determine if we should show expanded sidebar (user can toggle on any tab)
  const isFoldersTab = activeTab === "folders";

  return (
    <div className="flex-1 flex">
      {/* Folders Sidebar - Always visible, toggleable on all tabs */}
      <div
        className={`border-r bg-card flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
          isFolderSidebarExpanded ? "w-64 opacity-100" : "w-12 opacity-100"
        }`}
      >
        {isFolderSidebarExpanded ? (
          <>
            {/* Sidebar Header - Expanded */}
            <div className="p-4 border-b flex items-center justify-between min-w-64">
              <span className="font-medium text-sm">Folders</span>
              <button
                onClick={() => setIsFolderSidebarExpanded(false)}
                className="p-1 hover:bg-accent rounded transition-colors"
                aria-label="Collapse folders"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Folder List */}
            <div className="flex-1 p-2 overflow-y-auto min-w-64">
              {folders.map((folder) => renderFolder(folder))}
            </div>
          </>
        ) : (
          /* Collapsed State - Icon with expand button */
          <div className="p-2 flex flex-col items-center gap-1 min-w-12">
            <button
              onClick={() => setIsFolderSidebarExpanded(true)}
              className="p-2 hover:bg-accent rounded transition-colors"
              aria-label="Expand folders"
            >
              <Folder className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => setIsFolderSidebarExpanded(true)}
              className="p-2 hover:bg-accent rounded transition-colors"
              aria-label="Expand folders"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 px-4 md:px-8 xl:px-16 pb-12 ${isMobile ? "pt-[58px]" : "pt-20"}`}>

        {/* Header with title and actions */}
        <div className="py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Library</h1>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  New
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Folder className="w-4 h-4 mr-2" />
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Plus className="w-4 h-4 mr-2" />
                  New Gallery
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b">
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
              <TabsTrigger
                value="saved"
                className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Saved
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="assets" className="flex-1 py-6 mt-0">
            {/* Faceted Search */}
            <div className="mb-4">
              <FacetedSearchWithDropdown onSearch={handleSearch} assets={allAssets} />
            </div>

            {/* Filters */}
            <div className="mb-4">
              <FilterBar
                onFilterChange={handleFilterChange}
                onBrandedToggle={setIsBrandedActive}
              />
            </div>

            {/* Row 2: Asset Controls */}
            <div className="flex items-center justify-end gap-2 mb-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    Sort{sortField ? `: ${SORT_LABELS[sortField]}` : ""}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  {SORT_OPTIONS.map(opt => (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() => handleSortChange(opt.value)}
                      className="flex items-center justify-between"
                    >
                      {opt.label}
                      {sortField === opt.value && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {sortDirection === "desc" ? "↓" : "↑"}
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center border rounded-md">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-r-none">
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none border-x">
                  <List className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-l-none">
                  <CheckSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Assets Grid with Loading State */}
            {isLoading ? (
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
                  <div key={asset.id} className="group cursor-pointer">
                    <div className="aspect-[4/3] border rounded-lg bg-muted/30 flex flex-col items-center justify-center mb-2 hover:border-primary/50 transition-colors relative overflow-hidden">
                      <AssetTypeIcon type={asset.type} className="w-8 h-8 text-muted-foreground/50" />
                      {asset.dimensions && (
                        <span className="text-[10px] text-muted-foreground/50 mt-1">{asset.dimensions}</span>
                      )}
                      {asset.duration && (
                        <span className="absolute bottom-2 right-2 text-[10px] bg-background/80 px-1 rounded">{asset.duration}</span>
                      )}
                      {/* Branded icon overlay */}
                      {isBrandedActive && asset.isBranded ? (
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                          <Palette className="w-4 h-4 text-primary" />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <AssetTypeIcon type={asset.type} className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{asset.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
                      <span className="truncate">{asset.creator}</span>
                      <span className="flex-shrink-0">{getRelativeTime(asset.dateCreated)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-muted-foreground">{asset.fileSize}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="galleries" className="flex-1 py-6 mt-0">
            {/* Galleries Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {mockGalleries.map((gallery) => (
                <div key={gallery.id} className="group cursor-pointer">
                  <div className="aspect-square border rounded-lg bg-muted/30 flex items-center justify-center mb-2 hover:border-primary/50 transition-colors">
                    <Images className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <span className="text-sm truncate block">{gallery.name}</span>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{gallery.assetCount} assets</span>
                    <span>{gallery.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="folders" className="flex-1 py-6 mt-0">
            {/* Folders Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {mockFolderCards.map((folder) => (
                <div key={folder.id} className="group cursor-pointer">
                  <div className="aspect-square border rounded-lg bg-muted/30 flex items-center justify-center mb-2 hover:border-primary/50 transition-colors">
                    <Folder className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <span className="text-sm truncate block">{folder.name}</span>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{folder.galleryCount} galleries</span>
                    <span>{folder.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="flex-1 py-6 mt-0">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Image className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-1">No saved items</h3>
              <p className="text-sm text-muted-foreground">Items you save will appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
