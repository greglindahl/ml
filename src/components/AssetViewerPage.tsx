import { useEffect, useMemo, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { mockGalleries } from "@/lib/mockFolderData";
import type { LibraryAsset } from "@/lib/mockLibraryData";

/**
 * Full-page asset viewer (redesign direction: Greg's "Modal Details Ideation").
 * Prototype scope: opens for one asset in All Assets and stays on for the
 * session's Previous/Next; every other entry point keeps AssetDetailModal.
 *
 * - Header: title, Asset ID with copy (support asks for it), pager, actions.
 * - Details row under the media: Description, Tags, Galleries, File (with the
 *   captured/uploaded date lines), History & Raw Data.
 * - Right panel: collaboration for every user, not just workflow reviewers.
 *   No workflow on this asset, so it's comments only (no review card).
 */

const TAG_LIMIT = 6;
const GALLERY_LIMIT = 2;
const COMMENT_MAX = 200;

const formatDateTime = (d: Date) =>
  `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

const orientationLabel = (r: LibraryAsset["aspectRatio"]) => (r === "9:16" ? "Portrait" : r === "1:1" ? "Square" : "Landscape");

/** Same picsum seed, larger render: the grid thumbnail is 400×300. */
const largeImage = (url?: string) => url?.replace(/\/\d+\/\d+$/, "/1600/1000");

interface Comment {
  id: string;
  author: string;
  initials: string;
  text: string;
  at: Date;
}

function IconButton({ label, icon, onClick, active, className }: { label: string; icon: string; onClick?: () => void; active?: boolean; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          aria-pressed={active}
          className={cn("w-10 h-10 inline-flex items-center justify-center rounded-md border bg-white text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", className)}
        >
          <i className={cn("bi text-[16px]", icon)} aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">{children}</h3>
);

export function AssetViewerPage({
  open,
  onOpenChange,
  asset,
  currentIndex,
  totalAssets,
  onPrevious,
  onNext,
  isFavorite,
  onToggleFavorite,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: LibraryAsset | null;
  currentIndex: number;
  totalAssets: number;
  onPrevious: () => void;
  onNext: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [commentsByAsset, setCommentsByAsset] = useState<Record<string, Comment[]>>({});
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setCopied(false);
    setDraft("");
  }, [asset?.id]);

  // Galleries this asset sits in: a stable slice of the mock list, sized by its count.
  const galleryNames = useMemo(() => {
    if (!asset) return [];
    const start = asset.id.length % Math.max(1, mockGalleries.length);
    return Array.from({ length: Math.min(asset.galleries, mockGalleries.length) }, (_, i) => mockGalleries[(start + i) % mockGalleries.length].name);
  }, [asset]);

  if (!asset) return null;

  const comments = commentsByAsset[asset.id] ?? [];
  const extraTags = asset.tags.length - TAG_LIMIT;
  const extraGalleries = asset.galleries - GALLERY_LIMIT;

  const copyId = () => {
    navigator.clipboard?.writeText(asset.id).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const postComment = () => {
    const text = draft.trim();
    if (!text) return;
    setCommentsByAsset((prev) => ({
      ...prev,
      [asset.id]: [...(prev[asset.id] ?? []), { id: `c-${Date.now()}`, author: "You", initials: "ME", text, at: new Date() }],
    }));
    setDraft("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const typing = (e.target as HTMLElement).closest("textarea, input");
    if (typing) return;
    if (e.key === "ArrowLeft" && currentIndex > 0) onPrevious();
    if (e.key === "ArrowRight" && currentIndex < totalAssets - 1) onNext();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        onKeyDown={onKeyDown}
        className="max-w-none w-screen h-[100dvh] max-h-none p-0 gap-0 rounded-none sm:rounded-none border-0 bg-[#f9fbfd] flex flex-col"
      >
        <DialogDescription className="sr-only">Asset details, file information and comments</DialogDescription>

        {/* Header */}
        <header className="flex-shrink-0 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 lg:px-10 py-3 border-b bg-white">
          <div className="min-w-0">
            <DialogTitle className="text-[17px] font-semibold text-foreground truncate leading-snug">{asset.name}</DialogTitle>
            <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              Asset ID {asset.id}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={copyId}
                    aria-label={copied ? "Asset ID copied" : "Copy asset ID"}
                    className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <i className={cn("bi text-[13px]", copied ? "bi-check2 text-[#00A862]" : "bi-copy")} aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{copied ? "Copied" : "Copy asset ID"}</TooltipContent>
              </Tooltip>
              <span className="sr-only" aria-live="polite">{copied ? "Asset ID copied" : ""}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-3">
              <button
                type="button"
                onClick={onPrevious}
                disabled={currentIndex <= 0}
                aria-label="Previous asset"
                className="w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <i className="bi bi-chevron-left" aria-hidden="true" />
              </button>
              <span className="text-[15px] text-foreground tabular-nums px-2 whitespace-nowrap">
                {currentIndex + 1} of {totalAssets}
              </span>
              <button
                type="button"
                onClick={onNext}
                disabled={currentIndex >= totalAssets - 1}
                aria-label="Next asset"
                className="w-9 h-9 inline-flex items-center justify-center rounded-md hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <i className="bi bi-chevron-right" aria-hidden="true" />
              </button>
            </div>
            <IconButton
              label={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              icon={isFavorite ? "bi-heart-fill text-[#E63757]" : "bi-heart"}
              onClick={onToggleFavorite}
              active={isFavorite}
            />
            {/* Phones: these fold into More so the header fits */}
            <IconButton label="Download" icon="bi-download" className="hidden sm:inline-flex" />
            <IconButton label="Add to Gallery" icon="bi-folder-plus" className="hidden sm:inline-flex" />
            <IconButton label="Share" icon="bi-share" className="hidden sm:inline-flex" />
            <IconButton label="More actions" icon="bi-three-dots-vertical" />
            <IconButton label="Close" icon="bi-x-lg" onClick={() => onOpenChange(false)} />
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid gap-6 px-6 lg:px-10 py-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:h-full">
            {/* Media + details */}
            <div className="flex flex-col gap-6 min-w-0 lg:min-h-0">
              <div className="relative flex-1 min-h-[320px] rounded-xl bg-[#12263F] flex items-center justify-center overflow-hidden">
                {asset.thumbnailUrl ? (
                  <img src={largeImage(asset.thumbnailUrl)} alt={asset.name} className="max-w-full max-h-full object-contain" />
                ) : (
                  <i className="bi bi-image text-6xl text-white/30" aria-hidden="true" />
                )}
                <button
                  type="button"
                  aria-label="Crop"
                  className="absolute bottom-5 right-5 w-11 h-11 inline-flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90"
                >
                  <i className="bi bi-crop" aria-hidden="true" />
                </button>
              </div>

              <section className="flex-shrink-0 border rounded-xl bg-white p-6" aria-label="Details">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[17px] font-semibold text-foreground">Details</h2>
                  <button type="button" className="inline-flex items-center gap-1.5 text-[15px] text-primary hover:underline">
                    <i className="bi bi-pencil-square" aria-hidden="true" />
                    Edit Fields
                  </button>
                </div>

                {/* File gets the most room: its date lines are the longest. */}
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto]">
                  <div>
                    <SectionLabel>Description</SectionLabel>
                    <p className="text-[15px] text-muted-foreground italic">No description added</p>
                  </div>

                  <div>
                    <SectionLabel>Tags ({asset.tags.length})</SectionLabel>
                    {asset.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {asset.tags.slice(0, TAG_LIMIT).map((tag) => (
                          <span key={tag} className="rounded-md bg-[#EDF2F9] px-2.5 py-1 text-[13px] text-foreground">
                            {tag}
                          </span>
                        ))}
                        {extraTags > 0 && (
                          <button type="button" className="rounded-md border border-primary/40 px-2.5 py-1 text-[13px] text-primary hover:bg-primary/5">
                            +{extraTags} more
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-[15px] text-muted-foreground italic">No tags added</p>
                    )}
                  </div>

                  <div>
                    <SectionLabel>Galleries ({asset.galleries})</SectionLabel>
                    {galleryNames.length > 0 ? (
                      <ul className="space-y-2">
                        {galleryNames.slice(0, GALLERY_LIMIT).map((name) => (
                          <li key={name}>
                            <button type="button" className="inline-flex items-center gap-2 text-[15px] text-primary hover:underline text-left">
                              <i className="bi bi-images text-muted-foreground" aria-hidden="true" />
                              {name}
                            </button>
                          </li>
                        ))}
                        {extraGalleries > 0 && (
                          <li>
                            <button type="button" className="rounded-md border border-primary/40 px-2.5 py-1 text-[13px] text-primary hover:bg-primary/5">
                              +{extraGalleries} more
                            </button>
                          </li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-[15px] text-muted-foreground italic">Not in any galleries</p>
                    )}
                  </div>

                  {/* File: the date lines from the asset details quick win, in the table's date format */}
                  <div>
                    <SectionLabel>File</SectionLabel>
                    <div className="space-y-2 text-[15px] text-foreground">
                      <p className="flex items-center gap-2">
                        <i className="bi bi-aspect-ratio text-muted-foreground" aria-hidden="true" />
                        {orientationLabel(asset.aspectRatio)} · {asset.aspectRatio} · {asset.fileSize}
                      </p>
                      <p className="flex items-start gap-2">
                        <i className="bi bi-camera text-muted-foreground mt-0.5" aria-hidden="true" />
                        <span>
                          Captured {asset.captureDate ? formatDateTime(asset.captureDate) : <span className="text-muted-foreground">unknown</span>}
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <i className="bi bi-cloud-arrow-up text-muted-foreground mt-0.5" aria-hidden="true" />
                        <span>
                          Uploaded {formatDateTime(asset.dateCreated)}
                          <span className="block text-[13px] text-muted-foreground">by {asset.creator}</span>
                        </span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <SectionLabel>History &amp; Raw Data</SectionLabel>
                    <div className="flex flex-col items-start gap-2">
                      <button type="button" className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-[15px] hover:bg-accent">
                        <i className="bi bi-clock-history text-muted-foreground" aria-hidden="true" />
                        Lifecycle
                      </button>
                      <button type="button" className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-[15px] hover:bg-accent">
                        <i className="bi bi-file-earmark-text text-muted-foreground" aria-hidden="true" />
                        IPTC metadata
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Collaboration: for everyone. Not in a workflow, so comments only (no review card). */}
            <aside className="border rounded-xl bg-white flex flex-col min-h-[420px] lg:min-h-0" aria-label="Comments">
              <div className="px-6 pt-6 pb-4 border-b">
                <h2 className="text-[17px] font-semibold text-foreground">
                  Comments{comments.length > 0 && <span className="text-muted-foreground font-normal"> ({comments.length})</span>}
                </h2>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
                {comments.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10">
                    <i className="bi bi-chat-left-text text-4xl text-muted-foreground/40 mb-3" aria-hidden="true" />
                    <p className="text-[15px] font-medium text-foreground">No comments yet</p>
                    <p className="text-[13px] text-muted-foreground mt-1">@mention someone to start a conversation about this asset.</p>
                  </div>
                ) : (
                  <ul className="space-y-4" aria-live="polite">
                    {comments.map((c) => (
                      <li key={c.id} className="flex gap-3">
                        <span className="w-8 h-8 flex-shrink-0 rounded-full bg-primary/10 text-primary text-[11px] font-semibold inline-flex items-center justify-center">
                          {c.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px]">
                            <span className="font-semibold text-foreground">{c.author}</span>{" "}
                            <span className="text-muted-foreground">{formatDateTime(c.at)}</span>
                          </p>
                          <p className="text-[15px] text-foreground break-words">{c.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t px-6 py-4">
                <div className="flex items-end gap-2">
                  <label htmlFor="asset-comment" className="sr-only">
                    Add a comment
                  </label>
                  <textarea
                    id="asset-comment"
                    value={draft}
                    maxLength={COMMENT_MAX}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        postComment();
                      }
                    }}
                    rows={3}
                    placeholder="Add a comment"
                    className="flex-1 resize-none rounded-md border bg-white px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={postComment}
                    disabled={!draft.trim()}
                    aria-label="Post comment"
                    className="w-11 h-11 inline-flex items-center justify-center rounded-md border bg-white text-primary hover:bg-accent disabled:text-muted-foreground disabled:hover:bg-white"
                  >
                    <i className="bi bi-send" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex justify-between mt-1.5 text-[13px] text-muted-foreground">
                  <span>@ to mention</span>
                  <span className="tabular-nums">{COMMENT_MAX - draft.length}</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
