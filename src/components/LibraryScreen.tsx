import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Folder, ChevronDown, Plus, Upload, Grid3X3, List, CheckSquare, Image, Images, FileText, Music, Video, Loader2, Settings2, Palette, X, User, Tag, Sparkles, Search, MoreHorizontal, FolderInput, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FacetedSearchWithTypeahead } from "@/components/FacetedSearchWithTypeahead";
import type { SelectedFacet, FacetedSearchWithTypeaheadHandle } from "@/components/FacetedSearchWithTypeahead";
import { FilterBar } from "@/components/FilterBar";
import type { FilterBarHandle } from "@/components/FilterBar";
import { GalleryDetailsView } from "@/components/GalleryDetailsView";
import { FolderDetailsView } from "@/components/FolderDetailsView";
import { AssetTableView } from "@/components/AssetTableView";
import { GalleryTableView } from "@/components/GalleryTableView";
import { useLibrarySearch } from "@/hooks/useLibrarySearch";
import { getRelativeTime, LibraryAsset } from "@/lib/mockLibraryData";
import { folders as initialFolders, mockGalleries, mockFolderCards, FolderItem, findFolderById, getAllDescendantIds, flattenFolders, getGalleryLocationDisplay } from "@/lib/mockFolderData";
import { NewFolderDialog, type NewFolderData } from "@/components/NewFolderDialog";
import { AddGalleryDialog } from "@/components/AddGalleryDialog";
import { NewGalleryDialog, type NewGalleryData } from "@/components/NewGalleryDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { MoveGalleriesDialog, MoveGalleryItem } from "@/components/MoveGalleriesDialog";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GalleryFilterBar } from "@/components/GalleryFilterBar";

// Icon component for asset types
function AssetTypeIcon({ type, className }: { type: LibraryAsset["type"]; className?: string }) {
  switch (type) {
    case "video":
      return <Video className={className} />;
    default:
      return <Image className={className} />;
  }
}

// Helper to compute dynamic counts for filter dropdowns
function computeFilterCounts(assets: LibraryAsset[]) {
  const creators: Record<string, number> = {};
  const contentTypes: Record<string, number> = { image: 0, video: 0, document: 0, audio: 0 };
  const aspectRatios: Record<string, number> = { "1:1": 0, "16:9": 0, "4:3": 0, "9:16": 0 };

  assets.forEach(asset => {
    // Creator counts
    creators[asset.creator] = (creators[asset.creator] || 0) + 1;
    // Content type counts
    contentTypes[asset.type] = (contentTypes[asset.type] || 0) + 1;
    // Aspect ratio counts
    aspectRatios[asset.aspectRatio] = (aspectRatios[asset.aspectRatio] || 0) + 1;
  });

  return { creators, contentTypes, aspectRatios, total: assets.length };
}

interface LibraryScreenProps {
  isMobile?: boolean;
}

