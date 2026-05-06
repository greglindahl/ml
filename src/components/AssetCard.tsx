import { cn } from "@/lib/utils";

export type AssetCardState = "default" | "hover" | "bulk-select" | "selected";

interface AssetCardProps {
  name: string;
  creator: string;
  type: "image" | "video";
  thumbnailUrl?: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3";
  duration?: string;
  tag?: string;
  timeAgo?: string;
  isBranded?: boolean;
  state?: AssetCardState;
  onSelect?: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  onMoreOptions?: () => void;
  className?: string;
}

export function AssetCard({
  name,
  creator,
  type,
  thumbnailUrl,
  aspectRatio,
  duration,
  tag,
  timeAgo,
  isBranded = false,
  state = "default",
  onSelect,
  onFavorite,
  onShare,
  onDownload,
  onMoreOptions,
  className,
}: AssetCardProps) {
  const isDefault = state === "default";
  const isHover = state === "hover";
  const isBulkSelect = state === "bulk-select";
  const isSelected = state === "selected";

  const showCheckbox = isHover || isBulkSelect || isSelected;
  const isChecked = isSelected;

  return (
    <div
      className={cn(
        "relative flex flex-col w-[200px] rounded-xl overflow-hidden cursor-pointer group bg-card border shadow-sm hover:shadow-md transition-shadow",
        isSelected && "ring-2 ring-primary",
        className
      )}
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-[4/3] bg-muted/50 flex items-center justify-center overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center">
            {type === "video" ? (
              <i className="bi bi-play-circle text-4xl text-muted-foreground/40" />
            ) : (
              <i className="bi bi-image text-4xl text-muted-foreground/40" />
            )}
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
                  <div className="w-5 h-5 rounded-full border-2 border-white/80 bg-black/20" />
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
                <div className="w-5 h-5 rounded-full border-2 border-white/80 bg-black/20" />
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
              className="w-6 h-6 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-colors"
            >
              <i className="bi bi-heart text-white text-xs" />
            </button>

            {/* Download Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload?.();
              }}
              className="w-6 h-6 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-colors"
            >
              <i className="bi bi-download text-white text-xs" />
            </button>

            {/* More Options Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoreOptions?.();
              }}
              className="w-6 h-6 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-colors"
            >
              <i className="bi bi-three-dots text-white text-xs" />
            </button>
          </div>
        </div>

        {/* Branded Badge (top right, below action buttons when not hovering) */}
        {isBranded && (
          <div className="absolute top-2 right-2 group-hover:opacity-0 transition-opacity">
            <div className="w-6 h-6 flex items-center justify-center bg-primary/90 rounded-full">
              <i className="bi bi-palette text-white text-xs" />
            </div>
          </div>
        )}

        {/* Bottom Row - Metadata Badges */}
        <div className="absolute bottom-0 left-0 right-0 p-2 flex items-end justify-between">
          {/* Left - Duration (for videos) */}
          <div>
            {duration && (
              <span className="text-[10px] font-medium text-white bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
                {duration}
              </span>
            )}
          </div>

          {/* Right - Aspect Ratio and Type */}
          <div className="flex items-center gap-1">
            {aspectRatio && (
              <span className="text-[10px] font-medium text-muted-foreground bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded">
                {aspectRatio}
              </span>
            )}
            <span className="text-[10px] font-medium text-muted-foreground bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded uppercase">
              {type}
            </span>
          </div>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Asset Name */}
        <h3 className="font-medium text-sm truncate mb-1">{name}</h3>

        {/* Creator and Meta */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">
              {creator}
            </div>
            {tag && (
              <div className="text-xs text-primary truncate">
                {tag}
              </div>
            )}
          </div>
          {timeAgo && (
            <span className="text-xs text-primary flex-shrink-0">
              {timeAgo}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
