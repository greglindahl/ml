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
import { ChevronLeft, ChevronRight, Folder, Images, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { findFolderById, getMaxDepth, getFolderDepth } from "@/lib/mockFolderData";

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

// Collect all node IDs in the visible tree for SortableContext
function collectVisibleIds(
  items: FolderItem[],
  expandedFolders: Set<string>,
  showArchived: boolean
): string[] {
  const ids: string[] = [];
  for (const item of items) {
    if (!showArchived && item.archived) continue;
    ids.push(item.id);
    if (item.children && expandedFolders.has(item.id)) {
      ids.push(
        ...collectVisibleIds(
          item.children.filter((c) => showArchived || !c.archived),
          expandedFolders,
          showArchived
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const visibleIds = useMemo(
    () => collectVisibleIds(folderTree, expandedFolders, showArchived),
    [folderTree, expandedFolders, showArchived]
  );

  const validateDrop = useCallback(
    (draggedId: string, overId: string): boolean => {
      if (draggedId === overId) return false;
      if (overId === "all") return false;

      const draggedItem = findFolderById(folderTree, draggedId);
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
      const overItem = findFolderById(folderTree, overId);

      if (!overItem) return;

      // If dragging onto a folder (not a gallery), attempt to move INTO it
      if (overItem.type === "folder" && overId !== "all") {
        if (validateDrop(draggedId, overId)) {
          onMoveItem(draggedId, overId);
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

  const renderTree = (items: FolderItem[], depth = 0) => {
    return items
      .filter((f) => showArchived || f.archived !== true)
      .map((folder) => {
        const visibleChildren =
          folder.children?.filter((c) => showArchived || c.archived !== true) || [];
        const hasChildren = visibleChildren.length > 0;
        const isExpanded = expandedFolders.has(folder.id);
        const isGallery = folder.type === "gallery";
        const hasExpandableContent =
          hasChildren ||
          (folder.count != null && folder.count > 0 && !isGallery);

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
            disableDrag={folder.archived === true}
          >
            {hasChildren && isExpanded && (
              <div className="mt-1">
                {renderTree(visibleChildren, depth + 1)}
              </div>
            )}
          </SortableFolderItem>
        );
      });
  };

  if (!isFolderSidebarExpanded) {
    return (
      <div className="border-r bg-card flex flex-col w-12 h-full transition-all duration-300 ease-in-out overflow-hidden">
        <div className="p-2 flex flex-col items-center gap-1 min-w-12">
          <button
            onClick={() => onSetSidebarExpanded(true)}
            className="p-2 hover:bg-accent rounded transition-colors"
            aria-label="Expand folders"
          >
            <Folder className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => onSetSidebarExpanded(true)}
            className="p-2 hover:bg-accent rounded transition-colors"
            aria-label="Expand folders"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-r bg-card flex flex-col w-64 h-full transition-all duration-300 ease-in-out overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between min-w-64">
        <span className="font-medium text-sm">Library</span>
        <button
          onClick={() => onSetSidebarExpanded(false)}
          className="p-1 hover:bg-accent rounded transition-colors"
          aria-label="Collapse folders"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* DnD Tree */}
      <div className="flex-1 p-2 overflow-y-auto min-w-64">
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
              <div className="flex items-center gap-2 px-3 py-1.5 text-sm bg-card border rounded-md shadow-lg opacity-90">
                {activeItem.type === "gallery" ? (
                  <Images className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Folder className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="truncate">{activeItem.name}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Pinned footer: View Archived toggle */}
      <div className="p-3 border-t flex items-center justify-between min-w-64">
        <Label htmlFor="view-archived" className="text-sm text-muted-foreground cursor-pointer">
          View Archived
        </Label>
        <Switch id="view-archived" checked={showArchived} onCheckedChange={onToggleArchived} />
      </div>

      <AlertDialog open={showDepthAlert} onOpenChange={setShowDepthAlert}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-destructive" />
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
    </div>
  );
}