export function LibraryScreen({ isMobile = false }: LibraryScreenProps) {
  const [activeTab, setActiveTab] = useState("assets");
  const [isFolderSidebarExpanded, setIsFolderSidebarExpanded] = useState(false);
  const [activeFolder, setActiveFolder] = useState("all");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [assetsViewMode, setAssetsViewMode] = useState<"grid" | "list">("grid");
  const [galleriesViewMode, setGalleriesViewMode] = useState<"grid" | "list">("grid");
  const [folderTree, setFolderTree] = useState<FolderItem[]>(initialFolders);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [addGalleryDialogOpen, setAddGalleryDialogOpen] = useState(false);
  const [newGalleryDialogOpen, setNewGalleryDialogOpen] = useState(false);
  const [galleryList, setGalleryList] = useState(mockGalleries);
  const [selectedGalleries, setSelectedGalleries] = useState<Set<string>>(new Set());
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const { toast } = useToast();

  const flatFolders = useMemo(() => flattenFolders(folderTree), [folderTree]);

  // --- Tree mutation helpers ---
  const removeFolderById = useCallback((tree: FolderItem[], id: string): FolderItem[] => {
    return tree
      .filter(item => item.id !== id)
      .map(item => item.children ? { ...item, children: removeFolderById(item.children, id) } : item);
  }, []);

  const insertFolderAt = useCallback((tree: FolderItem[], targetId: string | null, folder: FolderItem): FolderItem[] => {
    if (targetId === null) return [...tree, folder];
    return tree.map(item => {
      if (item.id === targetId) {
        return { ...item, children: [...(item.children ?? []), folder] };
      }
      if (item.children) {
        return { ...item, children: insertFolderAt(item.children, targetId, folder) };
      }
      return item;
    });
  }, []);

  const updateFolderInTree = useCallback((tree: FolderItem[], id: string, updates: Partial<FolderItem>): FolderItem[] => {
    return tree.map(item => {
      if (item.id === id) return { ...item, ...updates };
      if (item.children) return { ...item, children: updateFolderInTree(item.children, id, updates) };
      return item;
    });
  }, []);

  const handleCreateFolder = useCallback((data: NewFolderData) => {
    const newFolder: FolderItem = {
      id: `folder-${Date.now()}`,
      name: data.name,
      type: "folder",
      count: data.galleryIds.length,
      countType: data.galleryIds.length > 0 ? "galleries" : undefined,
      children: data.galleryIds.length > 0
        ? data.galleryIds.map(gId => {
            const gallery = mockGalleries.find(g => g.id === gId);
            return {
              id: gId,
              name: gallery?.name ?? gId,
              type: "gallery" as const,
              count: gallery?.assetCount ?? 0,
              countType: "assets" as const,
            };
          })
        : undefined,
    };

    if (!data.locationId) {
      setFolderTree(prev => [...prev, newFolder]);
    } else {
      setFolderTree(prev => insertFolderAt(prev, data.locationId, newFolder));
    }
    setNewFolderDialogOpen(false);
  }, [insertFolderAt]);

  const handleEditFolder = useCallback((folderId: string, data: { name: string; locationId: string | null; galleryIds: string[] }) => {
    setFolderTree(prev => {
      // First update the name
      let tree = updateFolderInTree(prev, folderId, { name: data.name });

      // Find the folder to check if location changed
      const folder = findFolderById(tree, folderId);
      if (!folder) return tree;

      // Update gallery children
      if (data.galleryIds.length > 0) {
        const galleryChildren: FolderItem[] = data.galleryIds.map(gId => {
          const existing = folder.children?.find(c => c.id === gId);
          if (existing) return existing;
          const gallery = mockGalleries.find(g => g.id === gId);
          return {
            id: gId,
            name: gallery?.name ?? gId,
            type: "gallery" as const,
            count: gallery?.assetCount ?? 0,
            countType: "assets" as const,
          };
        });
        const nonGalleryChildren = folder.children?.filter(c => c.type === "folder") ?? [];
        tree = updateFolderInTree(tree, folderId, {
          children: [...nonGalleryChildren, ...galleryChildren],
          count: galleryChildren.length,
          countType: "galleries",
        });
      }

      // Handle location change if locationId differs from current parent
      if (data.locationId !== undefined) {
        const updatedFolder = findFolderById(tree, folderId);
        if (updatedFolder) {
          tree = removeFolderById(tree, folderId);
          tree = insertFolderAt(tree, data.locationId, updatedFolder);
        }
      }

      return tree;
    });
  }, [updateFolderInTree, removeFolderById, insertFolderAt]);

  const handleMoveFolder = useCallback((folderId: string, targetLocationId: string | null) => {
    setFolderTree(prev => {
      const folder = findFolderById(prev, folderId);
      if (!folder) return prev;
      let tree = removeFolderById(prev, folderId);
      tree = insertFolderAt(tree, targetLocationId, folder);
      return tree;
    });
  }, [removeFolderById, insertFolderAt]);

  const handleArchiveFolder = useCallback((folderId: string) => {
    setFolderTree(prev => removeFolderById(prev, folderId));
    setActiveFolder("all");
  }, [removeFolderById]);

  const handleDeleteFolder = useCallback((folderId: string) => {
    setFolderTree(prev => removeFolderById(prev, folderId));
    setActiveFolder("all");
  }, [removeFolderById]);

  // --- Gallery handlers ---
  const handleCreateGallery = useCallback((data: NewGalleryData) => {
    const newGalleryId = `gallery-${Date.now()}`;
    const newGallery = {
      id: newGalleryId,
      name: data.name,
      assetCount: 0,
      timeAgo: "Just now",
    };
    setGalleryList(prev => [...prev, newGallery]);

    // If a folder was selected, add gallery as child of that folder
    if (data.folderId) {
      const galleryNode: FolderItem = {
        id: newGalleryId,
        name: data.name,
        type: "gallery",
        count: 0,
        countType: "assets",
      };
      setFolderTree(prev => insertFolderAt(prev, data.folderId, galleryNode));
    }
    setNewGalleryDialogOpen(false);
  }, [insertFolderAt]);

  const handleAddGalleriesToFolder = useCallback((galleryIds: string[], targetFolderId: string | null) => {
    if (!targetFolderId) return;
    setFolderTree(prev => {
      let tree = prev;
      galleryIds.forEach(gId => {
        const gallery = galleryList.find(g => g.id === gId);
        if (!gallery) return;
        const galleryNode: FolderItem = {
          id: gId,
          name: gallery.name,
          type: "gallery",
          count: gallery.assetCount,
          countType: "assets",
        };
        tree = insertFolderAt(tree, targetFolderId, galleryNode);
      });
      return tree;
    });
    setAddGalleryDialogOpen(false);
  }, [galleryList, insertFolderAt]);

  const isAnyGallerySelected = selectedGalleries.size > 0;
  const allGalleriesSelected = galleryList.length > 0 && selectedGalleries.size === galleryList.length;

  const toggleGallerySelection = useCallback((galleryId: string) => {
    setSelectedGalleries(prev => {
      const next = new Set(prev);
      if (next.has(galleryId)) next.delete(galleryId);
      else next.add(galleryId);
      return next;
    });
  }, []);

  const toggleSelectAllGalleries = useCallback(() => {
    if (allGalleriesSelected) {
      setSelectedGalleries(new Set());
    } else {
      setSelectedGalleries(new Set(galleryList.map(g => g.id)));
    }
  }, [allGalleriesSelected, galleryList]);

  const handleMoveGalleries = useCallback((galleryIds: string[]) => {
    setSelectedGalleries(new Set(galleryIds));
    setIsMoveDialogOpen(true);
  }, []);

  const selectedMoveItems: MoveGalleryItem[] = useMemo(() => {
    return galleryList
      .filter(gallery => selectedGalleries.has(gallery.id))
      .map(gallery => ({
        id: gallery.id,
        name: gallery.name,
        currentLocation: getGalleryLocationDisplay(gallery.id, folderTree),
      }));
  }, [galleryList, selectedGalleries, folderTree]);

  const applyGalleryMoves = useCallback((moves: Record<string, string | null>) => {
    const count = Object.keys(moves).length;
    setIsMoveDialogOpen(false);
    setSelectedGalleries(new Set());
    toast({
      title: "Galleries moved",
      description: `${count} ${count === 1 ? "gallery" : "galleries"} moved successfully.`,
    });
  }, [toast]);

  // Auto-expand/collapse sidebar based on active tab
  useEffect(() => {
    setIsFolderSidebarExpanded(activeTab === "folders");
  }, [activeTab]);

  // Filter state (driven by FilterBar)
  const [contentTypeFilter, setContentTypeFilter] = useState<Array<LibraryAsset["type"]>>([]);
  const [creatorFilter, setCreatorFilter] = useState<string[]>([]);
  const [aspectRatioFilter, setAspectRatioFilter] = useState<LibraryAsset["aspectRatio"][]>([]);
  const [peopleFilter, setPeopleFilter] = useState<string[]>([]);
  const [sceneFilter, setSceneFilter] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [folderFilter, setFolderFilter] = useState<string[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<"today" | "week" | "month" | "quarter" | "year" | "custom" | null>(null);
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [isBrandedActive, setIsBrandedActive] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string[]>([]);
  const [orgStatusFilter, setOrgStatusFilter] = useState<string[]>([]);
  const [searchSelectedFacets, setSearchSelectedFacets] = useState<SelectedFacet[]>([]);
  const searchHandleRef = useRef<FacetedSearchWithTypeaheadHandle | null>(null);
  const filterBarHandleRef = useRef<FilterBarHandle | null>(null);

  // Sort state
  type SortField = "creator" | "dateCreated" | "captureDate" | "downloads" | "shares" | "galleries" | "tags" | "viewers" | "publicViews" | "status" | "favorites" | "lastDownloadDate" | null;
  type SortDir = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>("dateCreated");
  const [sortDirection, setSortDirection] = useState<SortDir>("desc");

  const SORT_OPTIONS: { value: NonNullable<SortField>; label: string }[] = [
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

  const handleSortChange = useCallback((field: NonNullable<SortField>) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }, [sortField]);

  // Use the library search hook
  const { results, allAssets, isLoading, totalCount, search } = useLibrarySearch();

  // Get unique creators and people from all assets
  const uniqueCreators = useMemo(() => {
    const creators = new Set(allAssets.map((a) => a.creator));
    return Array.from(creators).sort();
  }, [allAssets]);

  // Extract people from tags (tags that look like names)
  const uniquePeople = useMemo(() => {
    const people = new Set<string>();
    const excludedItems = ["looking at camera", "slam dunk", "Red Sox", "three pointer"];
    allAssets.forEach((asset) => {
      asset.tags.forEach((tag) => {
        // Consider tags with spaces as potential people names, exclude non-people items
        if (
          tag.includes(" ") &&
          !tag.includes("(") &&
          !tag.toLowerCase().includes("shot") &&
          !excludedItems.includes(tag)
        ) {
          people.add(tag);
        }
      });
    });
    return Array.from(people).sort();
  }, [allAssets]);

  // Get allowed folder IDs based on activeFolder selection
  const allowedFolderIds = useMemo(() => {
    if (activeFolder === "all") return null; // null means show all
    const folder = findFolderById(folderTree, activeFolder);
    if (!folder) return null;
    return getAllDescendantIds(folder);
  }, [activeFolder]);

  // Filter results by all active filters
  const filteredResults = useMemo(() => {
    return results.filter((asset) => {
      // Folder sidebar filter (based on activeFolder selection)
      if (allowedFolderIds !== null) {
        if (!asset.folderId || !allowedFolderIds.includes(asset.folderId)) return false;
      }

      // Content type filter
      if (contentTypeFilter.length && !contentTypeFilter.includes(asset.type)) return false;

      // Creator filter (FilterBar returns creatorId values)
      if (creatorFilter.length && !creatorFilter.includes(asset.creatorId)) return false;

      // Aspect ratio filter (multi-select)
      if (aspectRatioFilter.length && !aspectRatioFilter.includes(asset.aspectRatio)) return false;

      // People filter (check tags) - match any selected person
      if (peopleFilter.length) {
        const lowerTags = asset.tags.map((t) => t.toLowerCase());
        const matchesAny = peopleFilter.some((p) => lowerTags.includes(p.toLowerCase()));
        if (!matchesAny) return false;
      }

      // Scene filter (check tags) - match any selected scene
      if (sceneFilter.length) {
        const lowerTags = asset.tags.map((t) => t.toLowerCase());
        const matchesAny = sceneFilter.some((s) => lowerTags.includes(s.toLowerCase()));
        if (!matchesAny) return false;
      }

      // Brand filter (check tags) - match any selected brand
      if (brandFilter.length) {
        const lowerTags = asset.tags.map((t) => t.toLowerCase());
        const matchesAny = brandFilter.some((b) => lowerTags.includes(b.toLowerCase()));
        if (!matchesAny) return false;
      }

      // Tags filter (check tags) - match any selected tag
      if (tagsFilter.length) {
        const lowerTags = asset.tags.map((t) => t.toLowerCase());
        const matchesAny = tagsFilter.some((t) => lowerTags.includes(t.toLowerCase()));
        if (!matchesAny) return false;
      }

      // Date range filter
      if (dateRangeFilter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const assetDate = new Date(asset.dateCreated.getFullYear(), asset.dateCreated.getMonth(), asset.dateCreated.getDate());
        
        if (dateRangeFilter === "custom" && customDateRange.from && customDateRange.to) {
          // Custom date range filtering
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

      // Folder dropdown filter (from FilterBar - uses folder IDs and descendants)
      if (folderFilter.length) {
        // Collect all allowed folder IDs from selected folders and their descendants
        const allowedFromDropdown = new Set<string>();
        folderFilter.forEach((fId) => {
          const folder = findFolderById(folderTree, fId);
          if (folder) {
            getAllDescendantIds(folder).forEach((id) => allowedFromDropdown.add(id));
          }
        });
        if (!asset.folderId || !allowedFromDropdown.has(asset.folderId)) return false;
      }

      // Branded filter
      if (isBrandedActive && !asset.isBranded) return false;

      return true;
    });
  }, [
    results,
    allowedFolderIds,
    contentTypeFilter,
    creatorFilter,
    aspectRatioFilter,
    peopleFilter,
    sceneFilter,
    brandFilter,
    tagsFilter,
    folderFilter,
    dateRangeFilter,
    customDateRange,
    isBrandedActive,
  ]);

  // Sort filtered results
  const sortedResults = useMemo(() => {
    if (!sortField) return filteredResults;
    return [...filteredResults].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "creator": cmp = a.creator.localeCompare(b.creator); break;
        case "dateCreated": cmp = a.dateCreated.getTime() - b.dateCreated.getTime(); break;
        case "captureDate": cmp = a.captureDate.getTime() - b.captureDate.getTime(); break;
        case "downloads": cmp = a.downloads - b.downloads; break;
        case "shares": cmp = a.shares - b.shares; break;
        case "galleries": cmp = a.galleries - b.galleries; break;
        case "tags": cmp = a.tags.length - b.tags.length; break;
        case "viewers": cmp = a.viewers - b.viewers; break;
      case "publicViews": cmp = a.publicViews - b.publicViews; break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "favorites": cmp = a.favorites - b.favorites; break;
        case "lastDownloadDate":
          cmp = (a.lastDownloadDate?.getTime() ?? 0) - (b.lastDownloadDate?.getTime() ?? 0);
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [filteredResults, sortField, sortDirection]);

  // Compute dynamic filter counts based on current results
  const filterCounts = useMemo(() => computeFilterCounts(filteredResults), [filteredResults]);

  // Handle search from FacetedSearch component
  const handleSearch = useCallback(
    (query: string, selectedFacets: string[]) => {
      // Convert string facets to facet objects for the search hook
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
      case "scene":
        setSceneFilter(values);
        break;
      case "brand":
        setBrandFilter(values);
        break;
      case "tags":
        setTagsFilter(values);
        break;
      case "folders":
        setFolderFilter(values);
        break;
      case "date-range":
        setDateRangeFilter((values[0] as "today" | "week" | "month" | "quarter" | "year" | "custom") ?? null);
        break;
      case "source":
        setSourceFilter(values);
        break;
      case "status":
        setApprovalStatusFilter(values);
        break;
      case "organization-status":
        setOrgStatusFilter(values);
        break;
    }
  }, []);

  const handleCustomDateChange = useCallback((range: { from: Date | undefined; to: Date | undefined }) => {
    setCustomDateRange(range);
  }, []);

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

  // Check if active folder is a gallery or a folder (not "all")
  const activeGallery = useMemo(() => {
    if (activeFolder === "all") return null;
    const folder = findFolderById(folderTree, activeFolder);
    return folder?.type === "gallery" ? folder : null;
  }, [activeFolder, folderTree]);

  const activeFolderItem = useMemo(() => {
    if (activeFolder === "all") return null;
    const folder = findFolderById(folderTree, activeFolder);
    return folder?.type === "folder" ? folder : null;
  }, [activeFolder, folderTree]);

  // Handle navigation from folder/gallery view
  const handleNavigate = useCallback((folderId: string) => {
    setActiveFolder(folderId);
  }, []);

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
              <span className="font-medium text-sm">Library</span>
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
              {folderTree.map((folder) => renderFolder(folder))}
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

      {/* Main Content Area - Show GalleryDetailsView, FolderDetailsView, or Library content */}
      {activeGallery ? (
        <GalleryDetailsView 
          galleryId={activeGallery.id} 
          gallery={activeGallery} 
          onNavigate={handleNavigate}
          isMobile={isMobile}
          folderTree={folderTree}
        />
      ) : activeFolderItem ? (
        <FolderDetailsView 
          folderId={activeFolderItem.id} 
          folder={activeFolderItem} 
          onNavigate={handleNavigate}
          isMobile={isMobile}
          folderTree={folderTree}
          onEditFolder={handleEditFolder}
          onMoveFolder={handleMoveFolder}
          onArchiveFolder={handleArchiveFolder}
          onDeleteFolder={handleDeleteFolder}
          onCreateGallery={handleCreateGallery}
          onAddGalleriesToFolder={handleAddGalleriesToFolder}
          onCreateFolder={handleCreateFolder}
          galleryList={galleryList}
          flattenedFolders={flatFolders}
        />
      ) : (
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
                <DropdownMenuItem onClick={() => setNewFolderDialogOpen(true)}>
                  <Folder className="w-4 h-4 mr-2" />
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNewGalleryDialogOpen(true)}>
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
            <div className="mb-2">
              <FacetedSearchWithTypeahead onSearch={handleSearch} assets={allAssets} onSelectedFacetsChange={setSearchSelectedFacets} handleRef={searchHandleRef} />
            </div>

            {/* Unified Applied Filter Chips */}
            {(() => {
              // Build chip objects from all sources
              const chips: { label: string; value: string; sourceId: string; icon: React.ReactNode }[] = [];
              
              // Search facets
              searchSelectedFacets.forEach(f => {
                const isPeople = f.category === "People";
                const isBrand = f.category === "Brand";
                const isSearch = f.type === "search";
                const isAi = f.isAiGenerated;
                chips.push({
                  label: f.value.replace(/__manual$/, ''),
                  value: f.value,
                  sourceId: "search",
                  icon: isSearch ? <Search className="w-3.5 h-3.5" /> : isPeople ? <User className="w-3.5 h-3.5" /> : isBrand ? <i className="bi bi-badge-tm text-sm" /> : isAi ? <Sparkles className="w-3.5 h-3.5" /> : <Tag className="w-3.5 h-3.5" />,
                });
              });

              // FilterBar filters
              peopleFilter.forEach(v => chips.push({ label: v, value: v, sourceId: "people", icon: <User className="w-3.5 h-3.5" /> }));
              sceneFilter.forEach(v => chips.push({ label: v, value: v, sourceId: "scene", icon: <Sparkles className="w-3.5 h-3.5" /> }));
              brandFilter.forEach(v => chips.push({ label: v, value: v, sourceId: "brand", icon: <i className="bi bi-badge-tm text-sm" /> }));
              tagsFilter.forEach(v => chips.push({ label: v, value: v, sourceId: "tags", icon: <Tag className="w-3.5 h-3.5" /> }));
              creatorFilter.forEach(v => chips.push({ label: v, value: v, sourceId: "creator", icon: <User className="w-3.5 h-3.5" /> }));
              contentTypeFilter.forEach(v => chips.push({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v, sourceId: "content-type", icon: <Image className="w-3.5 h-3.5" /> }));
              aspectRatioFilter.forEach(v => chips.push({ label: v, value: v, sourceId: "aspect-ratio", icon: <Tag className="w-3.5 h-3.5" /> }));
              if (dateRangeFilter) {
                const dateLabels: Record<string, string> = { today: "Today", week: "Last 7 Days", month: "Last 30 Days", quarter: "Last 90 Days", year: "Last Year", custom: "Custom Date" };
                chips.push({ label: dateLabels[dateRangeFilter] || dateRangeFilter, value: dateRangeFilter, sourceId: "date-range", icon: <Tag className="w-3.5 h-3.5" /> });
              }
              folderFilter.forEach(v => chips.push({ label: v, value: v, sourceId: "folders", icon: <Folder className="w-3.5 h-3.5" /> }));
              sourceFilter.forEach(v => chips.push({ label: v.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: v, sourceId: "source", icon: <Upload className="w-3.5 h-3.5" /> }));
              approvalStatusFilter.forEach(v => chips.push({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v, sourceId: "status", icon: <CheckSquare className="w-3.5 h-3.5" /> }));
              orgStatusFilter.forEach(v => chips.push({ label: v === "organized" ? "Sorted" : v === "unorganized" ? "Unsorted" : v.charAt(0).toUpperCase() + v.slice(1), value: v, sourceId: "organization-status", icon: <Settings2 className="w-3.5 h-3.5" /> }));

              if (chips.length === 0) return null;

              const handleRemoveChip = (chip: typeof chips[0]) => {
                if (chip.sourceId === "search") {
                  searchHandleRef.current?.removeFacet(chip.value);
                } else {
                  // Use FilterBar's imperative handle to sync internal state
                  filterBarHandleRef.current?.removeValue(chip.sourceId, chip.value);
                }
              };

              const handleClearAllChips = () => {
                searchHandleRef.current?.clearFacetsOnly();
                filterBarHandleRef.current?.clearAll();
              };

              return (
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {chips.map((chip, i) => (
                    <Badge
                      key={`${chip.sourceId}-${chip.value}-${i}`}
                      variant="secondary"
                      className="gap-1.5 pr-1.5 cursor-pointer transition-colors hover:bg-secondary/80"
                      onClick={() => handleRemoveChip(chip)}
                    >
                      {chip.icon}
                      {chip.label}
                      <X className="w-3.5 h-3.5 ml-0.5" />
                    </Badge>
                  ))}
                  <button
                    onClick={handleClearAllChips}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                  >
                    Clear all
                  </button>
                </div>
              );
            })()}

            {/* Filters and Controls - Single Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <FilterBar onFilterChange={handleFilterChange} onCustomDateChange={handleCustomDateChange} onBrandedToggle={setIsBrandedActive} compactMode={true} handleRef={filterBarHandleRef} disabledValues={searchSelectedFacets.filter(f => f.type !== "search").map(f => ({ value: f.value, category: f.category }))} onRemoveDisabledValue={(value) => { searchHandleRef.current?.removeFacet(value); }} />

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-card">
                      Sort{sortField ? `: ${SORT_LABELS[sortField]}` : ""}
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-popover w-48">
                    {SORT_OPTIONS.map(opt => (
                      <DropdownMenuItem key={opt.value} onClick={() => handleSortChange(opt.value)} className="flex items-center justify-between">
                        {opt.label}
                        {sortField === opt.value && <span className="text-xs text-muted-foreground ml-2">{sortDirection === "desc" ? "↓" : "↑"}</span>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {assetsViewMode === "list" && (
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-card">
                    <Settings2 className="w-3.5 h-3.5" />
                    Manage Columns
                  </Button>
                )}

                <div className="flex items-center border rounded-md bg-card">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 rounded-r-none ${assetsViewMode === "grid" ? "bg-accent" : ""}`}
                    onClick={() => setAssetsViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 rounded-none border-x ${assetsViewMode === "list" ? "bg-accent" : ""}`}
                    onClick={() => setAssetsViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none">
                    <CheckSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Assets Grid/Table with Loading State */}
            <div className="min-h-[400px]">
            {assetsViewMode === "list" ? (
              <AssetTableView assets={sortedResults} isLoading={isLoading} />
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
            ) : sortedResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Image className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-1">No assets found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {sortedResults.map((asset) => (
                  <div key={asset.id} className="group cursor-pointer bg-card rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    {/* Thumbnail area */}
                    <div className="aspect-[4/3] bg-muted/50 flex items-center justify-center relative">
                      <AssetTypeIcon type={asset.type} className="w-10 h-10 text-muted-foreground/40" />
                      {/* Branded icon overlay */}
                      {isBrandedActive && asset.isBranded && (
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                          <Palette className="w-4 h-4 text-primary" />
                        </div>
                      )}
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

          <TabsContent value="galleries" className="flex-1 py-6 mt-0">
            {/* Faceted Search */}
            <div className="mb-4">
              <FacetedSearchWithTypeahead placeholder="Search" />
            </div>

            {/* Filters and Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <GalleryFilterBar />

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-card">
                      Sort{sortField ? `: ${SORT_LABELS[sortField]}` : ""}
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-popover w-48">
                    {SORT_OPTIONS.map(opt => (
                      <DropdownMenuItem key={opt.value} onClick={() => handleSortChange(opt.value)} className="flex items-center justify-between">
                        {opt.label}
                        {sortField === opt.value && <span className="text-xs text-muted-foreground ml-2">{sortDirection === "desc" ? "↓" : "↑"}</span>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {galleriesViewMode === "list" && (
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-card">
                    <Settings2 className="w-3.5 h-3.5" />
                    Manage Columns
                  </Button>
                )}

                {galleriesViewMode === "grid" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-card"
                    onClick={() => setSelectedGalleries(prev => (prev.size > 0 ? new Set() : new Set(galleryList.map(g => g.id))))}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    {isAnyGallerySelected ? `Selected (${selectedGalleries.size})` : "Bulk Select"}
                  </Button>
                )}

                <div className="flex items-center border rounded-md bg-card">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 rounded-r-none ${galleriesViewMode === "grid" ? "bg-accent" : ""}`}
                    onClick={() => setGalleriesViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 rounded-l-none ${galleriesViewMode === "list" ? "bg-accent" : ""}`}
                    onClick={() => setGalleriesViewMode("list")}
                  >
                    <List className="w-4 h-4" />
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleMoveGalleries(Array.from(selectedGalleries))}>
                      <FolderInput className="w-4 h-4 mr-2" /> Move
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Galleries Grid/Table */}
            <div className="min-h-[400px]">
              {galleriesViewMode === "list" ? (
                <GalleryTableView galleries={galleryList} onNavigate={handleNavigate} onMoveGalleries={handleMoveGalleries} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryList.map((gallery) => {
                    const isSelected = selectedGalleries.has(gallery.id);
                    return (
                      <div
                        key={gallery.id}
                        className={`group cursor-pointer border rounded-lg p-4 hover:border-primary/50 transition-colors relative ${isSelected ? "ring-2 ring-primary" : ""}`}
                        onClick={() => {
                          if (isAnyGallerySelected) {
                            toggleGallerySelection(gallery.id);
                          } else {
                            setActiveFolder(gallery.id);
                          }
                        }}
                      >
                        <div
                          className={`absolute top-2 left-2 z-10 ${isAnyGallerySelected || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGallerySelection(gallery.id);
                          }}
                        >
                          <Checkbox checked={isSelected} />
                        </div>
                        <div className="aspect-[4/3] border border-dashed rounded-lg bg-muted/30 flex items-center justify-center mb-3">
                          <div className="w-3/4 h-3/4 bg-muted/50 rounded" />
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-medium mb-1">
                          <Images className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate">{gallery.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{gallery.assetCount} Assets</span>
                          <span>{gallery.timeAgo}</span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {getGalleryLocationDisplay(gallery.id, folderTree)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="folders" className="flex-1 py-6 mt-0">
            {/* Faceted Search */}
            <div className="mb-4">
              <FacetedSearchWithTypeahead placeholder="Search" />
            </div>

            {/* Filters and Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      Creator
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>All Creators</DropdownMenuItem>
                    <DropdownMenuItem>Creator 1</DropdownMenuItem>
                    <DropdownMenuItem>Creator 2</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      Date Range
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>All Time</DropdownMenuItem>
                    <DropdownMenuItem>Last 7 Days</DropdownMenuItem>
                    <DropdownMenuItem>Last 30 Days</DropdownMenuItem>
                    <DropdownMenuItem>Last Year</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      Sort{sortField ? `: ${SORT_LABELS[sortField]}` : ""}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    {SORT_OPTIONS.map(opt => (
                      <DropdownMenuItem key={opt.value} onClick={() => handleSortChange(opt.value)} className="flex items-center justify-between">
                        {opt.label}
                        {sortField === opt.value && <span className="text-xs text-muted-foreground ml-2">{sortDirection === "desc" ? "↓" : "↑"}</span>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center border rounded-md">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-r-none">
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-l-none">
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Folders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mockFolderCards.map((folder) => (
                <div 
                  key={folder.id} 
                  className="group cursor-pointer border rounded-lg p-4 hover:border-primary/50 transition-colors"
                  onClick={() => setActiveFolder(folder.id)}
                >
                  <div className="aspect-[4/3] border rounded-lg bg-muted/30 flex items-center justify-center mb-3">
                    <Folder className="w-12 h-12 text-muted-foreground/70" />
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium mb-1">
                    <Folder className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{folder.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{folder.galleryCount} Galleries</span>
                    <span>{folder.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="flex-1 py-6 mt-0">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
              <p>Saved content placeholder</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      )}
      <MoveGalleriesDialog
        open={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        galleries={selectedMoveItems}
        flattenedFolders={flatFolders}
        onMove={applyGalleryMoves}
      />
      <NewFolderDialog
        open={newFolderDialogOpen}
        onOpenChange={setNewFolderDialogOpen}
        onCreateFolder={handleCreateFolder}
        flattenedFolders={flatFolders}
        galleries={galleryList}
      />
      <AddGalleryDialog
        open={addGalleryDialogOpen}
        onOpenChange={setAddGalleryDialogOpen}
        galleries={galleryList}
        onSelectGalleries={(ids) => handleAddGalleriesToFolder(ids, activeFolder !== "all" ? activeFolder : null)}
        onCreateNew={() => setNewGalleryDialogOpen(true)}
      />
      <NewGalleryDialog
        open={newGalleryDialogOpen}
        onOpenChange={setNewGalleryDialogOpen}
        onCreateGallery={handleCreateGallery}
        flattenedFolders={flatFolders}
      />
    </div>
  );
}
