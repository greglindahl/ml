import { useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import "bootstrap-icons/font/bootstrap-icons.css";
import type { LibraryAsset } from "@/lib/mockLibraryData";
import { formatCaptured, formatInstant, useViewerZone } from "@/lib/captureTime";
import { ViewerZoneToggle } from "@/components/ViewerZoneToggle";
import { ZoneBadge } from "@/components/TableDate";

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

/**
 * Where the captured + uploaded dates live (timestamp design pass, 10/22 call).
 * Prototype-only switch so both can be compared on real assets:
 * - footer: icon-led lines in the footer, captured first (option B)
 * - panel: a Dates section in the details panel (option C)
 */
const SHOW_DETAIL_PROTO_SWITCHES = false;

type DateLayout = "footer" | "panel";
const DATE_LAYOUT_KEY = "proto.assetDetails.dateLayout";
const readDateLayout = (): DateLayout => {
  try {
    return localStorage.getItem(DATE_LAYOUT_KEY) === "panel" ? "panel" : "footer";
  } catch {
    return "footer";
  }
};

function getOrientationLabel(aspectRatio: LibraryAsset["aspectRatio"]) {
  if (aspectRatio === "9:16") return "Portrait";
  if (aspectRatio === "1:1") return "Square";
  return "Landscape";
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
  const [showDetailsPanel, setShowDetailsPanel] = useState(true);
  const [dateLayout, setDateLayoutState] = useState<DateLayout>(readDateLayout);
  const { tz } = useViewerZone();
  const setDateLayout = (next: DateLayout) => {
    setDateLayoutState(next);
    try {
      localStorage.setItem(DATE_LAYOUT_KEY, next);
    } catch {
      // per-viewer convenience only
    }
  };

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

  // Captured = the photographer's wall clock + zone (PORTAL-12970); no recorded
  // zone shows unlabeled with a muted note. Uploaded = the viewer's zone, always
  // labeled, so two correct dates never read as "captured after upload".
  const captured = asset.captureDate ? formatCaptured(asset.captureDate, asset.captureOffsetMinutes) : null;
  const uploaded = formatInstant(asset.dateCreated, tz, false);
  const uploadedZone = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" })
    .formatToParts(asset.dateCreated)
    .find((p) => p.type === "timeZoneName")?.value;
  const capturedLine = captured ? (
    <>
      {captured.date}, {captured.time}{" "}
      {captured.zone ? (
        <ZoneBadge zone={captured.zone} />
      ) : (
        <span className="text-gray-500">(time zone not recorded)</span>
      )}
    </>
  ) : null;
  const uploadedLabel = (
    <>
      {uploaded.full}
      {uploadedZone && <> <ZoneBadge zone={uploadedZone} /></>}
    </>
  );


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[1200px] w-[95vw] h-[90vh] max-h-[900px] p-0 gap-0 flex flex-col bg-gray-100"
        onKeyDown={handleKeyDown}
        hideClose
      >
        {/* Header */}
        <DialogHeader className="relative flex-shrink-0 px-6 py-4 border-b bg-gray-100 flex flex-row items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onOpenChange(false)}
          >
            <i className="bi bi-x-lg w-4 h-4 inline-flex items-center justify-center leading-none" />
          </Button>

          {/* Prototype only: compare date placements */}
          {/* Prototype switches; wide screens only so they never cover the pager.
              Hidden for the PM review — flip SHOW_DETAIL_PROTO_SWITCHES to bring them back. */}
          {SHOW_DETAIL_PROTO_SWITCHES && <div className="hidden lg:flex flex-col items-start gap-1 absolute left-16 top-1/2 -translate-y-1/2">
          <ViewerZoneToggle />
          <div className="flex items-center gap-1 border border-dashed border-muted-foreground/40 rounded-md p-0.5 text-[12px]" role="group" aria-label="Date layout (prototype)">
            <span className="px-1.5 text-muted-foreground">Dates:</span>
            {(["footer", "panel"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setDateLayout(v)}
                aria-pressed={dateLayout === v}
                className={dateLayout === v ? "px-2 py-0.5 rounded bg-white shadow-sm text-foreground" : "px-2 py-0.5 rounded text-muted-foreground hover:text-foreground"}
              >
                {v === "footer" ? "Footer" : "Panel"}
              </button>
            ))}
          </div>
          </div>}

          <DialogTitle className="sr-only">Asset Details</DialogTitle>
          <DialogDescription className="sr-only">
            View and manage asset details
          </DialogDescription>

          {/* Pagination */}
          <div className="inline-flex rounded-lg">
            <Button
              variant="white"
              className="rounded-r-none"
              onClick={onPrevious}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>
            <span className="h-10 px-4 flex items-center justify-center border-y border-[#D2DDEC] bg-white text-[15px] text-foreground tracking-tight">
              {currentIndex + 1} of {totalAssets}
            </span>
            <Button
              variant="white"
              className="rounded-l-none"
              onClick={onNext}
              disabled={currentIndex === totalAssets - 1}
            >
              Next
            </Button>
          </div>

          {/* Toggle Details Button */}
          <button
            onClick={() => setShowDetailsPanel((prev) => !prev)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary hover:bg-primary/90 transition-colors flex-shrink-0"
            aria-label="Toggle details panel"
            aria-pressed={showDetailsPanel}
          >
            <i className="bi bi-list-ul text-white text-base" />
          </button>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 flex gap-6 min-h-0 overflow-hidden p-6">
          {/* Image Preview */}
          <div className="flex-1 bg-black rounded-md flex items-center justify-center relative min-w-0">
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
            <button
              className="absolute bottom-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-primary hover:bg-primary/90 transition-colors"
              aria-label="Crop"
            >
              <i className="bi bi-crop text-white text-base" />
            </button>
          </div>

          {/* Details Panel */}
          {showDetailsPanel && (
            <div className="w-[300px] flex-shrink-0 border border-gray-300 rounded-md bg-white flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Title Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[15px] font-bold text-black tracking-tight">
                      Title
                    </h3>
                    <button className="flex items-center gap-1 text-[15px] text-primary hover:underline">
                      <i className="bi bi-pencil text-sm" />
                      Edit Fields
                    </button>
                  </div>
                  <p className="text-[13px] text-gray-600">{asset.name}</p>
                </div>

                <div className="h-px bg-gray-300" />

                {/* Description Section */}
                <div>
                  <h3 className="text-[15px] font-bold text-black tracking-tight mb-2">
                    Description
                  </h3>
                  <p className="text-[13px] text-gray-600 italic">
                    No description added
                  </p>
                </div>

                <div className="h-px bg-gray-300" />

                {/* Tags Section */}
                <div>
                  <h3 className="text-[15px] font-bold text-black tracking-tight mb-2">
                    Tags
                  </h3>
                  {asset.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {asset.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-[#e5e6eb] text-gray-700 text-[10px] font-medium tracking-tight px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-gray-600 italic">
                      No tags added
                    </p>
                  )}
                </div>

                <div className="h-px bg-gray-300" />

                {/* Galleries Section */}
                <div>
                  <h3 className="text-[15px] font-bold text-black tracking-tight mb-2">
                    Galleries
                  </h3>
                  {asset.galleries > 0 ? (
                    <button className="text-[13px] text-primary hover:underline">
                      {asset.galleries} {asset.galleries === 1 ? "gallery" : "galleries"}
                    </button>
                  ) : (
                    <p className="text-[13px] text-gray-600 italic">
                      Not in any galleries
                    </p>
                  )}
                </div>

                {/* Option C: dates as their own section */}
                {dateLayout === "panel" && (
                  <>
                    <div className="h-px bg-gray-300" />
                    <div>
                      <h3 className="text-[15px] font-bold text-black tracking-tight mb-2">Dates</h3>
                      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[13px]">
                        <dt className="text-gray-600">Captured</dt>
                        <dd className={capturedLine ? "text-black" : "text-gray-500 italic"}>{capturedLine ?? "Unknown"}</dd>
                        <dt className="text-gray-600">Uploaded</dt>
                        <dd className="text-black">
                          {uploadedLabel}
                          <span className="block text-gray-600">by {asset.creator}</span>
                        </dd>
                      </dl>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t bg-gray-100 flex items-end justify-between">
          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button className="h-10 w-10 flex items-center justify-center bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
              <i className="bi bi-download text-base" />
            </button>
            <button className="h-10 w-10 flex items-center justify-center bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
              <i className="bi bi-share text-base" />
            </button>
            <button className="h-10 w-10 flex items-center justify-center bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
              <i className="bi bi-heart text-base" />
            </button>
            <button className="h-10 w-10 flex items-center justify-center bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
              <i className="bi bi-folder-plus text-base" />
            </button>
            <button className="h-10 w-10 flex items-center justify-center hover:bg-gray-200 rounded-md transition-colors">
              <i className="bi bi-three-dots text-base" />
            </button>
          </div>

          {/* Metadata */}
          <div className="flex flex-col items-end gap-2 text-[13px] text-gray-600">
            <div className="flex items-center gap-1.5">
              <i className="bi bi-aspect-ratio text-[15px] text-gray-600" aria-hidden="true" />
              <span>
                {getOrientationLabel(asset.aspectRatio)} | {asset.aspectRatio} | {asset.fileSize} | Asset ID: {asset.id}
              </span>
            </div>
            {/* Option B: icon-led lines, captured first. In panel mode the dates live in the panel instead. */}
            {dateLayout === "footer" && (
              <>
                <span className="flex items-center gap-1.5 text-black">
                  <i className="bi bi-camera text-[15px] text-gray-600" aria-hidden="true" />
                  {capturedLine ? <span>Captured {capturedLine}</span> : <span className="text-gray-500">Capture date unknown</span>}
                </span>
                <span className="flex items-center gap-1.5 text-black">
                  <i className="bi bi-cloud-arrow-up text-[15px] text-gray-600" aria-hidden="true" />
                  Uploaded by {asset.creator} · {uploadedLabel}
                </span>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
