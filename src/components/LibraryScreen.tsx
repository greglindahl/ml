import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { AssetBulkActionBar } from "@/components/AssetBulkActionBar";
import { GalleryTableView } from "@/components/GalleryTableView";
import { FolderTableView } from "@/components/FolderTableView";
import { useLibrarySearch } from "@/hooks/useLibrarySearch";
import { getRelativeTime, LibraryAsset } from "@/lib/mockLibraryData";
import { folders as initialFolders, mockGalleries, mockFolderCards, FolderItem, findFolderById, getAllDescendantIds, flattenFolders, getGalleryLocationDisplay, collectAssignedGalleryIds } from "@/lib/mockFolderData";
import { FolderSidebar } from "@/components/FolderSidebar";
import { NewFolderDialog, type NewFolderData } from "@/components/NewFolderDialog";
import { AddGalleryDialog } from "@/components/AddGalleryDialog";
import { NewGalleryDialog, type NewGalleryData } from "@/components/NewGalleryDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { MoveGalleriesDialog, MoveGalleryItem } from "@/components/MoveGalleriesDialog";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GalleryFilterBar } from "@/components/GalleryFilterBar";
import { GalleryCard, GalleryCardState } from "@/components/GalleryCard";
import { AssetCard, AssetCardState } from "@/components/AssetCard";
import { FolderCard, FolderCardState } from "@/components/FolderCard";
import { SettingsDrawer, useDisplayLabel } from "@/components/SettingsDrawer";

const GALLERY_MOVE_LIMIT = 5;
const MOVE_LIMIT_MESSAGE = "Too many galleries selected. You may only move up to 5 at a time.";

