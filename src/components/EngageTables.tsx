import { useMemo } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TablePagination } from "./TablePagination";
import { HeadCell, RowActions, SortableHeadCell, TableShell, sortRows, usePage, useSort } from "./ListTable";
import type { VisibilityMap } from "./TableSettingsDrawer";
import { cn } from "@/lib/utils";
import {
  THEME_COLOR_FIELDS,
  campaignSlug,
  type EngageCampaign,
  type EngageTheme,
} from "@/lib/mockEngageData";

const shortDate = (d: Date) => d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" });

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export const ENGAGE_CAMPAIGN_COLUMNS = [
  { key: "campaign", label: "Campaign" },
  { key: "content", label: "Content" },
  { key: "creator", label: "Creator" },
  { key: "active", label: "Active" },
];

type CampaignSortField = "content" | "creator" | "active";

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
  const sort = useSort<CampaignSortField>("active");
  const sorted = useMemo(
    () =>
      sortRows(campaigns, sort.field, sort.direction, (row, field) => {
        switch (field) {
          case "content": return row.totalResponses;
          case "creator": return row.createdBy;
          case "active": return row.created.getTime();
        }
      }),
    [campaigns, sort.field, sort.direction],
  );
  const { page, setPage, paged } = usePage(sorted, perPage);

  return (
    <TableShell footer={<TablePagination page={page} perPage={perPage} total={sorted.length} onPageChange={setPage} />}>
      <TableHeader>
        <TableRow className="bg-[#f9fbfd]">
          {show("campaign") && <HeadCell label="Campaign" />}
          {show("content") && <SortableHeadCell label="Content" field="content" sort={sort} />}
          {show("creator") && <SortableHeadCell label="Creator" field="creator" sort={sort} />}
          {show("active") && <SortableHeadCell label="Active" field="active" sort={sort} />}
          <TableHead className="w-[40px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {paged.map((c) => (
          <TableRow key={c.id} className="text-[13px] align-top">
            {show("campaign") && (
              <TableCell className="min-w-[280px] max-w-[520px]">
                <a
                  href={c.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline text-[12px]"
                >
                  {campaignSlug(c)}
                  <i className="bi bi-box-arrow-up-right text-[10px]" />
                </a>
                <h5 className="text-[14px] font-semibold text-foreground mt-0.5">{c.content}</h5>
                <p className="text-muted-foreground line-clamp-2 mt-0.5">{c.instructions}</p>
              </TableCell>
            )}
            {show("content") && (
              <TableCell className="whitespace-nowrap">
                {c.gallery ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-primary hover:underline">
                        {c.totalResponses} {c.totalResponses === 1 ? "Asset" : "Assets"}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{c.gallery.name}</TooltipContent>
                  </Tooltip>
                ) : (
                  <span className="text-muted-foreground">n/a</span>
                )}
              </TableCell>
            )}
            {show("creator") && <TableCell className="whitespace-nowrap">{c.createdBy}</TableCell>}
            {show("active") && (
              <TableCell className={cn("whitespace-nowrap", c.expired && "text-muted-foreground")}>
                {shortDate(c.created)}
                {c.expired && c.expires && ` - ${shortDate(c.expires)}`}
              </TableCell>
            )}
            <TableCell>
              <RowActions
                actions={[
                  { label: "View Details", icon: "bi-eye", onSelect: () => actions.onViewDetails(c) },
                  // Prod only offers these on live campaigns.
                  ...(c.expired
                    ? []
                    : [
                        { label: "Get Embed Code", icon: "bi-code-slash", onSelect: () => actions.onGetEmbedCode(c) },
                        { label: "Edit Campaign", icon: "bi-pencil", onSelect: () => actions.onEdit(c) },
                        { label: "Expire Campaign", icon: "bi-hourglass-bottom", onSelect: () => actions.onExpire(c), destructive: true },
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
