import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

export type GalleryCardState = "default" | "hover" | "bulk-select" | "selected" | "empty";

interface GalleryCardProps {
  name: string;
  assetCount?: number;
  /** Number of new assets added to gallery (shows as badge). If not provided, randomized for demo. */
  newAssetCount?: number;
  thumbnailUrl?: string;
  isNew?: boolean;
  timeAgo?: string;
  state?: GalleryCardState;
  onSelect?: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
  onMoreOptions?: () => void;
  className?: string;
}

export function GalleryCard({
  name,
  assetCount = 0,
  newAssetCount,
  thumbnailUrl,
  isNew = false,
  timeAgo,
  state = "default",
  onSelect,
  onFavorite,
  onShare,
  onMoreOptions,
  className,
}: GalleryCardProps) {
  const isDefault = state === "default";
  const isHover = state === "hover";
  const isBulkSelect = state === "bulk-select";
  const isSelected = state === "selected";
  const isEmpty = state === "empty";

  const showCheckbox = isHover || isBulkSelect || isSelected || isEmpty;
  const isChecked = isSelected || isEmpty;

  // Randomize new asset count for demo if not provided (deterministic based on name)
  const displayNewAssetCount = useMemo(() => {
    if (newAssetCount !== undefined) return newAssetCount;
    // Hash the name to get a deterministic "random" value
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    // ~30% chance of having new assets, count between 1-12
    return hash % 3 === 0 ? (hash % 12) + 1 : 0;
  }, [name, newAssetCount]);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full aspect-[16/10] min-w-[200px] rounded-3xl overflow-hidden cursor-pointer group",
        isHover && "shadow-xl",
        className
      )}
    >
      {/* Background Layer */}
      {isEmpty ? (
        <div className="absolute inset-0 bg-gray-600 rounded-3xl" />
      ) : (
        <div className="absolute inset-0">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover rounded-3xl"
            />
          ) : (
            <div className="absolute inset-0 bg-gray-700 rounded-3xl" />
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/36 rounded-3xl" />
        </div>
      )}

      {/* Content Layer */}
      <div className="relative flex flex-col flex-1 w-full p-4 justify-between">
        {/* Top Row - Actions */}
        <div className="flex items-center justify-between">
          {/* Left - Checkbox (shown on hover/bulk/selected/empty) */}
          <div className="flex items-center">
            {showCheckbox && (
              <button
                onClick={onSelect}
                className="flex items-center justify-center"
              >
                {isChecked ? (
                  <div className="relative w-6 h-6">
                    <div className="absolute inset-[4.5px] w-[15px] h-[15px] bg-white rounded-full" />
                    <i className="bi bi-check-circle-fill text-primary text-2xl absolute inset-0" />
                  </div>
                ) : (
                  <i className="bi bi-circle text-white/80 text-2xl" />
                )}
              </button>
            )}
          </div>

          {/* Right - Action Buttons */}
          <div className="flex items-center gap-2">
            {/* New Badge */}
            {isNew && (
              <Badge
                colorStyle="success"
                theme="subtle"
                shape="rounded"
                className="text-[10px] font-medium px-1.5 py-1"
              >
                New
              </Badge>
            )}

            {/* New Asset Count Badge - only shows when there are new assets */}
            {!isEmpty && displayNewAssetCount > 0 && (
              <Badge
                colorStyle="danger"
                theme="subtle"
                shape="rounded"
                className="text-[10px] font-medium px-1.5 py-0.5 min-w-[24px] justify-center"
              >
                {displayNewAssetCount > 99 ? "99+" : displayNewAssetCount}
              </Badge>
            )}

            {/* Favorite Button */}
            <button
              onClick={onFavorite}
              className="w-6 h-6 flex items-center justify-center bg-black/20 rounded-full hover:bg-black/30 transition-colors"
            >
              <i className="bi bi-heart text-white text-xs" />
            </button>

            {/* Share Button */}
            <button
              onClick={onShare}
              className="w-6 h-6 flex items-center justify-center bg-black/20 rounded-full hover:bg-black/30 transition-colors"
            >
              <i className="bi bi-share text-white text-xs" />
            </button>
          </div>
        </div>

        {/* Empty State Icon */}
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-14 bg-white/10 rounded-lg flex items-center justify-center">
              <i className="bi bi-images text-white/60 text-2xl" />
            </div>
          </div>
        )}

        {/* Bottom Row - Gallery Info */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1.5">
            {/* Meta Info Row */}
            <div className="flex items-center gap-1.5 text-white/80 text-[13px]">
              <i className="bi bi-images text-sm" />
              <span>{assetCount}</span>
              {timeAgo && (
                <>
                  <span className="text-white/50">|</span>
                  <i className="bi bi-clock text-sm" />
                  <span>{timeAgo}</span>
                </>
              )}
            </div>

            {/* Gallery Name */}
            <h3 className="text-white text-[15px] font-normal leading-tight truncate max-w-[180px]">
              {name}
            </h3>
          </div>

          {/* More Options Button */}
          <button
            onClick={onMoreOptions}
            className="w-6 h-6 flex items-center justify-center hover:bg-black/20 rounded-full transition-colors"
          >
            <i className="bi bi-three-dots-vertical text-white text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
