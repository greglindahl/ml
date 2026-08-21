import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SectionTabs } from "@/components/SectionTabs";
import { StickyHeaderBlock } from "@/components/StickyHeaderBlock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FacetedSearchWithTypeahead } from "@/components/FacetedSearchWithTypeahead";
import type { SelectedFacet, FacetedSearchWithTypeaheadHandle } from "@/components/FacetedSearchWithTypeahead";
import { FilterBar } from "@/components/FilterBar";
import type { FilterBarHandle } from "@/components/FilterBar";
import { GalleryDetailsView } from "@/components/GalleryDetailsView";
import { FolderDetailsView } from "@/components/FolderDetailsView";
import { AssetTableView, DEFAULT_ASSET_COLUMN_VISIBILITY, ASSET_COLUMNS, type AssetColumnVisibility } from "@/components/AssetTableView";
import { AssetBulkActionBar } from "@/components/AssetBulkActionBar";
import { GalleryTableView, DEFAULT_GALLERY_COLUMN_VISIBILITY, GALLERY_COLUMNS, type GalleryColumnVisibility } from "@/components/GalleryTableView";
import { FolderTableView, DEFAULT_FOLDER_COLUMN_VISIBILITY, FOLDER_COLUMNS, type FolderColumnVisibility } from "@/components/FolderTableView";
import { useLibrarySearch } from "@/hooks/useLibrarySearch";
import { getRelativeTime, LibraryAsset, mockLibraryAssets } from "@/lib/mockLibraryData";

// Chip display names for the Creator facet (id → display name) and the
// Orientation facet's hint labels (PORTAL-12778)
const PEOPLE_NAME_LOOKUP: Record<string, string> = (() => {
  const lookup: Record<string, string> = {};
  mockLibraryAssets.forEach(a => {
    lookup[a.creatorId] = a.creator;
  });
  return lookup;
})();
const ORIENTATION_LABELS: Record<string, string> = {
  panoramic: "Panoramic",
  landscape: "Landscape",
  square: "Square",
  portrait: "Portrait",
  tall: "Tall",
  unknown: "Unknown",
};
import { folders as initialFolders, mockGalleries, mockFolderCards, FolderItem, findFolderById, findFolderAncestorIds, getAllDescendantIds, flattenFolders, getGalleryLocationDisplay, collectAssignedGalleryIds, countAllGalleries, findGalleryParentPath, hasArchivedAncestor, enrichGallery, sortGalleries, GALLERY_SORT_OPTIONS, GallerySortField } from "@/lib/mockFolderData";
import { matchesDateRange, DateRangeValue, CustomRange } from "@/lib/dateRangeFilter";
import { relevanceScore } from "@/lib/relevance";
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
import { GalleryFilterBar, type GalleryFilterBarHandle, type GalleryFilterChip } from "@/components/GalleryFilterBar";
import { FiltersSheet, FilterSection } from "@/components/FiltersSheet";
import { GalleryCard, GalleryCardState } from "@/components/GalleryCard";
import { AssetCard, AssetCardState } from "@/components/AssetCard";
import { FolderCard, FolderCardState } from "@/components/FolderCard";
import { SettingsDrawer, usePerPagePreference, useColumnVisibility } from "@/components/SettingsDrawer";
import {
  AssetSettingsDrawer,
  useAssetDisplayLabel,
  useAssetPerPage,
  useAssetColumnVisibility,
  useAssetFilterVisibility,
  type AssetTableColumnVisibility,
  type AssetFilterVisibility,
} from "@/components/AssetSettingsDrawer";
import {
  GallerySettingsDrawer,
  useGalleryPerPage,
  useGalleryColumnVisibility,
  useGalleryFilterVisibility,
  type GalleryTableColumnVisibility,
  type GalleryFilterVisibility,
} from "@/components/GallerySettingsDrawer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UploadModal } from "@/components/UploadModal";
import { AssetDetailModal } from "@/components/AssetDetailModal";

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

// Library section tabs — rendered as a TabsList on desktop and a dropdown on
// mobile, where the full set doesn't fit horizontally (mirrors the prod app).
const LIBRARY_TABS = [
  { value: "assets", label: "All Assets" },
  { value: "galleries", label: "Galleries" },
  { value: "folders", label: "Folders" },
  { value: "favorites", label: "Favorites" },
  { value: "branding", label: "Branding" },
  { value: "workflows", label: "Workflows" },
];

interface LibraryScreenProps {
  isMobile?: boolean;
  /** Folder/gallery id to open immediately on mount (e.g. deep-linked from another screen). Defaults to "all". */
  initialActiveFolder?: string;
  /** Tab to open on mount (e.g. "galleries" when deep-linked from Home). Defaults to "assets". */
  initialActiveTab?: string;
  /** Deep link (&bulk=1): preselect all assets on the initially linked gallery's details view. */
  initialBulkSelect?: boolean;
}

