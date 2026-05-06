import { cn } from "@/lib/utils";

export type FolderCardState = "default" | "hover" | "bulk-select" | "selected";

interface FolderCardProps {
  name: string;
  galleryCount?: number;
  thumbnailUrl?: string;
  timeAgo?: string;
  isArchived?: boolean;
  state?: FolderCardState;
  onSelect?: () => void;
  onFavorite?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onMoreOptions?: () => void;
  className?: string;
}

export function FolderCard({
  name,
  galleryCount = 0,
  thumbnailUrl,
  timeAgo,
  isArchived = false,
  state = "default",
  onSelect,
  onFavorite,
  onArchive,
  onUnarchive,
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
      className={cn(
        "relative flex flex-col w-[220px] rounded-xl overflow-hidden cursor-pointer group bg-card border shadow-sm hover:shadow-md transition-all hover:border-primary/50",
        isSelected && "ring-2 ring-primary",
        className
      )}
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-[4/3] bg-muted/30 flex items-center justify-center overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center">
            <i className="bi bi-folder text-5xl text-muted-foreground/50" />
          </div>
        )}

        {/* Top Row - Checkbox and Actions */}
        <div className="absolute top-0 left-0 right-0 p-2 flex items-start justify-between">
          {/* Left - Checkbox */}
          <div className="flex items-center">
            {showCheckbox && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.();
                }}
                className="flex items-center justify-center"
              >
                {isChecked ? (
                  <div className="relative w-5 h-5">
                    <div className="absolute inset-[3px] w-[14px] h-[14px] bg-white rounded-full" />
                    <i className="bi bi-check-circle-fill text-primary text-xl absolute inset-0" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/50 bg-background/50" />
                )}
              </button>
            )}
            {!showCheckbox && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.();
                }}
                className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/50 bg-background/50" />
              </button>
            )}
          </div>

          {/* Right - Action Buttons (visible on hover) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Favorite Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite?.();
              }}
              className="w-6 h-6 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors border border-border/50"
            >
              <i className="bi bi-heart text-muted-foreground text-xs" />
            </button>

            {/* Archive/Unarchive Button */}
            {isArchived ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnarchive?.();
                }}
                className="w-6 h-6 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors border border-border/50"
              >
                <i className="bi bi-archive text-muted-foreground text-xs" />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive?.();
                }}
                className="w-6 h-6 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors border border-border/50"
              >
                <i className="bi bi-archive text-muted-foreground text-xs" />
              </button>
            )}

            {/* More Options Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoreOptions?.();
              }}
              className="w-6 h-6 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors border border-border/50"
            >
              <i className="bi bi-three-dots text-muted-foreground text-xs" />
            </button>
          </div>
        </div>

        {/* Archived Badge */}
        {isArchived && (
          <div className="absolute bottom-2 left-2">
            <span className="text-[10px] font-medium text-muted-foreground bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-1">
              <i className="bi bi-archive text-[10px]" />
              Archived
            </span>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Folder Name with Icon */}
        <div className="flex items-center gap-1.5 mb-1">
          <i className="bi bi-folder text-muted-foreground text-sm" />
          <h3 className="font-medium text-sm truncate">{name}</h3>
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{galleryCount} {galleryCount === 1 ? "Gallery" : "Galleries"}</span>
          {timeAgo && <span>{timeAgo}</span>}
        </div>
      </div>
    </div>
  );
}
