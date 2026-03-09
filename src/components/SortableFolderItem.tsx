import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Folder, Images, GripVertical } from "lucide-react";
import type { FolderItem } from "@/lib/mockFolderData";

interface SortableFolderItemProps {
  folder: FolderItem;
  depth: number;
  isActive: boolean;
  isExpanded: boolean;
  hasExpandableContent: boolean;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  children?: React.ReactNode;
  isOverValid?: boolean;
  isOverInvalid?: boolean;
  isArchived?: boolean;
  disableDrag?: boolean;
}

export function SortableFolderItem({
  folder,
  depth,
  isActive,
  isExpanded,
  hasExpandableContent,
  onSelect,
  onToggleExpand,
  children,
  isOverValid,
  isOverInvalid,
  isArchived,
  disableDrag,
}: SortableFolderItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: folder.id,
    data: { type: folder.type, folder },
    disabled: disableDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isGallery = folder.type === "gallery";
  const isAllFiles = folder.id === "all";

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`group flex items-center gap-1 py-1.5 text-sm rounded-md transition-colors ${
          isActive
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        } ${isOverValid ? "ring-2 ring-primary bg-primary/10" : ""} ${
          isOverInvalid ? "ring-2 ring-destructive bg-destructive/10" : ""
        } ${isArchived ? "opacity-50" : ""}`}
        style={{ paddingLeft: `${4 + depth * 16}px`, paddingRight: 12 }}
      >
        {/* Drag handle */}
        {!isAllFiles && (
          disableDrag ? (
            <span className="p-0.5 flex-shrink-0 w-[18px]" aria-hidden="true" />
          ) : (
            <button
              className="p-0.5 cursor-grab opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity flex-shrink-0 touch-none"
              {...attributes}
              {...listeners}
              tabIndex={-1}
              aria-label="Drag to reorder"
            >
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )
        )}

        <button
          onClick={() => {
            onSelect(folder.id);
            if (hasExpandableContent) onToggleExpand(folder.id);
          }}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          {/* Chevron */}
          {hasExpandableContent && !isAllFiles ? (
            <ChevronDown
              className={`w-4 h-4 flex-shrink-0 transition-transform text-muted-foreground ${
                isExpanded ? "" : "-rotate-90"
              }`}
            />
          ) : !isAllFiles ? (
            <span className="w-4 flex-shrink-0" />
          ) : null}

          {/* Icon */}
          {!isAllFiles &&
            (isGallery ? (
              <Images className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            ) : (
              <Folder className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            ))}

          {/* Name */}
          <span className={`truncate ${isActive ? "font-medium" : ""}`}>
            {folder.name}
          </span>
        </button>
      </div>

      {/* Children */}
      {children}
    </div>
  );
}
