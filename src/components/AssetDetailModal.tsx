import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import "bootstrap-icons/font/bootstrap-icons.css";
import type { LibraryAsset } from "@/lib/mockLibraryData";

interface AssetDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: LibraryAsset | null;
  /** Current index in the asset list (0-based) */
  currentIndex: number;
  /** Total number of assets in the list */
  totalAssets: number;
  /** Navigate to previous asset */
  onPrevious: () => void;
  /** Navigate to next asset */
  onNext: () => void;
}

export function AssetDetailModal({
  open,
  onOpenChange,
  asset,
  currentIndex,
  totalAssets,
  onPrevious,
  onNext,
}: AssetDetailModalProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onPrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNext();
      }
    },
    [onPrevious, onNext]
  );

  if (!asset) return null;

  const formattedDate = asset.dateCreated.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[1200px] w-[95vw] h-[90vh] max-h-[900px] p-0 gap-0 flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-4 py-3 border-b flex flex-row items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onOpenChange(false)}
          >
            <i className="bi bi-x-lg w-4 h-4 inline-flex items-center justify-center leading-none" />
          </Button>

          <DialogTitle className="sr-only">Asset Details</DialogTitle>
          <DialogDescription className="sr-only">
            View and manage asset details
          </DialogDescription>

          {/* Pagination */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-[13px] text-muted-foreground hover:text-foreground"
              onClick={onPrevious}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>
            <span className="text-[13px] text-muted-foreground px-2">
              {currentIndex + 1} of {totalAssets}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-[13px] text-muted-foreground hover:text-foreground"
              onClick={onNext}
              disabled={currentIndex === totalAssets - 1}
            >
              Next
            </Button>
          </div>

          {/* Action button */}
          <Button variant="outline" size="sm" className="h-8 px-3 gap-2">
            <i className="bi bi-pencil w-3 h-3 inline-flex items-center justify-center leading-none" />
            Edit
          </Button>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Image Preview */}
          <div className="flex-1 bg-black flex items-center justify-center relative min-w-0">
            {asset.thumbnailUrl ? (
              <img
                src={asset.thumbnailUrl}
                alt={asset.name}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center text-gray-500">
                <i className="bi bi-image text-6xl" />
              </div>
            )}

            {/* Crop button overlay */}
            <Button
              variant="default"
              size="icon"
              className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
            >
              <i className="bi bi-crop w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
          </div>

          {/* Details Panel */}
          <div className="w-[320px] flex-shrink-0 border-l bg-background flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">
                    Title
                  </h3>
                  <button className="text-[13px] text-primary hover:underline">
                    Edit Fields
                  </button>
                </div>
                <p className="text-[15px] text-foreground">{asset.name}</p>
              </div>

              {/* Description Section */}
              <div>
                <h3 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Description
                </h3>
                <p className="text-[15px] text-muted-foreground italic">
                  No description added
                </p>
              </div>

              {/* Tags Section */}
              <div>
                <h3 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Tags
                </h3>
                {asset.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {asset.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        colorStyle="primary"
                        theme="soft"
                        shape="rounded"
                        className="text-[13px] normal-case tracking-normal font-normal"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-[15px] text-muted-foreground italic">
                    No tags added
                  </p>
                )}
              </div>

              {/* Galleries Section */}
              <div>
                <h3 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Galleries
                </h3>
                {asset.galleries > 0 ? (
                  <button className="text-[15px] text-primary hover:underline">
                    {asset.galleries} {asset.galleries === 1 ? "gallery" : "galleries"}
                  </button>
                ) : (
                  <p className="text-[15px] text-muted-foreground italic">
                    Not in any galleries
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-3 border-t flex items-center justify-between">
          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <i className="bi bi-download w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <i className="bi bi-share w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <i className="bi bi-heart w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <i className="bi bi-folder-plus w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <i className="bi bi-three-dots w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
            <span>{asset.aspectRatio}</span>
            {asset.dimensions && <span>{asset.dimensions}</span>}
            <span>{asset.fileSize}</span>
            <span>ID: {asset.id.slice(0, 8)}</span>
            <span>
              Uploaded by {asset.creator} on {formattedDate}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
