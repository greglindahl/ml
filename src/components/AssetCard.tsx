import { cn } from "@/lib/utils";

export type AssetCardState =
  | "default"
  | "hover"
  | "bulk-select"
  | "selected"
  | "approved"
  | "rejected"
  | "commented";

interface AssetCardProps {
  creatorName: string;
  timestamp?: string;
  thumbnailUrl?: string;
  duration?: string;
  isNew?: boolean;
  isBranded?: boolean;
  isRequested?: boolean;
  hasComment?: boolean;
  state?: AssetCardState;
  onSelect?: () => void;
  onFavorite?: () => void;
  onComment?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  className?: string;
}

export function AssetCard({
  creatorName,
  timestamp = "1/14/26, 1:56 PM",
  thumbnailUrl,
  duration,
  isNew = false,
  isBranded = false,
  isRequested = false,
  hasComment = false,
  state = "default",
  onSelect,
  onFavorite,
  onComment,
  onApprove,
  onReject,
  className,
}: AssetCardProps) {
  const isDefault = state === "default";
  const isHover = state === "hover";
  const isBulkSelect = state === "bulk-select";
  const isSelected = state === "selected";
  const isApproved = state === "approved";
  const isRejected = state === "rejected";
  const isCommented = state === "commented";

  const isSelectionState = isHover || isBulkSelect || isSelected;
  const isReviewState = isApproved || isRejected || isCommented;
  const showCheckbox = isSelectionState || isSelected;
  const isChecked = isSelected;

  return (
    <div
      className={cn(
        "relative flex flex-col w-full aspect-[5/6] min-w-[160px] rounded-[24px] overflow-hidden cursor-pointer group",
        isHover && "shadow-[0_32px_32px_rgba(18,38,63,0.12)]",
        className
      )}
    >
      {/* Full-bleed Image with Gradient Overlay */}
      <div className="absolute inset-0">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={creatorName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
            <i className="bi bi-image text-4xl text-gray-500" />
          </div>
        )}
        {/* Gradient overlay - from black at bottom to transparent at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/36" />
      </div>

      {/* Content Layer */}
      <div className="relative flex flex-col flex-1 p-4 justify-between">
        {/* Top Row */}
        <div className={cn(
          "flex items-center",
          isSelectionState ? "justify-between" : "justify-end gap-2"
        )}>
          {/* Left - Checkbox (selection states) or Selected indicator (review states with selected) */}
          {isSelectionState && (
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
                <div className="w-6 h-6 rounded-full border-2 border-white/60 bg-transparent" />
              )}
            </button>
          )}

          {/* Default state - just favorite button on right */}
          {isDefault && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite?.();
              }}
              className="w-6 h-6 flex items-center justify-center bg-black/20 rounded-full"
            >
              <i className="bi bi-heart-fill text-white text-[8px]" />
            </button>
          )}

          {/* Hover state - checkbox on left, favorite on right */}
          {isHover && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite?.();
              }}
              className="w-6 h-6 flex items-center justify-center bg-black/20 rounded-full"
            >
              <i className="bi bi-heart-fill text-white text-[8px]" />
            </button>
          )}

          {/* Bulk Select / Selected - checkbox on left, favorite on right */}
          {(isBulkSelect || isSelected) && (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite?.();
                }}
                className="w-6 h-6 flex items-center justify-center bg-black/20 rounded-full"
              >
                <i className="bi bi-heart-fill text-white text-[8px]" />
              </button>
            </div>
          )}

          {/* Review states - New badge + favorite if applicable */}
          {isReviewState && (
            <div className="flex items-center gap-2">
              {isNew && (
                <span className="text-[10px] font-medium text-[#0d7333] bg-[#d9f7e5] px-1.5 py-1 rounded-full tracking-tight">
                  New
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite?.();
                }}
                className="w-6 h-6 flex items-center justify-center bg-black/20 rounded-full"
              >
                <i className="bi bi-heart-fill text-white text-[8px]" />
              </button>
            </div>
          )}
        </div>

        {/* Video Duration Badge - Top Right Area */}
        {duration && (
          <div className="absolute top-4 right-12 flex items-center gap-1 text-white text-xs">
            <i className="bi bi-play-fill text-[10px]" />
            <span>{duration}</span>
          </div>
        )}

        {/* New Badge - for non-review states */}
        {isNew && !isReviewState && (
          <div className="absolute top-4 left-4">
            <span className="text-[10px] font-medium text-[#0d7333] bg-[#d9f7e5] px-1.5 py-1 rounded-full tracking-tight">
              New
            </span>
          </div>
        )}

        {/* Bottom Content */}
        <div className="flex flex-col gap-1.5">
          {/* Action buttons row for review states */}
          {isApproved && (
            <div className="flex items-center gap-1.5">
              {hasComment && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComment?.();
                  }}
                  className="w-6 h-6 flex items-center justify-center bg-black/20 rounded-full"
                >
                  <i className="bi bi-chat-fill text-white text-[10px]" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove?.();
                }}
                className="w-6 h-6 flex items-center justify-center bg-black/20 rounded-full"
              >
                <i className="bi bi-check-lg text-[#00D97E] text-sm" />
              </button>
              {isBranded && (
                <button className="w-6 h-6 flex items-center justify-center bg-black/20 rounded-full">
                  <i className="bi bi-palette-fill text-white text-[10px]" />
                </button>
              )}
              {isRequested && (
                <span className="text-[10px] font-medium text-[#8c1a2b] bg-[#fae3e8] px-1.5 py-1 rounded-full tracking-tight flex items-center gap-1">
                  <i className="bi bi-exclamation-circle-fill text-[8px]" />
                  Requested
                </span>
              )}
            </div>
          )}

          {isRejected && (
            <div className="flex items-center gap-1.5">
              {hasComment && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComment?.();
                  }}
                  className="w-6 h-6 flex items-center justify-center bg-black/20 rounded-full"
                >
                  <i className="bi bi-chat-fill text-white text-[10px]" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReject?.();
                }}
                className="w-6 h-6 flex items-center justify-center bg-black/20 rounded-full"
              >
                <i className="bi bi-x-lg text-danger text-sm" />
              </button>
              {isBranded && (
                <button className="w-6 h-6 flex items-center justify-center bg-black/20 rounded-full">
                  <i className="bi bi-palette-fill text-white text-[10px]" />
                </button>
              )}
              {isRequested && (
                <span className="text-[10px] font-medium text-[#8c1a2b] bg-[#fae3e8] px-1.5 py-1 rounded-full tracking-tight flex items-center gap-1">
                  <i className="bi bi-exclamation-circle-fill text-[8px]" />
                  Requested
                </span>
              )}
            </div>
          )}

          {isCommented && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComment?.();
                }}
                className="w-6 h-6 flex items-center justify-center bg-black/20 rounded-full"
              >
                <i className="bi bi-chat-fill text-info text-[10px]" />
              </button>
              {isBranded && (
                <button className="w-6 h-6 flex items-center justify-center bg-black/20 rounded-full">
                  <i className="bi bi-palette-fill text-white text-[10px]" />
                </button>
              )}
              {isRequested && (
                <span className="text-[10px] font-medium text-[#8c1a2b] bg-[#fae3e8] px-1.5 py-1 rounded-full tracking-tight flex items-center gap-1">
                  <i className="bi bi-exclamation-circle-fill text-[8px]" />
                  Requested
                </span>
              )}
            </div>
          )}

          {/* Branding indicator for non-review states */}
          {!isReviewState && isBranded && (
            <div className="flex items-center gap-1.5">
              <button className="w-6 h-6 flex items-center justify-center bg-black/20 rounded-full">
                <i className="bi bi-palette-fill text-white text-[10px]" />
              </button>
              {isRequested && (
                <span className="text-[10px] font-medium text-[#8c1a2b] bg-[#fae3e8] px-1.5 py-1 rounded-full tracking-tight flex items-center gap-1">
                  <i className="bi bi-exclamation-circle-fill text-[8px]" />
                  Requested
                </span>
              )}
            </div>
          )}

          {/* Creator Name */}
          <p className="text-[15px] text-white font-normal leading-[1.2] tracking-tight">
            {creatorName}
          </p>

          {/* Timestamp */}
          <p className="text-[13px] text-white/80 font-normal leading-[1.25] tracking-tight">
            {timestamp}
          </p>
        </div>
      </div>
    </div>
  );
}
