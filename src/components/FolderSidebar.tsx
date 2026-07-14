import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import "bootstrap-icons/font/bootstrap-icons.css";
import { SortableFolderItem } from "@/components/SortableFolderItem";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import type { FolderItem } from "@/lib/mockFolderData";
import { findFolderById, getMaxDepth, getFolderDepth, countTotalAssets } from "@/lib/mockFolderData";
import { MOVE_MEDIA_ITEM_LIMIT } from "@/lib/limits";

interface FolderSidebarProps {
  folderTree: FolderItem[];
  activeFolder: string;
  expandedFolders: Set<string>;
  isFolderSidebarExpanded: boolean;
  onSetActiveFolder: (id: string) => void;
  onToggleFolderExpand: (id: string) => void;
  onSetSidebarExpanded: (v: boolean) => void;
  onMoveItem: (itemId: string, targetFolderId: string | null) => void;
  onReorder: (parentId: string | null, itemId: string, overItemId: string) => void;
  showArchived: boolean;
  onToggleArchived: (v: boolean) => void;
}

// The "View Archived Folders" toggle only governs folders. A standalone archived
// gallery at the root has nothing to do with folder archiving, so it never appears
// here — but an archived gallery nested inside an archived folder still follows
// the toggle, since it's part of that folder's contents.
function isVisibleInFolderTree(item: FolderItem, showArchived: boolean, isRoot: boolean): boolean {
  if (!item.archived) return true;
  if (isRoot && item.type === "gallery") return false;
  return showArchived;
}

// Collect all node IDs in the visible tree for SortableContext
function collectVisibleIds(
  items: FolderItem[],
  expandedFolders: Set<string>,
  showArchived: boolean,
  isRoot = true
): string[] {
  const ids: string[] = [];
  for (const item of items) {
    if (!isVisibleInFolderTree(item, showArchived, isRoot)) continue;
    ids.push(item.id);
    if (item.children && expandedFolders.has(item.id)) {
      ids.push(
        ...collectVisibleIds(
          item.children.filter((c) => isVisibleInFolderTree(c, showArchived, false)),
          expandedFolders,
          showArchived,
          false
        )
      );
    }
  }
  return ids;
}