// Icon component for asset types
function AssetTypeIcon({ type, className }: { type: LibraryAsset["type"]; className?: string }) {
  switch (type) {
    case "video":
      return <i className={`bi bi-camera-video ${className || ""}`} />;
    default:
      return <i className={`bi bi-image ${className || ""}`} />;
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
  const [archivedFoldersOnly, setArchivedFoldersOnly] = useState(false);
  const [folderViewMode, setFolderViewMode] = useState<"grid" | "table">("grid");
  const [archivedGalleriesOnly, setArchivedGalleriesOnly] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  // Settings drawer state
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [displayLabel, setDisplayLabel] = useDisplayLabel();

  // Toggle pill states for FilterBar
  const [isUnsortedActive, setIsUnsortedActive] = useState(false);
  const [isUnviewedActive, setIsUnviewedActive] = useState(false);

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
            const gallery = galleryList.find(g => g.id === gId);
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
    // Auto-expand parent and new folder so galleries are visible
    setExpandedFolders(prev => {
      const next = new Set([...prev, newFolder.id]);
      if (data.locationId) next.add(data.locationId);
      return next;
    });
    setIsFolderSidebarExpanded(true);
    setNewFolderDialogOpen(false);
    sonnerToast.success("Folder created successfully");
  }, [insertFolderAt, galleryList]);

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
          const gallery = galleryList.find(g => g.id === gId);
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
  }, [updateFolderInTree, removeFolderById, insertFolderAt, galleryList]);

  const handleMoveFolder = useCallback((folderId: string, targetLocationId: string | null) => {
    setFolderTree(prev => {
      const folder = findFolderById(prev, folderId);
      if (!folder) return prev;
      let tree = removeFolderById(prev, folderId);
      tree = insertFolderAt(tree, targetLocationId, folder);
      return tree;
    });
  }, [removeFolderById, insertFolderAt]);

  // DnD: move an item (folder or gallery) into a target folder
  const handleDndMoveItem = useCallback((itemId: string, targetFolderId: string | null) => {
    setFolderTree(prev => {
      const item = findFolderById(prev, itemId);
      if (!item) return prev;
      let tree = removeFolderById(prev, itemId);
      tree = insertFolderAt(tree, targetFolderId, item);
      return tree;
    });
    // Auto-expand target so user sees the moved item
    if (targetFolderId) {
      setExpandedFolders(prev => new Set([...prev, targetFolderId]));
    }
  }, [removeFolderById, insertFolderAt]);

  // DnD: reorder siblings within the same parent
  const handleDndReorder = useCallback((parentId: string | null, itemId: string, overItemId: string) => {
    setFolderTree(prev => {
      const reorderInList = (items: FolderItem[]): FolderItem[] => {
        const oldIndex = items.findIndex(i => i.id === itemId);
        const newIndex = items.findIndex(i => i.id === overItemId);
        if (oldIndex === -1 || newIndex === -1) return items;
        const updated = [...items];
        const [moved] = updated.splice(oldIndex, 1);
        updated.splice(newIndex, 0, moved);
        return updated;
      };

      if (parentId === null) {
        return reorderInList(prev);
      }

      const reorderInTree = (items: FolderItem[]): FolderItem[] => {
        return items.map(item => {
          if (item.id === parentId && item.children) {
            return { ...item, children: reorderInList(item.children) };
          }
          if (item.children) {
            return { ...item, children: reorderInTree(item.children) };
          }
          return item;
        });
      };
      return reorderInTree(prev);
    });
  }, []);

  const handleArchiveFolder = useCallback((folderId: string) => {
    setFolderTree(prev => updateFolderInTree(prev, folderId, { archived: true }));
    setActiveFolder("all");
  }, [updateFolderInTree]);

  const handleUnarchiveFolder = useCallback((folderId: string) => {
    setFolderTree(prev => updateFolderInTree(prev, folderId, { archived: false }));
  }, [updateFolderInTree]);

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
      setExpandedFolders(prev => new Set([...prev, data.folderId]));
    }
    setNewGalleryDialogOpen(false);
    sonnerToast.success("Gallery created successfully");
    return newGallery;
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
    setExpandedFolders(prev => new Set([...prev, targetFolderId]));
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

  const applyGalleryMoves = useCallback((galleryIds: string[], targetLocationId: string | null) => {
    const count = galleryIds.length;
    if (count === 0) return;
    setIsMoveDialogOpen(false);
    setSelectedGalleries(new Set());

    setFolderTree(prev => {
      let tree = prev;
      for (const galleryId of galleryIds) {
        const galleryNode = findFolderById(tree, galleryId);
        if (!galleryNode) continue;
        // Use the same proven helpers as folder move
        tree = removeFolderById(tree, galleryId);
        if (targetLocationId) {
          tree = insertFolderAt(tree, targetLocationId, galleryNode);
        }
        // If targetLocationId is null ("All Media"), just remove from tree
      }
      return tree;
    });

    // Auto-expand target so the move is visible in sidebar
    if (targetLocationId) {
      setExpandedFolders(prev => new Set([...prev, targetLocationId]));
    }

    toast({
      title: "Galleries moved",
      description: `${count} ${count === 1 ? "gallery" : "galleries"} moved successfully.`,
    });
  }, [toast, removeFolderById, insertFolderAt]);

  // Auto-expand/collapse sidebar based on active tab
  useEffect(() => {
    setIsFolderSidebarExpanded(activeTab === "folders");
    setSelectedAssets(new Set());
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
    <div className="flex-1 flex h-screen overflow-hidden">
      {/* Folders Sidebar with DnD */}
      <FolderSidebar
        folderTree={folderTree}
        activeFolder={activeFolder}
        expandedFolders={expandedFolders}
        isFolderSidebarExpanded={isFolderSidebarExpanded}
        onSetActiveFolder={setActiveFolder}
        onToggleFolderExpand={toggleFolderExpand}
        onSetSidebarExpanded={setIsFolderSidebarExpanded}
        onMoveItem={handleDndMoveItem}
        onReorder={handleDndReorder}
        showArchived={archivedFoldersOnly}
        onToggleArchived={setArchivedFoldersOnly}
      />

      {/* Main Content Area - Show GalleryDetailsView, FolderDetailsView, or Library content */}
      {activeGallery ? (
        <GalleryDetailsView
          galleryId={activeGallery.id}
          gallery={activeGallery}
          onNavigate={handleNavigate}
          isMobile={isMobile}
          folderTree={folderTree}
          onOpenSettings={() => setSettingsDrawerOpen(true)}
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
          onUnarchiveFolder={handleUnarchiveFolder}
          onDeleteFolder={handleDeleteFolder}
          onCreateGallery={handleCreateGallery}
          onAddGalleriesToFolder={handleAddGalleriesToFolder}
          onCreateFolder={handleCreateFolder}
          onMoveGalleries={applyGalleryMoves}
          galleryList={galleryList}
          flattenedFolders={flatFolders}
        />
      ) : (
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden px-4 md:px-8 xl:px-16 content-container">
        {/* Breadcrumb spacer - matches FolderDetailsView/GalleryDetailsView for consistent header position */}
        <div className="mb-2 h-[44px] flex-shrink-0" />

        {/* Header with title and actions */}
        <div className="flex items-center justify-between flex-shrink-0 mb-6">
          <h1 className="text-[26px] font-semibold text-foreground">Library</h1>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 px-3 py-2 gap-2 text-primary border-primary hover:bg-primary/5"
                >
                  <i className="bi bi-plus-circle w-4 h-4" />
                  New
                  <i className="bi bi-chevron-down w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setNewFolderDialogOpen(true)}>
                  <i className="bi bi-folder w-4 h-4 mr-2" />
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNewGalleryDialogOpen(true)}>
                  <i className="bi bi-plus w-4 h-4 mr-2" />
                  New Gallery
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="h-10 px-3 py-2 gap-2">
              <i className="bi bi-upload w-4 h-4" />
              Upload
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="border-b flex-shrink-0">
            <TabsList>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="galleries">Galleries</TabsTrigger>
              <TabsTrigger value="folders">Folders</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="workflows">Workflows</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="assets" className="flex-1 overflow-y-auto py-6 mt-0">
            {/* Search Row with Utility Cluster */}
            <div className="flex items-center gap-4 mb-3 cq-search-row">
              <div className="flex-1 min-w-0 cq-search-input">
                <FacetedSearchWithTypeahead onSearch={handleSearch} assets={allAssets} onSelectedFacetsChange={setSearchSelectedFacets} handleRef={searchHandleRef} placeholder="Search by people, tags, filenames…" />
              </div>

              <div className="flex items-center gap-2 cq-compact-sm flex-shrink-0 cq-utility-cluster">
                {assetsViewMode === "grid" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]">
                        Sort{sortField ? `: ${SORT_LABELS[sortField]}` : ""}
                        <i className="bi bi-chevron-down w-4 h-4" />
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
                    <i className="bi bi-grid w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-10 w-10 rounded-none border-x border-gray-300 text-[#6e84a3] ${assetsViewMode === "list" ? "bg-gray-100" : ""}`}
                    onClick={() => setAssetsViewMode("list")}
                  >
                    <i className="bi bi-table w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-10 w-10 rounded-l-none text-[#6e84a3] ${selectedAssets.size > 0 ? "bg-gray-100" : ""}`}
                    onClick={() => {
                      if (selectedAssets.size > 0) {
                        setSelectedAssets(new Set());
                      } else {
                        setSelectedAssets(new Set(sortedResults.map(a => a.id)));
                      }
                    }}
                  >
                    <i className="bi bi-check-square w-4 h-4" />
                  </Button>
                </div>

                {/* Settings button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-md border-gray-300 bg-white text-[#6e84a3]"
                  onClick={() => setSettingsDrawerOpen(true)}
                >
                  <i className="bi bi-gear w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="mb-3">
              <FilterBar
                onFilterChange={handleFilterChange}
                onCustomDateChange={handleCustomDateChange}
                compactMode={true}
                handleRef={filterBarHandleRef}
                disabledValues={searchSelectedFacets.filter(f => f.type !== "search").map(f => ({ value: f.value, category: f.category }))}
                onRemoveDisabledValue={(value) => { searchHandleRef.current?.removeFacet(value); }}
                isUnsortedActive={isUnsortedActive}
                onUnsortedToggle={setIsUnsortedActive}
                isUnviewedActive={isUnviewedActive}
                onUnviewedToggle={setIsUnviewedActive}
                isBrandingActive={isBrandedActive}
                onBrandingToggle={setIsBrandedActive}
              />
            </div>

            {/* Applied Filter Chips - reserved height to prevent layout shift */}
            <div className="min-h-[24px] mb-4">
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
                    icon: isSearch ? <i className="bi bi-search text-sm" /> : isPeople ? <i className="bi bi-person text-sm" /> : isBrand ? <i className="bi bi-badge-tm text-sm" /> : isAi ? <i className="bi bi-stars text-sm" /> : <i className="bi bi-tag text-sm" />,
                  });
                });

                // FilterBar filters
                peopleFilter.forEach(v => chips.push({ label: v, value: v, sourceId: "people", icon: <i className="bi bi-person text-sm" /> }));
                sceneFilter.forEach(v => chips.push({ label: v, value: v, sourceId: "scene", icon: <i className="bi bi-stars text-sm" /> }));
                brandFilter.forEach(v => chips.push({ label: v, value: v, sourceId: "brand", icon: <i className="bi bi-badge-tm text-sm" /> }));
                tagsFilter.forEach(v => chips.push({ label: v, value: v, sourceId: "tags", icon: <i className="bi bi-tag text-sm" /> }));
                creatorFilter.forEach(v => chips.push({ label: v, value: v, sourceId: "creator", icon: <i className="bi bi-person text-sm" /> }));
                contentTypeFilter.forEach(v => chips.push({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v, sourceId: "content-type", icon: <i className="bi bi-image text-sm" /> }));
                aspectRatioFilter.forEach(v => chips.push({ label: v, value: v, sourceId: "aspect-ratio", icon: <i className="bi bi-tag text-sm" /> }));
                if (dateRangeFilter) {
                  const dateLabels: Record<string, string> = { today: "Today", week: "Last 7 Days", month: "Last 30 Days", quarter: "Last 90 Days", year: "Last Year", custom: "Custom Date" };
                  chips.push({ label: dateLabels[dateRangeFilter] || dateRangeFilter, value: dateRangeFilter, sourceId: "date-range", icon: <i className="bi bi-tag text-sm" /> });
                }
                folderFilter.forEach(v => chips.push({ label: v, value: v, sourceId: "folders", icon: <i className="bi bi-folder text-sm" /> }));
                sourceFilter.forEach(v => chips.push({ label: v.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: v, sourceId: "source", icon: <i className="bi bi-upload text-sm" /> }));
                approvalStatusFilter.forEach(v => chips.push({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v, sourceId: "status", icon: <i className="bi bi-check-square text-sm" /> }));
                orgStatusFilter.forEach(v => chips.push({ label: v === "organized" ? "Sorted" : v === "unorganized" ? "Unsorted" : v.charAt(0).toUpperCase() + v.slice(1), value: v, sourceId: "organization-status", icon: <i className="bi bi-gear text-sm" /> }));

                if (chips.length === 0) return null;

                const handleRemoveChip = (chip: typeof chips[0]) => {
                  if (chip.sourceId === "search") {
                    searchHandleRef.current?.removeFacet(chip.value);
                  } else {
                    filterBarHandleRef.current?.removeValue(chip.sourceId, chip.value);
                  }
                };

                const handleClearAllChips = () => {
                  searchHandleRef.current?.clearFacetsOnly();
                  filterBarHandleRef.current?.clearAll();
                };

                return (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {chips.map((chip, i) => (
                      <Badge
                        key={`${chip.sourceId}-${chip.value}-${i}`}
                        colorStyle="primary"
                        theme="soft"
                        shape="rounded"
                        className="gap-1.5 pr-1.5 cursor-pointer transition-colors hover:bg-primary/30 text-[13px] normal-case tracking-normal font-normal"
                        onClick={() => handleRemoveChip(chip)}
                      >
                        {chip.icon}
                        {chip.label}
                        <i className="bi bi-x text-sm ml-0.5" />
                      </Badge>
                    ))}
                    <button
                      onClick={handleClearAllChips}
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
                allSelected={sortedResults.length > 0 && selectedAssets.size === sortedResults.length}
                someSelected={selectedAssets.size > 0 && selectedAssets.size < sortedResults.length}
                onSelectAll={(checked) => {
                  if (checked) {
                    setSelectedAssets(new Set(sortedResults.map(a => a.id)));
                  } else {
                    setSelectedAssets(new Set());
                  }
                }}
              />
            )}

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
              />
            ) : isLoading ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="group">
                    <Skeleton className="aspect-[5/6] rounded-[24px] mb-2" />
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
                  // Determine card state based on selection mode and selection status
                  let cardState: AssetCardState = "default";
                  if (selectedAssets.size > 0 && !isSelected) {
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
                      isBranded={isBrandedActive && asset.isBranded}
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

          <TabsContent value="galleries" className="flex-1 overflow-y-auto py-6 mt-0">
            {/* Search Row with Utility Cluster */}
            <div className="flex items-center gap-4 mb-3 cq-search-row">
              <div className="flex-1 min-w-0 cq-search-input">
                <FacetedSearchWithTypeahead placeholder="Search" />
              </div>

              <div className="flex items-center gap-2 cq-compact-sm flex-shrink-0 cq-utility-cluster">
                {galleriesViewMode === "grid" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]">
                        Sort{sortField ? `: ${SORT_LABELS[sortField]}` : ""}
                        <i className="bi bi-chevron-down w-4 h-4" />
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
                    className={`h-10 w-10 rounded-r-none text-[#6e84a3] ${galleriesViewMode === "grid" ? "bg-gray-100" : ""}`}
                    onClick={() => setGalleriesViewMode("grid")}
                  >
                    <i className="bi bi-grid w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-10 w-10 rounded-none border-x border-gray-300 text-[#6e84a3] ${galleriesViewMode === "list" ? "bg-gray-100" : ""}`}
                    onClick={() => setGalleriesViewMode("list")}
                  >
                    <i className="bi bi-table w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-10 w-10 rounded-l-none text-[#6e84a3] ${isAnyGallerySelected ? "bg-gray-100" : ""}`}
                    onClick={() => setSelectedGalleries(prev => (prev.size > 0 ? new Set() : new Set(galleryList.map(g => g.id))))}
                  >
                    <i className="bi bi-check-square w-4 h-4" />
                  </Button>
                </div>

                {/* Settings button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-md border-gray-300 bg-white text-[#6e84a3]"
                  onClick={() => setSettingsDrawerOpen(true)}
                >
                  <i className="bi bi-gear w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="mb-3">
              <GalleryFilterBar
                isArchivedActive={archivedGalleriesOnly}
                onArchivedToggle={setArchivedGalleriesOnly}
              />
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <i className="bi bi-heart w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Favorite</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                        setGalleryList(prev => prev.map(g => selectedGalleries.has(g.id) ? { ...g, archived: true } : g));
                        selectedGalleries.forEach(id => {
                          setFolderTree(prev => updateFolderInTree(prev, id, { archived: true }));
                        });
                        setSelectedGalleries(new Set());
                      }}>
                        <i className="bi bi-archive w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Archive</TooltipContent>
                  </Tooltip>
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
                              onClick={() => handleMoveGalleries(Array.from(selectedGalleries))}
                            >
                              <i className="bi bi-folder-symlink w-4 h-4 mr-2" /> Move
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

            {/* Galleries Grid/Table */}
            <div className="min-h-[400px]">
              {galleriesViewMode === "list" ? (
                <GalleryTableView galleries={galleryList} onNavigate={handleNavigate} onMoveGalleries={handleMoveGalleries} />
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                  {galleryList.filter(g => {
                    const treeItem = findFolderById(folderTree, g.id);
                    const isArchived = treeItem?.archived === true;
                    return archivedGalleriesOnly ? isArchived : !isArchived;
                  }).map((gallery) => {
                    const isSelected = selectedGalleries.has(gallery.id);
                    // Determine card state based on selection mode and selection status
                    let cardState: GalleryCardState = "default";
                    if (isAnyGallerySelected && !isSelected) {
                      cardState = "bulk-select";
                    } else if (isSelected) {
                      cardState = "selected";
                    }

                    return (
                      <GalleryCard
                        key={gallery.id}
                        name={gallery.name}
                        assetCount={gallery.assetCount}
                        timeAgo={gallery.timeAgo}
                        thumbnailUrl={gallery.thumbnailUrl}
                        state={cardState}
                        onSelect={() => {
                          if (archivedGalleriesOnly) return;
                          if (isAnyGallerySelected) {
                            toggleGallerySelection(gallery.id);
                          } else {
                            setActiveFolder(gallery.id);
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
              )}
            </div>
          </TabsContent>

          <TabsContent value="folders" className="flex-1 overflow-y-auto py-6 mt-0">
            <div className="flex items-center justify-end mb-6">
              <div className="flex items-center border rounded-md bg-card">
                <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-r-none text-[#6e84a3] ${folderViewMode === "grid" ? "bg-accent" : ""}`} onClick={() => setFolderViewMode("grid")}>
                  <i className="bi bi-grid w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-l-none border-l text-[#6e84a3] ${folderViewMode === "table" ? "bg-accent" : ""}`} onClick={() => setFolderViewMode("table")}>
                  <i className="bi bi-table w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Folders Grid */}
            {(() => {
              const topLevelFolders = folderTree.filter(f => f.id !== "all" && f.type === "folder");
              const filteredFolderCards = topLevelFolders
                .filter(f => archivedFoldersOnly ? f.archived === true : f.archived !== true)
                .map(f => ({ id: f.id, name: f.name, galleryCount: f.count || 0, timeAgo: "—" }));
              return filteredFolderCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <i className="bi bi-folder text-5xl text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium mb-1">{archivedFoldersOnly ? "No archived folders" : "No folders"}</h3>
                  <p className="text-sm text-muted-foreground">{archivedFoldersOnly ? "Archive a folder to see it here." : "Create a folder to get started."}</p>
                </div>
              ) : folderViewMode === "table" ? (
                <FolderTableView
                  folders={topLevelFolders.filter(f => archivedFoldersOnly ? f.archived === true : f.archived !== true)}
                  onNavigate={(folderId) => setActiveFolder(folderId)}
                  archivedFoldersOnly={archivedFoldersOnly}
                  onUnarchiveFolder={(folderId) => {
                    handleUnarchiveFolder(folderId);
                    const name = topLevelFolders.find(f => f.id === folderId)?.name || "Folder";
                    toast({ title: "Folder unarchived", description: `"${name}" has been unarchived.` });
                  }}
                />
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                  {filteredFolderCards.map((folder) => {
                    return (
                      <FolderCard
                        key={folder.id}
                        name={folder.name}
                        galleryCount={folder.galleryCount}
                        onSelect={() => {
                          if (!archivedFoldersOnly) {
                            setActiveFolder(folder.id);
                          }
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

          <TabsContent value="favorites" className="flex-1 overflow-y-auto py-6 mt-0">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
              <p>Favorites content placeholder</p>
            </div>
          </TabsContent>

          <TabsContent value="branding" className="flex-1 overflow-y-auto py-6 mt-0">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
              <p>Branding content placeholder</p>
            </div>
          </TabsContent>

          <TabsContent value="workflows" className="flex-1 overflow-y-auto py-6 mt-0">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
              <p>Workflows content placeholder</p>
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
        onMove={(locationId) => applyGalleryMoves(Array.from(selectedGalleries), locationId)}
      />
      <NewFolderDialog
        open={newFolderDialogOpen}
        onOpenChange={setNewFolderDialogOpen}
        onCreateFolder={handleCreateFolder}
        flattenedFolders={flatFolders}
        galleries={galleryList}
        folderTree={folderTree}
        onCreateGallery={handleCreateGallery}
      />
      <AddGalleryDialog
        open={addGalleryDialogOpen}
        onOpenChange={setAddGalleryDialogOpen}
        galleries={galleryList}
        disabledGalleryIds={collectAssignedGalleryIds(folderTree)}
        onSelectGalleries={(ids) => handleAddGalleriesToFolder(ids, activeFolder !== "all" ? activeFolder : null)}
        onCreateNew={() => setNewGalleryDialogOpen(true)}
      />
      <NewGalleryDialog
        open={newGalleryDialogOpen}
        onOpenChange={setNewGalleryDialogOpen}
        onCreateGallery={handleCreateGallery}
        flattenedFolders={flatFolders}
      />
      <SettingsDrawer
        open={settingsDrawerOpen}
        onOpenChange={setSettingsDrawerOpen}
        displayLabel={displayLabel}
        onDisplayLabelChange={setDisplayLabel}
      />
    </div>
  );
}