export function LibraryScreen({ isMobile = false, initialActiveFolder, initialActiveTab, initialBulkSelect }: LibraryScreenProps) {
  const [activeTab, setActiveTab] = useState(initialActiveTab ?? "assets");
  const [isFolderSidebarExpanded, setIsFolderSidebarExpanded] = useState(false);
  const [activeFolder, setActiveFolder] = useState(initialActiveFolder ?? "all");
  // Consume-once: bulk preselect only applies to the gallery the deep link opened.
  const [pendingBulkSelectFor] = useState<string | null>(
    initialBulkSelect && initialActiveFolder ? initialActiveFolder : null
  );
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [assetsViewMode, setAssetsViewMode] = useState<"grid" | "list">("grid");
  const [galleriesViewMode, setGalleriesViewMode] = useState<"grid" | "list">("grid");
  // Galleries tab grid sort — prod field set, Created desc default (matches prod).
  // Independent from the assets sort; the table view sorts via its own headers.
  const [gallerySortField, setGallerySortField] = useState<GallerySortField>("created");
  const [gallerySortDirection, setGallerySortDirection] = useState<"asc" | "desc">("desc");
  const handleGallerySortChange = useCallback((field: GallerySortField) => {
    if (gallerySortField === field) {
      setGallerySortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setGallerySortField(field);
      setGallerySortDirection("desc");
    }
  }, [gallerySortField]);
  const [folderTree, setFolderTree] = useState<FolderItem[]>(initialFolders);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [addGalleryDialogOpen, setAddGalleryDialogOpen] = useState(false);
  const [newGalleryDialogOpen, setNewGalleryDialogOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [galleryList, setGalleryList] = useState(mockGalleries);
  // Enriched + sorted list for the galleries GRID. Enrichment is index-seeded on
  // galleryList order — the same order the table receives — so grid and table
  // show identical values for creator/downloads/etc.
  const sortedGalleryList = useMemo(
    () => sortGalleries(galleryList.map(enrichGallery), gallerySortField, gallerySortDirection),
    [galleryList, gallerySortField, gallerySortDirection]
  );
  const [selectedGalleries, setSelectedGalleries] = useState<Set<string>>(new Set());
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const { toast } = useToast();

  // ── Favorites tab ──────────────────────────────────────────────────────
  // Secondary tab nav (Galleries default, matching prod), independent view
  // modes, filter state, and selection so it never cross-contaminates the
  // main Assets/Galleries tabs.
  const [favSubTab, setFavSubTab] = useState("galleries");
  const [favGalleriesViewMode, setFavGalleriesViewMode] = useState<"grid" | "list">("grid");
  const [favAssetsViewMode, setFavAssetsViewMode] = useState<"grid" | "list">("grid");
  const [favArchivedOnly, setFavArchivedOnly] = useState(false);
  const [favUnviewedActive, setFavUnviewedActive] = useState(false);
  const [favBrandedActive, setFavBrandedActive] = useState(false);
  const [favAssetFilters, setFavAssetFilters] = useState<Record<string, string[]>>({});
  const [favAssetCustomDates, setFavAssetCustomDates] = useState<Record<string, CustomRange>>({});
  const [favSelectedAssets, setFavSelectedAssets] = useState<Set<string>>(new Set());
  const [favAssetSort, setFavAssetSort] = useState<"relevance" | "dateCreated" | "captureDate" | "name" | "creator">("dateCreated");
  // PORTAL-12776: same relevance-defaulting contract as the All Assets tab
  const favSortPinnedRef = useRef(false);
  const favLastChosenSortRef = useRef<"dateCreated" | "captureDate" | "name" | "creator">("dateCreated");
  const [favGallerySearch, setFavGallerySearch] = useState("");
  const [favAssetSearch, setFavAssetSearch] = useState("");
  const [favGalleryChips, setFavGalleryChips] = useState<GalleryFilterChip[]>([]);
  const favGalleryFilterBarHandleRef = useRef<GalleryFilterBarHandle | null>(null);
  const [favSelectedGalleries, setFavSelectedGalleries] = useState<Set<string>>(new Set());
  // Main Galleries tab chips (same new pattern)
  const [galleryTabChips, setGalleryTabChips] = useState<GalleryFilterChip[]>([]);
  const galleryTabFilterBarHandleRef = useRef<GalleryFilterBarHandle | null>(null);
  const favAssetsFilterBarHandleRef = useRef<FilterBarHandle | null>(null);
  // Session-local asset favorite state, seeded from the mock data flags.
  // Gallery favorite state lives on galleryList (already stateful).
  const [favoriteAssetIds, setFavoriteAssetIds] = useState<Set<string>>(
    () => new Set(mockLibraryAssets.filter(a => a.isFavorite).map(a => a.id))
  );
  const [archivedFoldersOnly, setArchivedFoldersOnly] = useState(false);
  const [folderViewMode, setFolderViewMode] = useState<"grid" | "table">("grid");
  // Front-end-only filter of the folders visible at this level (no recursive search)
  const [folderSearchQuery, setFolderSearchQuery] = useState("");
  const [archivedGalleriesOnly, setArchivedGalleriesOnly] = useState(false);
  const [unsortedGalleriesOnly, setUnsortedGalleriesOnly] = useState(false);
  const [favoriteGalleriesOnly, setFavoriteGalleriesOnly] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  // Multi-select MODE flags (PORTAL-12949): banner shows while mode is on, even at 0
  // selected; selecting from a card's hover circle also implies multi-select.
  const [assetMultiSelectMode, setAssetMultiSelectMode] = useState(false);
  const [galleryMultiSelectMode, setGalleryMultiSelectMode] = useState(false);
  const [favAssetMultiSelectMode, setFavAssetMultiSelectMode] = useState(false);
  const [favGalleryMultiSelectMode, setFavGalleryMultiSelectMode] = useState(false);
  const inAssetMultiSelect = assetMultiSelectMode || selectedAssets.size > 0;
  const inGalleryMultiSelect = galleryMultiSelectMode || selectedGalleries.size > 0;
  const inFavAssetMultiSelect = favAssetMultiSelectMode || favSelectedAssets.size > 0;
  const inFavGalleryMultiSelect = favGalleryMultiSelectMode || favSelectedGalleries.size > 0;
  const [viewingAssetId, setViewingAssetId] = useState<string | null>(null);

  // Settings drawer state
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [assetSettingsDrawerOpen, setAssetSettingsDrawerOpen] = useState(false);
  const [gallerySettingsDrawerOpen, setGallerySettingsDrawerOpen] = useState(false);

  // Asset settings - using new tabbed drawer hooks
  const [displayLabel, setDisplayLabel] = useAssetDisplayLabel();
  const [assetPerPage, setAssetPerPage] = useAssetPerPage(40);
  const [assetColumnVisibility, setAssetColumnVisibility] = useAssetColumnVisibility();
  const [assetFilterVisibility, setAssetFilterVisibility] = useAssetFilterVisibility();

  // Gallery settings - using new tabbed drawer hooks
  const [galleryPerPage, setGalleryPerPage] = useGalleryPerPage(40);
  const [galleryColumnVisibility, setGalleryColumnVisibility] = useGalleryColumnVisibility();
  const [galleryFilterVisibility, setGalleryFilterVisibility] = useGalleryFilterVisibility();
  const [folderPerPage, setFolderPerPage] = usePerPagePreference("folders", 40);
  const [folderColumnVisibility, setFolderColumnVisibility] = useColumnVisibility<FolderColumnVisibility>("folders", DEFAULT_FOLDER_COLUMN_VISIBILITY);

  // Toggle pill states for FilterBar
  const [isUnsortedActive, setIsUnsortedActive] = useState(false);
  const [isUnviewedActive, setIsUnviewedActive] = useState(false);

  // Filters sheet state for narrow widths
  const [assetsFiltersSheetOpen, setAssetsFiltersSheetOpen] = useState(false);
  const [galleriesFiltersSheetOpen, setGalleriesFiltersSheetOpen] = useState(false);

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

  // Set archived on the matching node AND every descendant (subfolders + galleries).
  // Archiving/unarchiving a folder cascades through its whole subtree per spec.
  const setArchivedDeep = useCallback((tree: FolderItem[], id: string, archived: boolean): FolderItem[] => {
    const applyDeep = (item: FolderItem): FolderItem => ({
      ...item,
      archived,
      children: item.children?.map(applyDeep),
    });
    return tree.map(item => {
      if (item.id === id) return applyDeep(item);
      if (item.children) return { ...item, children: setArchivedDeep(item.children, id, archived) };
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

    // Open the folder detail view; expand the full ancestor chain so the
    // sidebar highlight is visible even in a collapsed subtree
    const goToFolder = () => {
      setExpandedFolders(prev => {
        const next = new Set(prev);
        if (data.locationId) {
          (findFolderAncestorIds(folderTree, data.locationId) ?? []).forEach(id => next.add(id));
          next.add(data.locationId);
        }
        return next;
      });
      setActiveFolder(newFolder.id);
    };

    if (data.navigateOnCreate) {
      goToFolder();
      sonnerToast.success("Folder created", {
        description: `"${data.name}" has been created.`,
      });
    } else {
      sonnerToast.success("Folder created", {
        description: `"${data.name}" has been created.`,
        action: { label: "Go to folder", onClick: goToFolder },
      });
    }
  }, [insertFolderAt, galleryList, folderTree]);

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
    setFolderTree(prev => setArchivedDeep(prev, folderId, true));
    setActiveFolder("all");
  }, [setArchivedDeep]);

  const handleUnarchiveFolder = useCallback((folderId: string) => {
    // Unarchive is top-down only: blocked while any ancestor is archived.
    if (hasArchivedAncestor(folderId, folderTree)) {
      const name = findFolderById(folderTree, folderId)?.name;
      toast({
        title: "Can't unarchive",
        description: `${name ? `"${name}"` : "This folder"} is inside an archived folder. Unarchive the parent folder first, or move it to an active location.`,
        variant: "destructive",
      });
      return;
    }
    setFolderTree(prev => setArchivedDeep(prev, folderId, false));
  }, [setArchivedDeep, folderTree, toast]);

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

  // Mode-aware: true while gallery multi-select is active, even with 0 selected
  const isAnyGallerySelected = galleryMultiSelectMode || selectedGalleries.size > 0;
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
        assetCount: gallery.assetCount,
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

  // ----- Gallery archive/unarchive -----
  // Gallery blocked from unarchiving in place (ancestor folder archived): the
  // "Move to unarchive" dialog targets this gallery until dismissed/confirmed.
  const [moveToUnarchiveGalleryId, setMoveToUnarchiveGalleryId] = useState<string | null>(null);

  // Single-row table entry for the "Move to unarchive" dialog (reuses MoveGalleriesDialog)
  const moveToUnarchiveItems: MoveGalleryItem[] = useMemo(() => {
    if (!moveToUnarchiveGalleryId) return [];
    const node = findFolderById(folderTree, moveToUnarchiveGalleryId);
    const flat = galleryList.find(g => g.id === moveToUnarchiveGalleryId);
    return [{
      id: moveToUnarchiveGalleryId,
      name: node?.name ?? flat?.name ?? "",
      currentLocation: getGalleryLocationDisplay(moveToUnarchiveGalleryId, folderTree),
      assetCount: (node?.countType === "assets" ? node.count : undefined) ?? flat?.assetCount,
    }];
  }, [moveToUnarchiveGalleryId, folderTree, galleryList]);

  // Dual-write helper: archived state lives on the tree node (source of truth)
  // and is mirrored onto the flat galleryList so root/unsorted galleries
  // (no tree node) keep their state.
  const setGalleriesArchived = useCallback((galleryIds: string[], archived: boolean) => {
    const ids = new Set(galleryIds);
    setGalleryList(prev => prev.map(g => ids.has(g.id) ? { ...g, archived } : g));
    setFolderTree(prev => {
      let tree = prev;
      for (const id of ids) {
        tree = updateFolderInTree(tree, id, { archived });
      }
      return tree;
    });
  }, [updateFolderInTree]);

  // Tree node is the source of truth; the flat galleryList flag covers
  // root/unsorted galleries that have no tree node (e.g. after a move to All Media).
  const isGalleryArchivedById = useCallback((id: string): boolean => {
    const node = findFolderById(folderTree, id);
    if (node) return node.archived === true;
    return galleryList.find(g => g.id === id)?.archived === true;
  }, [folderTree, galleryList]);

  // Blocked = inside an archived folder hierarchy; bulk unarchive is disabled
  // (with an explanatory tooltip) while any blocked gallery is selected.
  const anySelectedBlocked = useMemo(
    () => Array.from(selectedGalleries).some(id => hasArchivedAncestor(id, folderTree)),
    [selectedGalleries, folderTree]
  );

  const handleArchiveGallery = useCallback((galleryId: string) => {
    setGalleriesArchived([galleryId], true);
    const name = galleryList.find(g => g.id === galleryId)?.name ?? findFolderById(folderTree, galleryId)?.name;
    toast({
      title: "Gallery archived",
      description: name ? `"${name}" has been archived.` : "The gallery has been archived.",
    });
  }, [setGalleriesArchived, galleryList, folderTree, toast]);

  const handleUnarchiveGallery = useCallback((galleryId: string) => {
    if (hasArchivedAncestor(galleryId, folderTree)) {
      setMoveToUnarchiveGalleryId(galleryId);
      return;
    }
    setGalleriesArchived([galleryId], false);
    const name = galleryList.find(g => g.id === galleryId)?.name ?? findFolderById(folderTree, galleryId)?.name;
    toast({
      title: "Gallery unarchived",
      description: name ? `"${name}" has been unarchived.` : "The gallery has been unarchived.",
    });
  }, [folderTree, setGalleriesArchived, galleryList, toast]);

  const handleMoveToUnarchiveConfirm = useCallback((locationId: string | null, unarchive: boolean) => {
    const galleryId = moveToUnarchiveGalleryId;
    if (!galleryId) return;
    setMoveToUnarchiveGalleryId(null);

    const movedName = findFolderById(folderTree, galleryId)?.name
      ?? galleryList.find(g => g.id === galleryId)?.name;
    setFolderTree(prev => {
      const galleryNode = findFolderById(prev, galleryId);
      if (!galleryNode) return prev;
      const updatedNode = { ...galleryNode, archived: unarchive ? false : galleryNode.archived };
      let tree = removeFolderById(prev, galleryId);
      if (locationId) {
        tree = insertFolderAt(tree, locationId, updatedNode);
      }
      // locationId null ("All Media") = root: node leaves the tree, so the
      // flat-list mirror below is what preserves its archived state.
      return tree;
    });
    setGalleryList(prev => prev.map(g =>
      g.id === galleryId ? { ...g, archived: unarchive ? false : true } : g
    ));

    if (locationId) {
      setExpandedFolders(prev => new Set([...prev, locationId]));
    }

    toast({
      title: unarchive ? "Gallery moved and unarchived" : "Gallery moved",
      description: movedName
        ? `"${movedName}" ${unarchive ? "is now active in its new location" : "was moved and is still archived — unarchive it from its new location"}.`
        : unarchive ? "The gallery is now active in its new location." : "The gallery was moved and is still archived — unarchive it from its new location.",
    });
  }, [moveToUnarchiveGalleryId, folderTree, galleryList, removeFolderById, insertFolderAt, toast]);

  // Auto-expand/collapse sidebar based on active tab
  useEffect(() => {
    setIsFolderSidebarExpanded(activeTab === "folders");
    setSelectedAssets(new Set());
  }, [activeTab]);

  // Filter state (driven by FilterBar)
  const [contentTypeFilter, setContentTypeFilter] = useState<Array<LibraryAsset["type"]>>([]);
  const [creatorFilter, setCreatorFilter] = useState<string[]>([]);
  const [orientationFilter, setOrientationFilter] = useState<LibraryAsset["orientation"][]>([]);
  const [peopleFilter, setPeopleFilter] = useState<string[]>([]);
  const [sceneFilter, setSceneFilter] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [folderFilter, setFolderFilter] = useState<string[]>([]);
  const [addedDateFilter, setAddedDateFilter] = useState<DateRangeValue | null>(null);
  const [capturedDateFilter, setCapturedDateFilter] = useState<DateRangeValue | null>(null);
  // Custom ranges keyed by date filter id ("added-date" / "captured-date")
  const [customDateRanges, setCustomDateRanges] = useState<Record<string, CustomRange>>({});
  const [isBrandedActive, setIsBrandedActive] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [orgStatusFilter, setOrgStatusFilter] = useState<string[]>([]);
  const [searchSelectedFacets, setSearchSelectedFacets] = useState<SelectedFacet[]>([]);
  const searchHandleRef = useRef<FacetedSearchWithTypeaheadHandle | null>(null);
  const filterBarHandleRef = useRef<FilterBarHandle | null>(null);


  // Sort state
  type SortField = "relevance" | "creator" | "dateCreated" | "captureDate" | "downloads" | "shares" | "galleries" | "tags" | "viewers" | "publicViews" | "favorites" | "lastDownloadDate" | null;
  type SortDir = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>("dateCreated");
  const [sortDirection, setSortDirection] = useState<SortDir>("desc");
  // PORTAL-12776: the text query currently applied (facet-only searches don't count —
  // relevance only exists when there's text to rank against).
  const [activeQuery, setActiveQuery] = useState("");
  // Set when the user explicitly picks a sort while a query is active; while true,
  // query refinements must not snap the sort back to Relevance (AC3).
  const sortPinnedByUserRef = useRef(false);
  // The user's last explicitly chosen (non-relevance) sort — restored when a
  // query clears, mirroring how sort choice persists in-app elsewhere.
  const lastChosenSortRef = useRef<{ field: NonNullable<SortField>; dir: SortDir }>({ field: "dateCreated", dir: "desc" });

  const SORT_OPTIONS: { value: NonNullable<SortField>; label: string }[] = [
    { value: "creator", label: "Creator" },
    { value: "dateCreated", label: "Added" },
    { value: "captureDate", label: "Captured" },
    { value: "downloads", label: "Downloads" },
    { value: "shares", label: "Shares" },
    { value: "galleries", label: "Galleries" },
    { value: "tags", label: "Tags" },
    { value: "viewers", label: "Viewers" },
    { value: "favorites", label: "Favorites" },
    { value: "lastDownloadDate", label: "Last Download Date" },
  ];

  // Relevance is only offered (and only meaningful) while a text query is present.
  const visibleSortOptions = useMemo(
    () => activeQuery ? [{ value: "relevance" as const, label: "Relevance" }, ...SORT_OPTIONS] : SORT_OPTIONS,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SORT_OPTIONS is a stable literal
    [activeQuery]
  );

  const SORT_LABELS: Record<string, string> = { relevance: "Relevance", ...Object.fromEntries(SORT_OPTIONS.map(o => [o.value, o.label])) };

  const handleSortChange = useCallback((field: NonNullable<SortField>) => {
    // An explicit pick while searching is honored until the query is cleared (AC3)
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

  // Use the library search hook
  const { results, allAssets, isLoading, totalCount, search } = useLibrarySearch();

  // PORTAL-12949: selection clears (multi-select mode stays on) when a filter
  // facet changes, a new search runs, or the page size changes.
  useEffect(() => {
    setSelectedAssets(new Set());
  }, [results, searchSelectedFacets, contentTypeFilter, creatorFilter, orientationFilter, peopleFilter, sceneFilter, brandFilter, tagsFilter, folderFilter, addedDateFilter, capturedDateFilter, customDateRanges, isBrandedActive, isUnviewedActive, isUnsortedActive, sourceFilter, orgStatusFilter, assetPerPage]);
  useEffect(() => {
    setSelectedGalleries(new Set());
  }, [galleryTabChips, archivedGalleriesOnly, unsortedGalleriesOnly, favoriteGalleriesOnly, galleryPerPage]);
  useEffect(() => {
    setFavSelectedAssets(new Set());
  }, [favAssetFilters, favAssetCustomDates, favAssetSearch, favBrandedActive, favUnviewedActive]);
  useEffect(() => {
    setFavSelectedGalleries(new Set());
  }, [favGalleryChips, favGallerySearch, favArchivedOnly]);

  // Navigating away (switching tabs/subtabs/folders) exits multi-select entirely.
  useEffect(() => {
    setSelectedAssets(new Set());
    setAssetMultiSelectMode(false);
    setSelectedGalleries(new Set());
    setGalleryMultiSelectMode(false);
    setFavSelectedAssets(new Set());
    setFavAssetMultiSelectMode(false);
    setFavSelectedGalleries(new Set());
    setFavGalleryMultiSelectMode(false);
  }, [activeTab, favSubTab, activeFolder]);

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
      if (orientationFilter.length && !orientationFilter.includes(asset.orientation)) return false;

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

      // Added Date filter (when the asset entered Greenfly)
      if (addedDateFilter && !matchesDateRange(asset.dateCreated, addedDateFilter, customDateRanges["added-date"])) return false;

      // Captured Date filter (when the media was originally shot)
      if (capturedDateFilter && !matchesDateRange(asset.captureDate, capturedDateFilter, customDateRanges["captured-date"])) return false;

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
    orientationFilter,
    peopleFilter,
    sceneFilter,
    brandFilter,
    tagsFilter,
    folderFilter,
    addedDateFilter,
    capturedDateFilter,
    customDateRanges,
    isBrandedActive,
  ]);

  // Sort filtered results
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
  }, [filteredResults, sortField, sortDirection, activeQuery]);

  // Compute dynamic filter counts based on current results
  const filterCounts = useMemo(() => computeFilterCounts(filteredResults), [filteredResults]);

  // Asset detail modal helpers
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
      // Convert string facets to facet objects for the search hook
      const facets = selectedFacets.map((facet) => ({
        field: "tag",
        value: facet.toLowerCase(),
        label: facet,
      }));
      search(query, facets);

      // PORTAL-12776 sort defaulting: a text query pre-selects Relevance unless
      // the user pinned a sort (AC2/AC3). Clearing the query unpins.
      const trimmed = query.trim();
      if (trimmed && !sortPinnedByUserRef.current) {
        setSortField("relevance");
        setSortDirection("desc");
      }
      if (!trimmed) {
        sortPinnedByUserRef.current = false;
      }
      setActiveQuery(trimmed);
    },
    [search]
  );

  // With no query left, Relevance has nothing to rank against — retire it and
  // restore the user's last selected sort (their choice persists in-app until
  // changed; Added is only the never-chose-anything fallback). Per the sync
  // call — pending Amber's confirmation. A pinned non-relevance sort is left alone.
  useEffect(() => {
    if (!activeQuery && sortField === "relevance") {
      setSortField(lastChosenSortRef.current.field);
      setSortDirection(lastChosenSortRef.current.dir);
    }
  }, [activeQuery, sortField]);

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
      case "added-date":
        setAddedDateFilter((values[0] as DateRangeValue) ?? null);
        break;
      case "captured-date":
        setCapturedDateFilter((values[0] as DateRangeValue) ?? null);
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

  const handleCustomDateChange = useCallback((filterId: string, range: CustomRange) => {
    setCustomDateRanges(prev => ({ ...prev, [filterId]: range }));
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

  // ── Favorites: toggle handlers + filtered/sorted data ──────────────────
  const handleToggleFavoriteGallery = useCallback((galleryId: string) => {
    const gallery = galleryList.find(g => g.id === galleryId);
    const nowFavorite = !gallery?.isFavorite;
    setGalleryList(prev => prev.map(g => g.id === galleryId ? { ...g, isFavorite: !g.isFavorite } : g));
    toast({
      title: nowFavorite ? "Added to Favorites" : "Removed from Favorites",
      description: `"${gallery?.name ?? "Gallery"}" was ${nowFavorite ? "added to" : "removed from"} your favorites.`,
    });
  }, [galleryList, toast]);

  const handleToggleFavoriteAsset = useCallback((assetId: string) => {
    const asset = mockLibraryAssets.find(a => a.id === assetId);
    setFavoriteAssetIds(prev => {
      const next = new Set(prev);
      const nowFavorite = !next.has(assetId);
      if (nowFavorite) next.add(assetId); else next.delete(assetId);
      toast({
        title: nowFavorite ? "Added to Favorites" : "Removed from Favorites",
        description: `"${asset?.name ?? "Asset"}" was ${nowFavorite ? "added to" : "removed from"} your favorites.`,
      });
      return next;
    });
  }, [toast]);

  const [favGallerySortField, setFavGallerySortField] = useState<GallerySortField>("created");
  const [favGallerySortDirection, setFavGallerySortDirection] = useState<"asc" | "desc">("desc");
  const handleFavGallerySortChange = useCallback((field: GallerySortField) => {
    if (favGallerySortField === field) {
      setFavGallerySortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setFavGallerySortField(field);
      setFavGallerySortDirection("desc");
    }
  }, [favGallerySortField]);

  const favGalleries = useMemo(
    () => sortGalleries(galleryList.map(enrichGallery), favGallerySortField, favGallerySortDirection).filter(g =>
      g.isFavorite &&
      (favArchivedOnly ? isGalleryArchivedById(g.id) : !isGalleryArchivedById(g.id)) &&
      (favGallerySearch === "" || g.name.toLowerCase().includes(favGallerySearch.toLowerCase()))
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isGalleryArchivedById derives from folderTree
    [galleryList, favArchivedOnly, favGallerySearch, favGallerySortField, favGallerySortDirection, folderTree]
  );

  // Base list for the assets subview: drives both the grid and the search typeahead.
  const favAssetsBase = useMemo(
    () => mockLibraryAssets.filter(a => favoriteAssetIds.has(a.id)),
    [favoriteAssetIds]
  );

  const favFilteredAssets = useMemo(() => {
    let results = favAssetsBase;
    if (favAssetSearch !== "") {
      const q = favAssetSearch.toLowerCase();
      results = results.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.creator.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (favBrandedActive) results = results.filter(a => a.isBranded);
    const f = favAssetFilters;
    // AI tag sub-filters (people/scene/brand) and Tags all match against asset tags
    const tagValues = [...(f["tags"] ?? []), ...(f["people"] ?? []), ...(f["scene"] ?? []), ...(f["brand"] ?? [])];
    if (tagValues.length) results = results.filter(a => tagValues.some(t => a.tags.some(tag => tag.toLowerCase() === t.toLowerCase())));
    if (f["creator"]?.length) results = results.filter(a => f["creator"].includes(a.creatorId));
    if (f["content-type"]?.length) results = results.filter(a => f["content-type"].includes(a.type));
    if (f["orientation"]?.length) results = results.filter(a => f["orientation"].includes(a.orientation));
    const added = f["added-date"]?.[0];
    if (added) results = results.filter(a => matchesDateRange(a.dateCreated, added as DateRangeValue, favAssetCustomDates["added-date"]));
    const captured = f["captured-date"]?.[0];
    if (captured) results = results.filter(a => matchesDateRange(a.captureDate, captured as DateRangeValue, favAssetCustomDates["captured-date"]));
    return [...results].sort((a, b) => {
      switch (favAssetSort) {
        case "relevance": {
          const q = favAssetSearch.toLowerCase();
          const cmp = relevanceScore(b, q) - relevanceScore(a, q);
          return cmp !== 0 ? cmp : b.dateCreated.getTime() - a.dateCreated.getTime();
        }
        case "name": return a.name.localeCompare(b.name);
        case "creator": return a.creator.localeCompare(b.creator);
        case "captureDate": return b.captureDate.getTime() - a.captureDate.getTime();
        default: return b.dateCreated.getTime() - a.dateCreated.getTime();
      }
    });
  }, [favAssetsBase, favAssetSearch, favBrandedActive, favAssetFilters, favAssetCustomDates, favAssetSort]);

  // PORTAL-12776 for the Favorites assets subview: query present → Relevance
  // unless pinned; query cleared → unpin and retire Relevance.
  useEffect(() => {
    if (favAssetSearch.trim()) {
      if (!favSortPinnedRef.current) setFavAssetSort("relevance");
    } else {
      favSortPinnedRef.current = false;
      setFavAssetSort(s => (s === "relevance" ? favLastChosenSortRef.current : s));
    }
  }, [favAssetSearch]);

  // Keep the address bar shareable: reflect the current Library location as
  // query params (?gallery=<id> / ?folder=<id> / ?tab=<tab>) so any view can be
  // deep-linked by copying the URL. replaceState avoids polluting history.
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeFolder !== "all") {
      const node = findFolderById(folderTree, activeFolder);
      params.set(node?.type === "gallery" ? "gallery" : "folder", activeFolder);
    } else {
      // Always write the tab (assets included) so bare "/" stays Home's slug
      params.set("tab", activeTab);
    }
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [activeFolder, activeTab, folderTree]);

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
          onArchiveGallery={handleArchiveGallery}
          onUnarchiveGallery={handleUnarchiveGallery}
          initialSelectAll={pendingBulkSelectFor === activeGallery.id}
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
          onArchiveGallery={handleArchiveGallery}
          onUnarchiveGallery={handleUnarchiveGallery}
          galleryList={galleryList}
          flattenedFolders={flatFolders}
        />
      ) : (
      <div className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden px-6 md:px-9 content-container ${isMobile ? "pt-[72px]" : ""}`}>
        {/* Breadcrumb spacer - matches FolderDetailsView/GalleryDetailsView for consistent header position */}
        {!isMobile && <div className="mb-2 h-[44px] flex-shrink-0" />}

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
                  <i className="bi bi-plus-circle w-4 h-4 inline-flex items-center justify-center leading-none" />
                  New
                  <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setNewFolderDialogOpen(true)}>
                  <i className="bi bi-folder w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" />
                  Folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNewGalleryDialogOpen(true)}>
                  <i className="bi bi-image w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" />
                  Gallery
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="h-10 px-3 py-2 gap-2" onClick={() => setUploadModalOpen(true)}>
              <i className="bi bi-upload w-4 h-4 inline-flex items-center justify-center leading-none" />
              Upload
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <SectionTabs tabs={LIBRARY_TABS} value={activeTab} onValueChange={setActiveTab} isMobile={isMobile} />

          <TabsContent value="assets" className="flex-1 overflow-y-auto pb-6 mt-0">
            {/* Sticky header: search + filters + chips + bulk bar pin while the grid scrolls */}
            <StickyHeaderBlock>
            {/* Search Row with Utility Cluster */}
            <div className="flex items-center gap-4 mb-3 cq-search-row">
              <div className="flex-1 min-w-0 cq-search-input">
                <FacetedSearchWithTypeahead onSearch={handleSearch} assets={allAssets} onSelectedFacetsChange={setSearchSelectedFacets} handleRef={searchHandleRef} placeholder="Search by people, tags, filenames…" />
              </div>

              <div className="flex items-center gap-2 cq-compact-sm flex-shrink-0 cq-utility-cluster">
                {assetsViewMode === "grid" && (
                  <Tooltip delayDuration={700}>
                    <DropdownMenu>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-10 gap-2 px-3 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]">
                            <i className="bi bi-arrow-down-up w-4 h-4 inline-flex items-center justify-center leading-none" />
                            <span className="sort-label">{sortField ? SORT_LABELS[sortField] : "Default"}</span>
                            <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <DropdownMenuContent className="bg-white w-48">
                        {visibleSortOptions.map(opt => (
                          <DropdownMenuItem key={opt.value} onClick={() => handleSortChange(opt.value)} className="flex items-center justify-between">
                            {opt.label}
                            {sortField === opt.value && <span className="text-xs text-muted-foreground ml-2">{sortDirection === "desc" ? "↓" : "↑"}</span>}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <TooltipContent side="bottom">Sort by...</TooltipContent>
                  </Tooltip>
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
                  {/* Multi-select MODE toggle (PORTAL-12949): entering starts with
                      zero selected; the banner's master checkbox does select-all */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-10 w-10 rounded-l-none text-[#6e84a3] ${assetMultiSelectMode ? "bg-gray-100" : ""}`}
                    onClick={() => {
                      if (assetMultiSelectMode) {
                        setSelectedAssets(new Set());
                      }
                      setAssetMultiSelectMode(!assetMultiSelectMode);
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
                  onClick={() => setAssetSettingsDrawerOpen(true)}
                >
                  <i className="bi bi-gear w-4 h-4 inline-flex items-center justify-center leading-none" />
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
                onOpenFiltersSheet={() => setAssetsFiltersSheetOpen(true)}
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
                creatorFilter.forEach(v => chips.push({ label: PEOPLE_NAME_LOOKUP[v] || v, value: v, sourceId: "creator", icon: <i className="bi bi-person text-sm" /> }));
                contentTypeFilter.forEach(v => chips.push({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v, sourceId: "content-type", icon: <i className="bi bi-image text-sm" /> }));
                orientationFilter.forEach(v => chips.push({ label: ORIENTATION_LABELS[v] || v, value: v, sourceId: "orientation", icon: <i className="bi bi-crop text-sm" /> }));
                {
                  const dateLabels: Record<string, string> = { today: "Today", week: "Last 7 days", "two-weeks": "Last 14 days", month: "Last 30 days", mtd: "Month to Date", quarter: "Last 90 days", year: "Last 12 months", custom: "Custom Date" };
                  if (addedDateFilter) {
                    chips.push({ label: `Added: ${dateLabels[addedDateFilter] || addedDateFilter}`, value: addedDateFilter, sourceId: "added-date", icon: <i className="bi bi-calendar-plus text-sm" /> });
                  }
                  if (capturedDateFilter) {
                    chips.push({ label: `Captured: ${dateLabels[capturedDateFilter] || capturedDateFilter}`, value: capturedDateFilter, sourceId: "captured-date", icon: <i className="bi bi-calendar text-sm" /> });
                  }
                }
                folderFilter.forEach(v => chips.push({ label: v, value: v, sourceId: "folders", icon: <i className="bi bi-folder text-sm" /> }));
                sourceFilter.forEach(v => chips.push({ label: v.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: v, sourceId: "source", icon: <i className="bi bi-cloud-arrow-down text-sm" /> }));
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

            {/* Asset Bulk Action Bar — visible whenever multi-select is active, even at 0 */}
            {inAssetMultiSelect && (
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
                  if (inAssetMultiSelect && !isSelected) {
                    cardState = "bulk-select";
                  } else if (isSelected) {
                    cardState = "selected";
                  }

                  return (
                    <div
                      key={asset.id}
                      onClick={() => {
                        // If in bulk select mode, toggle selection instead of opening detail
                        if (inAssetMultiSelect) {
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
                        isBranded={isBrandedActive && asset.isBranded}
                        isFavorite={favoriteAssetIds.has(asset.id)}
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
                        onFavorite={() => handleToggleFavoriteAsset(asset.id)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </TabsContent>

          <TabsContent value="galleries" className="flex-1 overflow-y-auto pb-6 mt-0">
            {/* Sticky header: search + filters + chips + bulk bar pin while the grid scrolls */}
            <StickyHeaderBlock>
            {/* Search Row with Utility Cluster */}
            <div className="flex items-center gap-4 mb-3 cq-search-row">
              <div className="flex-1 min-w-0 cq-search-input">
                <FacetedSearchWithTypeahead placeholder="Search" />
              </div>

              <div className="flex items-center gap-2 cq-compact-sm flex-shrink-0 cq-utility-cluster">
                {galleriesViewMode === "grid" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-10 gap-2 px-3 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]" title={`Sort: ${GALLERY_SORT_OPTIONS.find(o => o.value === gallerySortField)?.label}`}>
                        <i className="bi bi-arrow-down-up w-4 h-4 inline-flex items-center justify-center leading-none" />
                        <span className="sort-label">{GALLERY_SORT_OPTIONS.find(o => o.value === gallerySortField)?.label}</span>
                        <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white w-48">
                      {GALLERY_SORT_OPTIONS.map(opt => (
                        <DropdownMenuItem key={opt.value} onClick={() => handleGallerySortChange(opt.value)} className="flex items-center justify-between">
                          {opt.label}
                          {gallerySortField === opt.value && <span className="text-xs text-muted-foreground ml-2">{gallerySortDirection === "desc" ? "↓" : "↑"}</span>}
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
                    <i className="bi bi-grid w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-10 w-10 rounded-none border-x border-gray-300 text-[#6e84a3] ${galleriesViewMode === "list" ? "bg-gray-100" : ""}`}
                    onClick={() => setGalleriesViewMode("list")}
                  >
                    <i className="bi bi-table w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-10 w-10 rounded-l-none text-[#6e84a3] ${galleryMultiSelectMode ? "bg-gray-100" : ""}`}
                    onClick={() => {
                      if (galleryMultiSelectMode) {
                        setSelectedGalleries(new Set());
                      }
                      setGalleryMultiSelectMode(!galleryMultiSelectMode);
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
                  onClick={() => setGallerySettingsDrawerOpen(true)}
                >
                  <i className="bi bi-gear w-4 h-4 inline-flex items-center justify-center leading-none" />
                </Button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="mb-3">
              <GalleryFilterBar
                isUnsortedActive={unsortedGalleriesOnly}
                onUnsortedToggle={setUnsortedGalleriesOnly}
                isArchivedActive={archivedGalleriesOnly}
                onArchivedToggle={setArchivedGalleriesOnly}
                isFavoritesActive={favoriteGalleriesOnly}
                onFavoritesToggle={setFavoriteGalleriesOnly}
                onOpenFiltersSheet={() => setGalleriesFiltersSheetOpen(true)}
                onActiveFiltersChange={setGalleryTabChips}
                handleRef={galleryTabFilterBarHandleRef}
              />
            </div>

            {/* Applied Filter Chips - reserved height to prevent layout shift */}
            <div className="min-h-[24px] mb-4">
              {galleryTabChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {galleryTabChips.map((chip, i) => (
                    <Badge
                      key={`${chip.filterId}-${chip.value}-${i}`}
                      colorStyle="primary"
                      theme="soft"
                      shape="rounded"
                      className="gap-1.5 pr-1.5 cursor-pointer transition-colors hover:bg-primary/30 text-[13px] normal-case tracking-normal font-normal"
                      onClick={() => galleryTabFilterBarHandleRef.current?.removeValue(chip.filterId, chip.value)}
                    >
                      {chip.label}
                      <i className="bi bi-x text-sm ml-0.5" />
                    </Badge>
                  ))}
                  <button
                    onClick={() => galleryTabFilterBarHandleRef.current?.clearAll()}
                    className="text-[13px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Bulk Action Bar */}
            {/* Banner shows in both grid AND table view (PORTAL-12949) */}
            {isAnyGallerySelected && (
              <div className="flex items-center justify-between mb-4 px-5 py-3.5 bg-[#12263f] rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={allGalleriesSelected}
                    onCheckedChange={toggleSelectAllGalleries}
                    className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#12263f]"
                  />
                  <span className="text-[15px] font-medium text-white">{selectedGalleries.size} {selectedGalleries.size === 1 ? "Gallery" : "Galleries"} Selected</span>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md bg-[#edf2f9] text-[#12263f] hover:bg-white disabled:opacity-60">
                        <i className="bi bi-heart w-4 h-4 inline-flex items-center justify-center leading-none" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Favorite</TooltipContent>
                  </Tooltip>
                  {archivedGalleriesOnly ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {/* div wrapper: disabled buttons don't fire the pointer events the tooltip needs */}
                        <div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md bg-[#edf2f9] text-[#12263f] hover:bg-white disabled:opacity-60"
                            disabled={anySelectedBlocked}
                            onClick={() => {
                              const count = selectedGalleries.size;
                              setGalleriesArchived(Array.from(selectedGalleries), false);
                              setSelectedGalleries(new Set());
                              toast({
                                title: "Galleries unarchived",
                                description: `${count} ${count === 1 ? "gallery" : "galleries"} unarchived.`,
                              });
                            }}
                          >
                            <i className="bi bi-archive w-4 h-4 inline-flex items-center justify-center leading-none" />
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {anySelectedBlocked
                          ? "Some selected galleries are in archived folders. Move them out of the archived folder to unarchive them."
                          : "Unarchive"}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md bg-[#edf2f9] text-[#12263f] hover:bg-white disabled:opacity-60" onClick={() => {
                          const count = selectedGalleries.size;
                          setGalleriesArchived(Array.from(selectedGalleries), true);
                          setSelectedGalleries(new Set());
                          toast({
                            title: "Galleries archived",
                            description: `${count} ${count === 1 ? "gallery" : "galleries"} archived.`,
                          });
                        }}>
                          <i className="bi bi-archive w-4 h-4 inline-flex items-center justify-center leading-none" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Archive</TooltipContent>
                    </Tooltip>
                  )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md bg-[#edf2f9] text-[#12263f] hover:bg-white disabled:opacity-60">
                      <i className="bi bi-three-dots w-4 h-4 inline-flex items-center justify-center leading-none" />
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
                              <i className="bi bi-folder-symlink w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Move
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
                      <i className="bi bi-trash w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
              </div>
            )}

            </StickyHeaderBlock>{/* End sticky header */}

            {/* Galleries Grid/Table */}
            <div className="min-h-[400px]">
              {galleriesViewMode === "list" ? (
                <GalleryTableView
                  selectedGalleries={selectedGalleries}
                  onSelectionChange={setSelectedGalleries}
                  galleries={galleryList.map(g => ({ ...g, archived: isGalleryArchivedById(g.id) }))}
                  onNavigate={handleNavigate}
                  onMoveGalleries={handleMoveGalleries}
                  onArchiveGallery={handleArchiveGallery}
                  onUnarchiveGallery={handleUnarchiveGallery}
                  perPage={galleryPerPage}
                  columnVisibility={galleryColumnVisibility}
                />
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                  {sortedGalleryList.filter(g => {
                    const isArchived = isGalleryArchivedById(g.id);
                    if (archivedGalleriesOnly ? !isArchived : isArchived) return false;
                    if (favoriteGalleriesOnly && !g.isFavorite) return false;
                    if (unsortedGalleriesOnly) {
                      // Unsorted = not inside any real folder ("All Media" doesn't
                      // count, matching getGalleryLocationDisplay's semantics)
                      const path = findGalleryParentPath(g.id, folderTree);
                      const inFolder = path !== null && path.some(p => p !== "All Media");
                      if (inFolder) return false;
                    }
                    return true;
                  }).map((gallery) => {
                    const isSelected = selectedGalleries.has(gallery.id);
                    const isGalleryArchived = isGalleryArchivedById(gallery.id);
                    const isGalleryInFolder = findGalleryParentPath(gallery.id, folderTree) !== null;
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
                        thumbnailUrl={gallery.thumbnailUrl}
                        isArchived={isGalleryArchived}
                        isPublic={gallery.isPublic}
                        isFavorite={gallery.isFavorite}
                        isInFolder={isGalleryInFolder}
                        state={cardState}
                        onSelect={() => {
                          toggleGallerySelection(gallery.id);
                        }}
                        onOpen={() => {
                          if (archivedGalleriesOnly) {
                            // Archived galleries can be selected (for bulk unarchive) but not opened
                            if (isAnyGallerySelected) toggleGallerySelection(gallery.id);
                            return;
                          }
                          if (isAnyGallerySelected) {
                            toggleGallerySelection(gallery.id);
                          } else {
                            setActiveFolder(gallery.id);
                          }
                        }}
                        onFavorite={() => handleToggleFavoriteGallery(gallery.id)}
                        onMove={() => handleMoveGalleries([gallery.id])}
                        onArchive={() => handleArchiveGallery(gallery.id)}
                        onUnarchive={() => handleUnarchiveGallery(gallery.id)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="folders" className="flex-1 overflow-y-auto pb-6 mt-0">
            {/* Sticky header: search + filters + chips + bulk bar pin while the grid scrolls */}
            <StickyHeaderBlock>
            {/* Search Row with Utility Cluster */}
            <div className="flex items-center gap-4 mb-3 cq-search-row">
              <div className="flex-1 min-w-0 cq-search-input">
                <FacetedSearchWithTypeahead onSearch={(query) => setFolderSearchQuery(query)} placeholder="Search" />
              </div>

              <div className="flex items-center gap-2 cq-compact-sm flex-shrink-0 cq-utility-cluster">
                <div className="flex items-center border border-gray-300 rounded-md bg-white">
                  <Button variant="ghost" size="icon" className={`h-10 w-10 rounded-r-none text-[#6e84a3] ${folderViewMode === "grid" ? "bg-gray-100" : ""}`} onClick={() => setFolderViewMode("grid")}>
                    <i className="bi bi-grid w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                  <Button variant="ghost" size="icon" className={`h-10 w-10 rounded-l-none border-l border-gray-300 text-[#6e84a3] ${folderViewMode === "table" ? "bg-gray-100" : ""}`} onClick={() => setFolderViewMode("table")}>
                    <i className="bi bi-table w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Applied Filter Chips - reserved height to prevent layout shift */}
            <div className="min-h-[24px] mb-4">
              {/* Filter chips would go here when filters are active */}
            </div>

            </StickyHeaderBlock>{/* End sticky header */}

            {/* Folders Grid */}
            {(() => {
              const topLevelFolders = folderTree.filter(f => f.id !== "all" && f.type === "folder");
              const searchFiltered = folderSearchQuery
                ? topLevelFolders.filter(f => f.name.toLowerCase().includes(folderSearchQuery.toLowerCase()))
                : topLevelFolders;
              const visibleFolders = searchFiltered.filter(f => archivedFoldersOnly || f.archived !== true);
              const filteredFolderCards = visibleFolders
                .map(f => ({ id: f.id, name: f.name, galleryCount: countAllGalleries(f), timeAgo: "—", archived: f.archived === true }));
              return filteredFolderCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <i className="bi bi-folder text-5xl text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium mb-1">No folders</h3>
                  <p className="text-sm text-muted-foreground">{folderSearchQuery ? "No folders match your search." : "Create a folder to get started."}</p>
                </div>
              ) : folderViewMode === "table" ? (
                <FolderTableView
                  folders={visibleFolders}
                  onNavigate={(folderId) => setActiveFolder(folderId)}
                  onUnarchiveFolder={(folderId) => {
                    handleUnarchiveFolder(folderId);
                    const name = topLevelFolders.find(f => f.id === folderId)?.name || "Folder";
                    toast({ title: "Folder unarchived", description: `"${name}" has been unarchived.` });
                  }}
                  perPage={folderPerPage}
                  columnVisibility={folderColumnVisibility}
                />
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                  {filteredFolderCards.map((folder) => {
                    return (
                      <FolderCard
                        key={folder.id}
                        name={folder.name}
                        galleryCount={folder.galleryCount}
                        isArchived={folder.archived}
                        onSelect={() => {
                          if (!folder.archived) {
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

          <TabsContent value="favorites" className="flex-1 overflow-y-auto pb-6 mt-0">
            {/* Secondary section nav: Galleries | Assets (Galleries default, matching prod) */}
            <Tabs value={favSubTab} onValueChange={setFavSubTab} className="flex flex-col">
              <div className="mb-6 sticky top-0 z-30 bg-background pt-6">
                <SectionTabs
                  tabs={[
                    { value: "galleries", label: "Galleries" },
                    { value: "assets", label: "Assets" },
                  ]}
                  value={favSubTab}
                  onValueChange={setFavSubTab}
                  isMobile={isMobile}
                />
              </div>

              {/* ── Favorited Galleries ─────────────────────────────── */}
              <TabsContent value="galleries" className="mt-0">
                {/* Sticky header: pins below the sticky section tabs */}
                <StickyHeaderBlock className="top-[65px] pt-0">
                {/* Search Row with Utility Cluster */}
                <div className="flex items-center gap-4 mb-3 cq-search-row">
                  <div className="flex-1 min-w-0 cq-search-input">
                    <FacetedSearchWithTypeahead onSearch={setFavGallerySearch} placeholder="Search" />
                  </div>
                  <div className="flex items-center gap-2 cq-compact-sm flex-shrink-0 cq-utility-cluster">
                  {favGalleriesViewMode === "grid" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-10 gap-2 px-3 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]" title={`Sort: ${GALLERY_SORT_OPTIONS.find(o => o.value === favGallerySortField)?.label}`}>
                          <i className="bi bi-arrow-down-up w-4 h-4 inline-flex items-center justify-center leading-none" />
                          <span className="sort-label">{GALLERY_SORT_OPTIONS.find(o => o.value === favGallerySortField)?.label}</span>
                          <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white w-48">
                        {GALLERY_SORT_OPTIONS.map(opt => (
                          <DropdownMenuItem key={opt.value} onClick={() => handleFavGallerySortChange(opt.value)} className="flex items-center justify-between">
                            {opt.label}
                            {favGallerySortField === opt.value && <span className="text-xs text-muted-foreground ml-2">{favGallerySortDirection === "desc" ? "↓" : "↑"}</span>}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <div className="flex items-center border border-gray-300 rounded-md bg-white">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-10 w-10 rounded-r-none text-[#6e84a3] ${favGalleriesViewMode === "grid" ? "bg-gray-100" : ""}`}
                      onClick={() => setFavGalleriesViewMode("grid")}
                    >
                      <i className="bi bi-grid w-4 h-4 inline-flex items-center justify-center leading-none" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-10 w-10 rounded-none border-x border-gray-300 text-[#6e84a3] ${favGalleriesViewMode === "list" ? "bg-gray-100" : ""}`}
                      onClick={() => setFavGalleriesViewMode("list")}
                    >
                      <i className="bi bi-table w-4 h-4 inline-flex items-center justify-center leading-none" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-10 w-10 rounded-l-none text-[#6e84a3] ${favGalleryMultiSelectMode ? "bg-gray-100" : ""}`}
                      onClick={() => {
                        if (favGalleryMultiSelectMode) {
                          setFavSelectedGalleries(new Set());
                        }
                        setFavGalleryMultiSelectMode(!favGalleryMultiSelectMode);
                      }}
                    >
                      <i className="bi bi-check-square w-4 h-4 inline-flex items-center justify-center leading-none" />
                    </Button>
                  </div>
                  </div>
                </div>

                {/* Filter row: no Unsorted (top-level-only) or Favorites (redundant here) pills */}
                <div className="mb-3">
                  <GalleryFilterBar
                    isArchivedActive={favArchivedOnly}
                    onArchivedToggle={setFavArchivedOnly}
                    onActiveFiltersChange={setFavGalleryChips}
                    handleRef={favGalleryFilterBarHandleRef}
                  />
                </div>

                {/* Applied Filter Chips - reserved height to prevent layout shift */}
                <div className="min-h-[24px] mb-4">
                  {favGalleryChips.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {favGalleryChips.map((chip, i) => (
                        <Badge
                          key={`${chip.filterId}-${chip.value}-${i}`}
                          colorStyle="primary"
                          theme="soft"
                          shape="rounded"
                          className="gap-1.5 pr-1.5 cursor-pointer transition-colors hover:bg-primary/30 text-[13px] normal-case tracking-normal font-normal"
                          onClick={() => favGalleryFilterBarHandleRef.current?.removeValue(chip.filterId, chip.value)}
                        >
                          {chip.label}
                          <i className="bi bi-x text-sm ml-0.5" />
                        </Badge>
                      ))}
                      <button
                        onClick={() => favGalleryFilterBarHandleRef.current?.clearAll()}
                        className="text-[13px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>

                {/* Bulk action bar — variation 4 demo: navy max-contrast tone */}
                {inFavGalleryMultiSelect && (
                  <div className="flex items-center justify-between mb-4 px-5 py-3.5 bg-[#12263f] rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={favGalleries.length > 0 && favSelectedGalleries.size === favGalleries.length}
                        onCheckedChange={(checked) => {
                          setFavSelectedGalleries(checked ? new Set(favGalleries.map(g => g.id)) : new Set());
                        }}
                        className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#12263f]"
                      />
                      <span className="text-[15px] font-medium text-white">{favSelectedGalleries.size} {favSelectedGalleries.size === 1 ? "Gallery" : "Galleries"} Selected</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md bg-[#edf2f9] text-[#12263f] hover:bg-white"
                            onClick={() => {
                              const count = favSelectedGalleries.size;
                              setGalleryList(prev => prev.map(g => favSelectedGalleries.has(g.id) ? { ...g, isFavorite: false } : g));
                              setFavSelectedGalleries(new Set());
                              toast({ title: "Removed from Favorites", description: `${count} ${count === 1 ? "gallery" : "galleries"} removed from your favorites.` });
                            }}
                          >
                            <i className="bi bi-heart-fill w-4 h-4 inline-flex items-center justify-center leading-none" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove from Favorites</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md bg-[#edf2f9] text-[#12263f] hover:bg-white"
                            onClick={() => {
                              const count = favSelectedGalleries.size;
                              setGalleriesArchived(Array.from(favSelectedGalleries), true);
                              setFavSelectedGalleries(new Set());
                              toast({ title: "Galleries archived", description: `${count} ${count === 1 ? "gallery" : "galleries"} archived.` });
                            }}
                          >
                            <i className="bi bi-archive w-4 h-4 inline-flex items-center justify-center leading-none" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Archive</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}

                </StickyHeaderBlock>{/* End sticky header */}

                {favGalleries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <i className="bi bi-heart text-5xl text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium mb-1">No favorited galleries</h3>
                    <p className="text-sm text-muted-foreground">Tap the heart on any gallery to add it to Favorites</p>
                  </div>
                ) : favGalleriesViewMode === "list" ? (
                  <GalleryTableView
                    selectedGalleries={favSelectedGalleries}
                    onSelectionChange={setFavSelectedGalleries}
                    galleries={favGalleries.map(g => ({ ...g, archived: isGalleryArchivedById(g.id) }))}
                    onNavigate={handleNavigate}
                    onMoveGalleries={handleMoveGalleries}
                    onArchiveGallery={handleArchiveGallery}
                    onUnarchiveGallery={handleUnarchiveGallery}
                    perPage={galleryPerPage}
                    columnVisibility={galleryColumnVisibility}
                  />
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                    {favGalleries.map((gallery) => {
                      const isSelected = favSelectedGalleries.has(gallery.id);
                      let cardState: GalleryCardState = "default";
                      if (inFavGalleryMultiSelect && !isSelected) {
                        cardState = "bulk-select";
                      } else if (isSelected) {
                        cardState = "selected";
                      }
                      const toggleSelection = () => {
                        setFavSelectedGalleries(prev => {
                          const next = new Set(prev);
                          if (next.has(gallery.id)) next.delete(gallery.id); else next.add(gallery.id);
                          return next;
                        });
                      };
                      return (
                        <GalleryCard
                          key={gallery.id}
                          name={gallery.name}
                          assetCount={gallery.assetCount}
                          thumbnailUrl={gallery.thumbnailUrl}
                          isArchived={isGalleryArchivedById(gallery.id)}
                          isPublic={gallery.isPublic}
                          isFavorite={gallery.isFavorite}
                          isInFolder={findGalleryParentPath(gallery.id, folderTree) !== null}
                          state={cardState}
                          onSelect={toggleSelection}
                          onOpen={() => {
                            if (inFavGalleryMultiSelect) toggleSelection();
                            else setActiveFolder(gallery.id);
                          }}
                          onFavorite={() => handleToggleFavoriteGallery(gallery.id)}
                          onMove={() => handleMoveGalleries([gallery.id])}
                          onArchive={() => handleArchiveGallery(gallery.id)}
                          onUnarchive={() => handleUnarchiveGallery(gallery.id)}
                        />
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* ── Favorited Assets ────────────────────────────────── */}
              <TabsContent value="assets" className="mt-0">
                {/* Sticky header: pins below the sticky section tabs */}
                <StickyHeaderBlock className="top-[65px] pt-0">
                {/* Search Row with Utility Cluster */}
                <div className="flex items-center gap-4 mb-3 cq-search-row">
                  <div className="flex-1 min-w-0 cq-search-input">
                    <FacetedSearchWithTypeahead onSearch={setFavAssetSearch} assets={favAssetsBase} placeholder="Search by people, tags, filenames…" />
                  </div>
                  <div className="flex items-center gap-2 cq-compact-sm flex-shrink-0 cq-utility-cluster">
                  <Tooltip delayDuration={700}>
                    <DropdownMenu>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-10 gap-2 px-3 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]">
                            <i className="bi bi-arrow-down-up w-4 h-4 inline-flex items-center justify-center leading-none" />
                            <span className="sort-label">{{ relevance: "Relevance", dateCreated: "Added", captureDate: "Captured", name: "Name", creator: "Creator" }[favAssetSort]}</span>
                            <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <DropdownMenuContent className="bg-white w-48">
                        {([
                          ...(favAssetSearch.trim() ? [["relevance", "Relevance"]] as const : []),
                          ["dateCreated", "Added"], ["captureDate", "Captured"], ["name", "Name"], ["creator", "Creator"],
                        ] as const).map(([value, label]) => (
                          <DropdownMenuItem key={value} onClick={() => { favSortPinnedRef.current = true; setFavAssetSort(value); if (value !== "relevance") favLastChosenSortRef.current = value; }} className="flex items-center justify-between">
                            {label}
                            {favAssetSort === value && <i className="bi bi-check text-sm ml-2" />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <TooltipContent side="bottom">Sort by...</TooltipContent>
                  </Tooltip>

                  <div className="flex items-center border border-gray-300 rounded-md bg-white">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-10 w-10 rounded-r-none text-[#6e84a3] ${favAssetsViewMode === "grid" ? "bg-gray-100" : ""}`}
                      onClick={() => setFavAssetsViewMode("grid")}
                    >
                      <i className="bi bi-grid w-4 h-4 inline-flex items-center justify-center leading-none" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-10 w-10 rounded-none border-x border-gray-300 text-[#6e84a3] ${favAssetsViewMode === "list" ? "bg-gray-100" : ""}`}
                      onClick={() => setFavAssetsViewMode("list")}
                    >
                      <i className="bi bi-table w-4 h-4 inline-flex items-center justify-center leading-none" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-10 w-10 rounded-l-none text-[#6e84a3] ${favAssetMultiSelectMode ? "bg-gray-100" : ""}`}
                      onClick={() => {
                        if (favAssetMultiSelectMode) {
                          setFavSelectedAssets(new Set());
                        }
                        setFavAssetMultiSelectMode(!favAssetMultiSelectMode);
                      }}
                    >
                      <i className="bi bi-check-square w-4 h-4 inline-flex items-center justify-center leading-none" />
                    </Button>
                  </div>
                  </div>
                </div>

                {/* Filter row: full assets filter set minus the Unsorted pill */}
                <div className="mb-3">
                  <FilterBar
                    onFilterChange={(filterId, values) => {
                      setFavAssetFilters(prev => {
                        const next = { ...prev };
                        if (values.length === 0) delete next[filterId]; else next[filterId] = values;
                        return next;
                      });
                    }}
                    onCustomDateChange={(filterId, range) => {
                      setFavAssetCustomDates(prev => ({ ...prev, [filterId]: { from: range.from, to: range.to } }));
                    }}
                    compactMode={true}
                    handleRef={favAssetsFilterBarHandleRef}
                    isUnviewedActive={favUnviewedActive}
                    onUnviewedToggle={setFavUnviewedActive}
                    isBrandingActive={favBrandedActive}
                    onBrandingToggle={setFavBrandedActive}
                  />
                </div>

                {/* Applied filter chips */}
                <div className="min-h-[24px] mb-4">
                  {(() => {
                    const dateLabels: Record<string, string> = { today: "Today", week: "Last 7 days", "two-weeks": "Last 14 days", month: "Last 30 days", mtd: "Month to Date", quarter: "Last 90 days", year: "Last 12 months", custom: "Custom Date" };
                    const chips = Object.entries(favAssetFilters).flatMap(([filterId, values]) =>
                      values.map(value => ({
                        filterId,
                        value,
                        label: filterId === "added-date" ? `Added: ${dateLabels[value] ?? value}`
                          : filterId === "captured-date" ? `Captured: ${dateLabels[value] ?? value}`
                          : filterId === "content-type" ? value.charAt(0).toUpperCase() + value.slice(1)
                          : value,
                      }))
                    );
                    if (chips.length === 0) return null;
                    return (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {chips.map((chip, i) => (
                          <Badge
                            key={`${chip.filterId}-${chip.value}-${i}`}
                            colorStyle="primary"
                            theme="soft"
                            shape="rounded"
                            className="gap-1.5 pr-1.5 cursor-pointer transition-colors hover:bg-primary/30 text-[13px] normal-case tracking-normal font-normal"
                            onClick={() => favAssetsFilterBarHandleRef.current?.removeValue(chip.filterId, chip.value)}
                          >
                            {chip.label}
                            <i className="bi bi-x text-sm ml-0.5" />
                          </Badge>
                        ))}
                        <button
                          onClick={() => favAssetsFilterBarHandleRef.current?.clearAll()}
                          className="text-[13px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                        >
                          Clear all
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Bulk action bar (inside the sticky header block) */}
                {inFavAssetMultiSelect && (
                  <AssetBulkActionBar
                    selectedCount={favSelectedAssets.size}
                    allSelected={favFilteredAssets.length > 0 && favSelectedAssets.size === favFilteredAssets.length}
                    someSelected={favSelectedAssets.size > 0 && favSelectedAssets.size < favFilteredAssets.length}
                    onSelectAll={(checked) => {
                      setFavSelectedAssets(checked ? new Set(favFilteredAssets.map(a => a.id)) : new Set());
                    }}
                  />
                )}

                </StickyHeaderBlock>{/* End sticky header */}

                {favFilteredAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <i className="bi bi-heart text-5xl text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium mb-1">No favorited assets</h3>
                    <p className="text-sm text-muted-foreground">
                      {Object.keys(favAssetFilters).length > 0 ? "Try adjusting your filters" : "Tap the heart on any asset to add it to Favorites"}
                    </p>
                  </div>
                ) : favAssetsViewMode === "list" ? (
                  <AssetTableView
                    assets={favFilteredAssets}
                    selectedAssets={favSelectedAssets}
                    onSelectAsset={(id, checked) => {
                      const next = new Set(favSelectedAssets);
                      if (checked) next.add(id); else next.delete(id);
                      setFavSelectedAssets(next);
                    }}
                    onSelectAll={(checked) => {
                      setFavSelectedAssets(checked ? new Set(favFilteredAssets.map(a => a.id)) : new Set());
                    }}
                    onOpenAsset={handleViewAsset}
                    perPage={assetPerPage}
                    columnVisibility={assetColumnVisibility}
                  />
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
                    {favFilteredAssets.map((asset) => {
                      const isSelected = favSelectedAssets.has(asset.id);
                      let cardState: AssetCardState = "default";
                      if (inFavAssetMultiSelect && !isSelected) {
                        cardState = "bulk-select";
                      } else if (isSelected) {
                        cardState = "selected";
                      }
                      return (
                        <div
                          key={asset.id}
                          onClick={() => {
                            if (favSelectedAssets.size > 0) {
                              const next = new Set(favSelectedAssets);
                              if (next.has(asset.id)) next.delete(asset.id); else next.add(asset.id);
                              setFavSelectedAssets(next);
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
                            isBranded={favBrandedActive && asset.isBranded}
                            isFavorite={favoriteAssetIds.has(asset.id)}
                            state={cardState}
                            onSelect={() => {
                              const next = new Set(favSelectedAssets);
                              if (next.has(asset.id)) next.delete(asset.id); else next.add(asset.id);
                              setFavSelectedAssets(next);
                            }}
                            onFavorite={() => handleToggleFavoriteAsset(asset.id)}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
        movingArchivedOnly={selectedMoveItems.length > 0 && selectedMoveItems.every(item => galleryList.find(g => g.id === item.id)?.archived === true)}
      />
      <MoveGalleriesDialog
        open={moveToUnarchiveGalleryId !== null}
        onOpenChange={(open) => { if (!open) setMoveToUnarchiveGalleryId(null); }}
        galleries={moveToUnarchiveItems}
        flattenedFolders={flatFolders}
        onMove={(locationId) => handleMoveToUnarchiveConfirm(locationId, false)}
        movingArchivedOnly
        title="Move Gallery"
        description="This gallery can't be unarchived because it's located in an archived folder. Move it to All Media or another active folder — it will stay archived — then unarchive it from its new location."
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
      {/* Asset Settings Drawer - tabbed interface */}
      <AssetSettingsDrawer
        open={assetSettingsDrawerOpen}
        onOpenChange={setAssetSettingsDrawerOpen}
        displayLabel={displayLabel}
        onDisplayLabelChange={setDisplayLabel}
        perPage={assetPerPage}
        onPerPageChange={setAssetPerPage}
        columnVisibility={assetColumnVisibility}
        onColumnVisibilityChange={setAssetColumnVisibility}
        filterVisibility={assetFilterVisibility}
        onFilterVisibilityChange={setAssetFilterVisibility}
      />

      {/* Gallery Settings Drawer - tabbed interface */}
      <GallerySettingsDrawer
        open={gallerySettingsDrawerOpen}
        onOpenChange={setGallerySettingsDrawerOpen}
        perPage={galleryPerPage}
        onPerPageChange={setGalleryPerPage}
        columnVisibility={galleryColumnVisibility}
        onColumnVisibilityChange={setGalleryColumnVisibility}
        filterVisibility={galleryFilterVisibility}
        onFilterVisibilityChange={setGalleryFilterVisibility}
      />

      {/* Folder Settings Drawer - original non-tabbed interface */}
      <SettingsDrawer
        open={settingsDrawerOpen}
        onOpenChange={setSettingsDrawerOpen}
        title="View Settings"
        showGridViewPreferences={false}
      >
        {activeTab === "folders" && (() => {
          const isTableView = folderViewMode === "table";
          return (
            <div className="space-y-4">
              {/* Per page dropdown */}
              <div className={cn("space-y-2", !isTableView && "opacity-50")}>
                <Label className="text-sm font-medium">Results per page</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={!isTableView}>
                    <Button variant="outline" className="w-full justify-between" disabled={!isTableView}>
                      {folderPerPage} per page
                      <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full bg-white">
                    {[10, 20, 40, 80].map(option => (
                      <DropdownMenuItem key={option} onClick={() => setFolderPerPage(option)}>
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
                    onClick={() => setFolderColumnVisibility(DEFAULT_FOLDER_COLUMN_VISIBILITY)}
                  >
                    Default
                  </button>
                </div>
                <div className="space-y-2">
                  {FOLDER_COLUMNS.map(col => (
                    <label key={col.key} className={cn("flex items-center gap-2", isTableView ? "cursor-pointer" : "cursor-not-allowed")}>
                      <Checkbox
                        checked={folderColumnVisibility[col.key]}
                        onCheckedChange={() => isTableView && setFolderColumnVisibility(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
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

      {/* Assets Filters Sheet (for narrow widths) */}
      <FiltersSheet
        open={assetsFiltersSheetOpen}
        onOpenChange={setAssetsFiltersSheetOpen}
        value={{}}
        onApply={() => {
          // TODO: Apply draft filters when controls are wired up
        }}
      >
        <FilterSection label="Content Type" icon="bi-image">
          <div className="text-sm text-muted-foreground">Content type filters will go here</div>
        </FilterSection>
        <FilterSection label="AI Tags" icon="bi-stars">
          <div className="text-sm text-muted-foreground">AI tags filters will go here</div>
        </FilterSection>
        <FilterSection label="Creator" icon="bi-person">
          <div className="text-sm text-muted-foreground">Creator filters will go here</div>
        </FilterSection>
        <FilterSection label="Added Date" icon="bi-calendar-plus">
          <div className="text-sm text-muted-foreground">Added date filters will go here</div>
        </FilterSection>
        <FilterSection label="Captured Date" icon="bi-calendar">
          <div className="text-sm text-muted-foreground">Captured date filters will go here</div>
        </FilterSection>
        <FilterSection label="More Filters" icon="bi-filter">
          <div className="text-sm text-muted-foreground">Source, Status, and other filters will go here</div>
        </FilterSection>
      </FiltersSheet>

      {/* Galleries Filters Sheet (for narrow widths) */}
      <FiltersSheet
        open={galleriesFiltersSheetOpen}
        onOpenChange={setGalleriesFiltersSheetOpen}
        value={{}}
        onApply={() => {
          // TODO: Apply draft filters when controls are wired up
        }}
        title="Gallery Filters"
      >
        <FilterSection label="Gallery Options" icon="bi-collection">
          <div className="text-sm text-muted-foreground">Gallery options filters will go here</div>
        </FilterSection>
        <FilterSection label="Creator" icon="bi-person">
          <div className="text-sm text-muted-foreground">Creator filters will go here</div>
        </FilterSection>
        <FilterSection label="Groups" icon="bi-people">
          <div className="text-sm text-muted-foreground">Groups filters will go here</div>
        </FilterSection>
        <FilterSection label="Created Date" icon="bi-calendar">
          <div className="text-sm text-muted-foreground">Created date filters will go here</div>
        </FilterSection>
      </FiltersSheet>

      {/* Upload Modal */}
      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
      />

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