// Find the parent ID of a given item in the tree (null = root)
function findParentId(
  tree: FolderItem[],
  itemId: string,
  parentId: string | null = null
): string | null | undefined {
  for (const item of tree) {
    if (item.id === itemId) return parentId;
    if (item.children) {
      const found = findParentId(item.children, itemId, item.id);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

export function FolderSidebar({
  folderTree,
  activeFolder,
  expandedFolders,
  isFolderSidebarExpanded,
  onSetActiveFolder,
  onToggleFolderExpand,
  onSetSidebarExpanded,
  onMoveItem,
  onReorder,
  showArchived,
  onToggleArchived,
}: FolderSidebarProps) {
  const [activeItem, setActiveItem] = useState<FolderItem | null>(null);
  const [overTargetId, setOverTargetId] = useState<string | null>(null);
  const [isOverValid, setIsOverValid] = useState(false);
  const [showDepthAlert, setShowDepthAlert] = useState(false);
  // Set when a drop is rejected for exceeding the media item limit; holds the dragged item so the alert can show its name and count.
  const [limitAlertItem, setLimitAlertItem] = useState<FolderItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // "All Media" is the fixed root — it is excluded from the sortable set so the
  // drag move-animation never shifts it or opens a slot above/at its position.
  const visibleIds = useMemo(
    () =>
      collectVisibleIds(folderTree, expandedFolders, showArchived).filter(
        (id) => id !== "all"
      ),
    [folderTree, expandedFolders, showArchived]
  );

  const validateDrop = useCallback(
    (draggedId: string, overId: string): boolean => {
      if (draggedId === overId) return false;

      const draggedItem = findFolderById(folderTree, draggedId);

      // Item-count limit: a subtree over the media item limit can't be moved anywhere
      if (draggedItem && countTotalAssets(draggedItem) > MOVE_MEDIA_ITEM_LIMIT) return false;

      // Dropping onto "All Media" moves the item out to the root level —
      // valid unless the item already lives at the root.
      if (overId === "all") {
        return findParentId(folderTree, draggedId) !== null;
      }

      const overItem = findFolderById(folderTree, overId);
      if (!draggedItem || !overItem) return false;

      // Can't drop a folder onto a gallery
      if (overItem.type === "gallery") return false;

      // Check depth: target's depth + dragged subtree depth must be <= 4
      const targetDepth = getFolderDepth(overId, folderTree);
      const draggedSubtreeDepth = getMaxDepth(draggedItem);
      if (targetDepth + draggedSubtreeDepth > 3) return false;

      // Can't drop into own descendant
      const checkDescendant = (item: FolderItem): boolean => {
        if (item.id === overId) return true;
        return item.children?.some(checkDescendant) ?? false;
      };
      if (draggedItem.type === "folder" && checkDescendant(draggedItem)) return false;

      return true;
    },
    [folderTree]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const item = findFolderById(folderTree, String(event.active.id));
      setActiveItem(item ?? null);
    },
    [folderTree]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const overId = event.over?.id ? String(event.over.id) : null;
      setOverTargetId(overId);
      if (overId && activeItem) {
        setIsOverValid(validateDrop(activeItem.id, overId));
      } else {
        setIsOverValid(false);
      }
    },
    [activeItem, validateDrop]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveItem(null);
      setOverTargetId(null);
      setIsOverValid(false);

      if (!over || active.id === over.id) return;

      const draggedId = String(active.id);
      const overId = String(over.id);

      // "All Media" is anchored — it can't be dragged.
      if (draggedId === "all") return;

      const draggedItem = findFolderById(folderTree, draggedId);
      const exceedsMoveLimit =
        draggedItem != null && countTotalAssets(draggedItem) > MOVE_MEDIA_ITEM_LIMIT;

      // Dropping onto "All Media" moves the item out of its folder to the root.
      if (overId === "all") {
        if (findParentId(folderTree, draggedId) !== null) {
          if (exceedsMoveLimit) {
            setLimitAlertItem(draggedItem);
          } else {
            onMoveItem(draggedId, null);
          }
        }
        return;
      }

      const overItem = findFolderById(folderTree, overId);

      if (!overItem) return;

      // If dragging onto a folder (not a gallery), attempt to move INTO it
      if (overItem.type === "folder" && overId !== "all") {
        if (validateDrop(draggedId, overId)) {
          onMoveItem(draggedId, overId);
        } else if (exceedsMoveLimit) {
          setLimitAlertItem(draggedItem);
        } else {
          setShowDepthAlert(true);
        }
        return;
      }

      // Otherwise it's a reorder (over item is a sibling)
      const draggedParent = findParentId(folderTree, draggedId);
      const overParent = findParentId(folderTree, overId);

      if (draggedParent === overParent) {
        // Same parent → reorder
        onReorder(draggedParent ?? null, draggedId, overId);
      }
    },
    [folderTree, validateDrop, onMoveItem, onReorder]
  );

  const handleDragCancel = useCallback(() => {
    setActiveItem(null);
    setOverTargetId(null);
    setIsOverValid(false);
  }, []);

  const renderTree = (items: FolderItem[], depth = 0, isRoot = true) => {
    return items
      .filter((f) => isVisibleInFolderTree(f, showArchived, isRoot))
      .map((folder) => {
        const visibleChildren =
          folder.children?.filter((c) => isVisibleInFolderTree(c, showArchived, false)) || [];
        const hasChildren = visibleChildren.length > 0;
        const isExpanded = expandedFolders.has(folder.id);
        const isGallery = folder.type === "gallery";
        const hasExpandableContent = hasChildren;

        const isThisOverValid =
          overTargetId === folder.id && isOverValid;
        const isThisOverInvalid =
          overTargetId === folder.id && !isOverValid && activeItem != null;

        return (
          <SortableFolderItem
            key={folder.id}
            folder={folder}
            depth={depth}
            isActive={activeFolder === folder.id}
            isExpanded={isExpanded}
            hasExpandableContent={hasExpandableContent}
            onSelect={onSetActiveFolder}
            onToggleExpand={onToggleFolderExpand}
            isOverValid={isThisOverValid}
            isOverInvalid={isThisOverInvalid}
            isArchived={folder.archived === true}
            disableDrag={folder.archived === true || folder.id === "all"}
            disableDrop={folder.archived === true}
          >
            {hasChildren && isExpanded && (
              <div className="mt-1">
                {renderTree(visibleChildren, depth + 1, false)}
              </div>
            )}
          </SortableFolderItem>
        );
      });
  };

  if (!isFolderSidebarExpanded) {
    return (
      <div className="folder-tree-sidebar border-r border-[#e3ebf6] bg-white flex flex-col w-[48px] h-full transition-all duration-300 ease-in-out overflow-hidden pt-3 pb-6 px-1">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => onSetSidebarExpanded(true)}
            className="p-2 hover:bg-[#EDF2F9] rounded-md transition-colors"
            aria-label="Expand folders"
          >
            <i className="bi bi-folder text-[15px] text-[#6e84a3]" />
          </button>
          <button
            onClick={() => onSetSidebarExpanded(true)}
            className="p-2 hover:bg-[#EDF2F9] rounded-md transition-colors"
            aria-label="Expand folders"
          >
            <i className="bi bi-chevron-double-right text-[15px] text-[#6e84a3]" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="folder-tree-sidebar border-r border-[#e3ebf6] bg-white flex flex-col w-[264px] h-full transition-all duration-300 ease-in-out overflow-hidden pt-3 pb-6 px-1">
      {/* Header */}
      <div className="px-3 py-3 flex items-center justify-between border-b border-[#e3ebf6]">
        <span className="font-normal text-[15px] text-[#12263f] tracking-[-0.3px]">Library</span>
        <button
          onClick={() => onSetSidebarExpanded(false)}
          className="p-1 hover:bg-[#EDF2F9] rounded-md transition-colors"
          aria-label="Collapse folders"
        >
          <i className="bi bi-chevron-double-left text-[15px] text-[#6e84a3]" />
        </button>
      </div>

      {/* DnD Tree */}
      <div className="flex-1 overflow-y-auto mt-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={visibleIds} strategy={verticalListSortingStrategy}>
            {renderTree(folderTree)}
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
            {activeItem ? (
              <div className="flex items-center gap-2 px-3 py-1.5 text-[13px] bg-white border border-[#e3ebf6] rounded-md shadow-lg opacity-90">
                {activeItem.type === "gallery" ? (
                  <i className="bi bi-images text-[#6e84a3]" />
                ) : (
                  <i className="bi bi-folder text-[#6e84a3]" />
                )}
                <span className="truncate text-[#6e84a3]">{activeItem.name}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Pinned footer: View Archived toggle */}
      <div className="px-3 py-3 border-t border-[#e3ebf6] flex items-center justify-between">
        <Label htmlFor="view-archived" className="text-[13px] font-normal text-[#6e84a3] cursor-pointer tracking-[-0.13px] flex items-center gap-2">
          <i className="bi bi-archive text-[14px]" />
          View Archived Folders
        </Label>
        <Switch id="view-archived" checked={showArchived} onCheckedChange={onToggleArchived} />
      </div>

      <AlertDialog open={showDepthAlert} onOpenChange={setShowDepthAlert}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <i className="bi bi-info-circle w-5 h-5 text-destructive inline-flex items-center justify-center leading-none" />
              Move not allowed
            </AlertDialogTitle>
            <AlertDialogDescription>
              This move would exceed the 4-level folder limit. Choose a different location.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowDepthAlert(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={limitAlertItem != null} onOpenChange={(open) => !open && setLimitAlertItem(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Move not allowed</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="font-semibold text-foreground">Too many items to move.</strong> This move would affect{" "}
              <strong className="font-semibold text-foreground">{limitAlertItem ? countTotalAssets(limitAlertItem).toLocaleString() : ""} media items</strong>, which exceeds the{" "}
              {MOVE_MEDIA_ITEM_LIMIT.toLocaleString()} media item limit for a single move. Try moving subfolders individually in smaller batches.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setLimitAlertItem(null)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
