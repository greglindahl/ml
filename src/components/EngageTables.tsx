import { useLayoutEffect, useMemo, useRef, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HeadCell, RowActions, TableShell, usePage } from "./ListTable";
import type { VisibilityMap } from "./TableSettingsDrawer";
import { cn } from "@/lib/utils";
import {
  THEME_COLOR_FIELDS,
  campaignSlug,
  type EngageCampaign,
  type EngageTheme,
} from "@/lib/mockEngageData";


// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export const ENGAGE_CAMPAIGN_COLUMNS = [
  { key: "campaign", label: "Campaign" },
  { key: "content", label: "Content" },
  { key: "creator", label: "Creator" },
  { key: "active", label: "Active" },
];

// Prod's Angular `date: 'short'` — e.g. "10/13/26, 5:06 PM".
const shortDateTime = (d: Date) =>
  d.toLocaleString("en-US", { month: "numeric", day: "numeric", year: "2-digit", hour: "numeric", minute: "2-digit" });

/** Prod's gf-line-clamp-view-more: clamps to `lines`, with a View More / View Less toggle only when it overflows. */
function LineClampViewMore({ lines, children }: { lines: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !expanded) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [children, expanded]);
  return (
    <div>
      <div
        ref={ref}
        className="break-words"
        style={expanded ? undefined : { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden" }}
      >
        {children}
      </div>
      {overflows && (
        <button type="button" className="mt-1 inline-flex items-center gap-1 text-primary hover:underline" onClick={() => setExpanded(!expanded)}>
          <i className={cn("bi", expanded ? "bi-dash-circle" : "bi-plus-circle")} />
          {expanded ? "View Less" : "View More"}
        </button>
      )}
    </div>
  );
}

export interface EngageCampaignActions {
  onViewDetails: (c: EngageCampaign) => void;
  onGetEmbedCode: (c: EngageCampaign) => void;
  onEdit: (c: EngageCampaign) => void;
  onExpire: (c: EngageCampaign) => void;
  onDownloadResults: (c: EngageCampaign) => void;
}

export function EngageCampaignsTable({
  campaigns,
  perPage,
  columnVisibility,
  actions,
}: {
  campaigns: EngageCampaign[];
  perPage: number;
  columnVisibility: VisibilityMap;
  actions: EngageCampaignActions;
}) {
  const show = (key: string) => columnVisibility[key] !== false;
  // Prod (campaigns-table): no sortable columns; rows stay in API order, newest first.
  const ordered = useMemo(() => [...campaigns].sort((a, b) => b.created.getTime() - a.created.getTime()), [campaigns]);
  const { page, setPage, paged } = usePage(ordered, perPage);

  return (
    <TableShell pagination={{ page: page, perPage: perPage, total: ordered.length, onPageChange: setPage }}>
      <TableHeader>
        <TableRow className="bg-[#f9fbfd]">
          {/* Prod: one "Campaign" header over the link column and the details column */}
          {show("campaign") && <HeadCell label="Campaign" colSpan={2} />}
          {show("content") && <HeadCell label="Content" />}
          {show("creator") && <HeadCell label="Creator" />}
          {show("active") && <HeadCell label="Active" />}
          <TableHead className="w-[40px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {paged.map((c) => (
          <TableRow key={c.id} className="text-[14px] align-top">
            {show("campaign") && (
              <>
                {/* Column widths are prod's campaigns-table.scss: 12 / 20 / 6 / 10 / 10rem */}
                <TableCell className="align-top w-[12rem]">
                  <a
                    href={c.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1.5 text-primary hover:underline break-words"
                  >
                    <i className="bi bi-box-arrow-up-right mt-0.5" />
                    {campaignSlug(c)}
                  </a>
                </TableCell>
                <TableCell className="align-top w-[20rem]">
                  <LineClampViewMore lines={5}>
                    <h5 className="inline-block text-[15px] font-medium text-[#6e84a3]">{c.content}</h5>
                    <br />
                    {c.instructions}
                  </LineClampViewMore>
                </TableCell>
              </>
            )}
            {show("content") && (
              <TableCell className="align-top whitespace-nowrap w-[6rem]">
                {c.gallery ? (
                  // Prod links to the campaign's gallery
                  <a href={`?gallery=${c.gallery.id}`} className="text-primary hover:underline">
                    {c.totalResponses.toLocaleString()} {c.totalResponses === 1 ? "Asset" : "Assets"}
                  </a>
                ) : (
                  <span className="text-muted-foreground">n/a</span>
                )}
              </TableCell>
            )}
            {show("creator") && <TableCell className="align-top w-[10rem]">{c.createdBy}</TableCell>}
            {show("active") && (
              <TableCell className={cn("align-top w-[10rem]", c.expired && "text-muted-foreground")}>
                {shortDateTime(c.created)}
                {c.expired && c.expires && ` - ${shortDateTime(c.expires)}`}
              </TableCell>
            )}
            <TableCell className="align-top">
              <RowActions
                actions={[
                  { label: "View Details", icon: "bi-list-task", onSelect: () => actions.onViewDetails(c) },
                  // Prod only offers these on live campaigns.
                  ...(c.expired
                    ? []
                    : [
                        { label: "Get Embed Code", icon: "bi-code-slash", onSelect: () => actions.onGetEmbedCode(c) },
                        { label: "Edit Campaign", icon: "bi-pencil-square", onSelect: () => actions.onEdit(c) },
                        { label: "Expire Campaign", icon: "bi-stop-circle", onSelect: () => actions.onExpire(c) },
                      ]),
                  { label: "Download Results", icon: "bi-download", onSelect: () => actions.onDownloadResults(c) },
                ]}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableShell>
  );
}

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

export function ThemeSwatches({ theme, className }: { theme: EngageTheme; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {THEME_COLOR_FIELDS.map((field) => (
        <Tooltip key={field.key}>
          <TooltipTrigger asChild>
            <span
              className="w-6 h-6 rounded-full border border-border shadow-sm"
              style={{ backgroundColor: theme[field.key] }}
              role="img"
              aria-label={`${field.label}: ${theme[field.key]}`}
            />
          </TooltipTrigger>
          <TooltipContent>
            {field.label} · {theme[field.key].toUpperCase()}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

/** Unpaginated, API-order list — prod turns off the header, footer and paging here. */
export function EngageThemesTable({
  themes,
  onEdit,
  onPreview,
  onDelete,
}: {
  themes: EngageTheme[];
  onEdit: (t: EngageTheme) => void;
  onPreview: (t: EngageTheme) => void;
  onDelete: (t: EngageTheme) => void;
}) {
  return (
    <TableShell>
      <TableHeader>
        <TableRow className="bg-[#f9fbfd]">
          <HeadCell label="Name" />
          <HeadCell label="Colors" className="max-md:hidden" />
          <TableHead className="w-[40px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {themes.map((t) => (
          <TableRow key={t.id} className={cn("text-[13px]", t.default && "bg-primary/[0.03]")}>
            <TableCell>
              <div className="flex flex-wrap items-center gap-2">
                <button className="font-medium text-primary hover:underline text-left" onClick={() => onEdit(t)}>
                  {t.name}
                </button>
                {t.default && (
                  <Badge colorStyle="primary" theme="subtle" shape="rounded" className="gap-1 text-[12px] normal-case tracking-normal font-medium">
                    <i className="bi bi-bookmark" />
                    Default Theme
                  </Badge>
                )}
              </div>
              {/* Phones: swatches move under the name, as in prod. */}
              <ThemeSwatches theme={t} className="md:hidden mt-2" />
            </TableCell>
            <TableCell className="max-md:hidden">
              <ThemeSwatches theme={t} />
            </TableCell>
            <TableCell>
              <RowActions
                actions={[
                  { label: "Edit", icon: "bi-pencil", onSelect: () => onEdit(t) },
                  { label: "Preview", icon: "bi-window", onSelect: () => onPreview(t) },
                  { label: "Delete", icon: "bi-trash", onSelect: () => onDelete(t), destructive: true },
                ]}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableShell>
  );
}
