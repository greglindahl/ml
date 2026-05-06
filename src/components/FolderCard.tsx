import { cn } from "@/lib/utils";

export type FolderCardState = "default" | "hover" | "bulk-select" | "selected";

interface FolderCardProps {
  name: string;
  galleryCount?: number;
  isNew?: boolean;
  state?: FolderCardState;
  onSelect?: () => void;
  onMoreOptions?: () => void;
  className?: string;
}

export function FolderCard({
  name,
  galleryCount = 0,
  isNew = false,
  state = "default",
  onSelect,
  onMoreOptions,
  className,
}: FolderCardProps) {
  const isDefault = state === "default";
  const isHover = state === "hover";
  const isBulkSelect = state === "bulk-select";
  const isSelected = state === "selected";

  const showCheckbox = isHover || isBulkSelect || isSelected;
  const isChecked = isSelected;

  return (
    <div
      onClick={() => onSelect?.()}
      className={cn(
        "relative flex flex-col w-full aspect-[4/3] min-w-[200px] rounded-[24px] overflow-hidden cursor-pointer",
        "bg-gray-200 border border-gray-300",
        isHover && "shadow-[0_20px_40px_rgba(18,38,63,0.08)]",
        className
      )}
    >
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center pt-3 px-4 relative">
        {/* Top Row - Checkbox and New Badge */}
        <div className={cn(
          "absolute top-3 left-4 right-4 flex items-center",
          showCheckbox ? "justify-between" : "justify-end"
        )}>
          {/* Left - Checkbox */}
          {showCheckbox && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.();
              }}
              className="flex items-center justify-center"
            >
              {isChecked ? (
                <div className="relative w-6 h-6">
                  <div className="absolute inset-[4.5px] w-[15px] h-[15px] bg-white rounded-full" />
                  <i className="bi bi-check-circle-fill text-primary text-2xl absolute inset-0" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-gray-500 bg-transparent" />
              )}
            </button>
          )}

          {/* Right - New Badge */}
          {isNew && (
            <span className="text-[10px] font-medium text-success">
              New
            </span>
          )}
        </div>

        {/* Folder Icon - Centered */}
        <i className="bi bi-folder text-[56px] text-gray-600" />
      </div>

      {/* Footer */}
      <div className="h-14 bg-white/70 border-t border-white/50 px-4 flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Folder Name */}
            <span className="text-[15px] text-black font-normal leading-[1.2] tracking-tight truncate">
              {name}
            </span>

            {/* Gallery Count */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <i className="bi bi-images text-gray-700 text-sm" />
              <span className="text-[13px] text-gray-700 font-normal leading-[1.25] tracking-tight">
                {galleryCount}
              </span>
            </div>
          </div>

          {/* More Options Button - always visible */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoreOptions?.();
            }}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-400 hover:bg-gray-300/50 transition-colors flex-shrink-0 ml-2"
          >
            <i className="bi bi-three-dots-vertical text-gray-600 text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
