import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { FolderItem } from "@/lib/mockFolderData";
import "bootstrap-icons/font/bootstrap-icons.css";

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

  // Base padding + depth-based indentation (20px per level)
  const baseIndent = 8;
  const depthIndent = 20;
  const getIndentation = (d: number) => {
    if (isAllFiles) return 24;
    return baseIndent + d * depthIndent;
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`group flex items-center gap-1 ${isAllFiles ? "py-2 mx-2 h-10" : "py-2"} text-[13px] rounded-md transition-colors ${
          isActive
            ? "bg-[#d5e5fa] text-[#2c7be5]"
            : "text-[#6e84a3] hover:bg-gray-100"
        } ${isOverValid ? "ring-2 ring-primary bg-primary/10" : ""} ${
          isOverInvalid ? "ring-2 ring-destructive bg-destructive/10" : ""
        } ${isArchived ? "opacity-50" : ""}`}
        style={{ paddingLeft: `${getIndentation(depth)}px`, paddingRight: 8 }}
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
              <GripVertical className="w-3.5 h-3.5 text-[#6e84a3]" />
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
          {/* First slot: Chevron for expandable folders, spacer for others */}
          {isAllFiles ? null : hasExpandableContent ? (
            <i
              className={`bi ${isExpanded ? "bi-chevron-down" : "bi-chevron-right"} text-[16px] w-4 flex-shrink-0 transition-transform`}
            />
          ) : (
            /* Spacer for galleries and folders without children */
            <span className="w-4 flex-shrink-0" />
          )}

          {/* Second slot: Icon */}
          {isAllFiles ? (
            <i className="bi bi-file-earmark text-[16px] flex-shrink-0" />
          ) : isGallery ? (
            <i className="bi bi-images text-[16px] flex-shrink-0" />
          ) : (
            <i className="bi bi-folder text-[16px] flex-shrink-0" />
          )}

          {/* Name */}
          <span className="truncate tracking-[-0.13px]">
            {folder.name}
          </span>
        </button>
      </div>

      {/* Children */}
      {children}
    </div>
  );
}
