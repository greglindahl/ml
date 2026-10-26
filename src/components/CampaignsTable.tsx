import { useMemo } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RowActions, SortableHeadCell, TableShell, sortRows, usePage, useSort } from "./ListTable";
import {
  Campaign,
  formatRequestStatus,
  getCampaignRequestSummary,
  getCampaignRequests,
  type CampaignStat,
} from "@/lib/mockCampaignData";
import { SHOW_CAMPAIGN_TYPE_COLUMN, type CampaignsTableColumnKey, type CampaignsTableColumnVisibility } from "./CampaignsSettingsDrawer";

/**
 * Requests › Campaigns. Columns, sorting and row menu follow prod's
 * feature/requests campaigns-page: Name, Type, Flagged, Creator, Created,
 * Total Requests, Completed, Expired, Open. Type is hidden (customer-specific,
 * see SHOW_CAMPAIGN_TYPE_COLUMN). Default sort: Created, newest first.
 * The request counts open a popover of those requests (prod's
 * campaign-table-stats-popover).
 */

interface CampaignsTableProps {
  campaigns: Campaign[];
  /** Opens the campaign's own page (Requests + Details tabs). */
  onOpenCampaign?: (campaignId: string) => void;
  searchQuery?: string;
  perPage?: number;
  columnVisibility?: CampaignsTableColumnVisibility;
}

type SortField = "name" | "type" | "flagged" | "creator" | "created" | "totalRequests" | "completed" | "expired" | "open";

// Prod renders Created with Angular's `date: 'short'`.
const shortDateTime = (d: Date) =>
  d.toLocaleString("en-US", { month: "numeric", day: "numeric", year: "2-digit", hour: "numeric", minute: "2-digit" });

const STAT_LABEL: Record<CampaignStat, string> = {
  TOTAL: "Requests",
  FLAGGED: "Flagged",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
  OPEN: "Open",
};

/** A request count; above zero it opens the list of those requests. */
function StatCount({ campaignId, stat, total }: { campaignId: string; stat: CampaignStat; total: number }) {
  if (!total) return <span className="tabular-nums">0</span>;
  const requests = getCampaignRequests(campaignId, stat);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="tabular-nums text-primary hover:underline">
          {total.toLocaleString()}
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-[280px] p-0 bg-white">
        <p className="px-4 pt-3 pb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
          {STAT_LABEL[stat]} ({total})
        </p>
        <ul className="max-h-[240px] overflow-y-auto pb-2">
          {requests.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-1.5 text-[13px]">
              <span className="truncate text-foreground">{r.name}</span>
              <span className="flex-shrink-0 text-muted-foreground">{formatRequestStatus(r.status)}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function CampaignsTable({ campaigns, onOpenCampaign, searchQuery, perPage = 40, columnVisibility }: CampaignsTableProps) {
  const show = (key: CampaignsTableColumnKey) =>
    (key !== "type" || SHOW_CAMPAIGN_TYPE_COLUMN) && columnVisibility?.[key] !== false;

  const rows = useMemo(() => {
    const q = (searchQuery ?? "").trim().toLowerCase();
    return campaigns
      .filter((c) => !q || [c.name, c.requestType, c.creator.name].some((f) => f.toLowerCase().includes(q)))
      .map((c) => ({ campaign: c, summary: getCampaignRequestSummary(c.id) }));
  }, [campaigns, searchQuery]);

  // Prod's default: Created, newest first.
  const sort = useSort<SortField>("created");
  const sorted = useMemo(
    () =>
      sortRows(rows, sort.field, sort.direction, ({ campaign: c, summary: s }, field) => {
        switch (field) {
          case "name": return c.name.toLowerCase();
          case "type": return c.requestType.toLowerCase();
          case "flagged": return s.FLAGGED;
          case "creator": return c.creator.name.toLowerCase();
          case "created": return c.createdDate.getTime();
          case "totalRequests": return s.TOTAL;
          case "completed": return s.COMPLETED;
          case "expired": return s.EXPIRED;
          case "open": return s.OPEN;
        }
      }),
    [rows, sort.field, sort.direction],
  );
  const { page, setPage, paged } = usePage(sorted, perPage);

  const num = "text-center";
  return (
    <TableShell pagination={{ page, perPage, total: sorted.length, onPageChange: setPage }}>
      <TableHeader>
        <TableRow className="bg-[#f9fbfd]">
          {show("name") && <SortableHeadCell label="Name" field="name" sort={sort} />}
          {show("type") && <SortableHeadCell label="Type" field="type" sort={sort} />}
          {show("flagged") && <SortableHeadCell label="Flagged" field="flagged" sort={sort} className="justify-center" />}
          {show("creator") && <SortableHeadCell label="Creator" field="creator" sort={sort} />}
          {show("created") && <SortableHeadCell label="Created" field="created" sort={sort} />}
          {show("totalRequests") && <SortableHeadCell label="Total Requests" field="totalRequests" sort={sort} className="justify-center whitespace-nowrap" />}
          {show("completed") && <SortableHeadCell label="Completed" field="completed" sort={sort} className="justify-center" />}
          {show("expired") && <SortableHeadCell label="Expired" field="expired" sort={sort} className="justify-center" />}
          {show("open") && <SortableHeadCell label="Open" field="open" sort={sort} className="justify-center" />}
          <TableHead className="w-[40px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {paged.map(({ campaign: c, summary: s }) => (
          <TableRow key={c.id} className="text-[13px]">
            {show("name") && (
              <TableCell className="min-w-[180px]">
                <button type="button" className="text-primary hover:underline text-left font-medium" onClick={() => onOpenCampaign?.(c.id)}>
                  {c.name}
                </button>
              </TableCell>
            )}
            {show("type") && <TableCell className="min-w-[140px]">{c.requestType}</TableCell>}
            {show("flagged") && (
              <TableCell className={num}>
                <StatCount campaignId={c.id} stat="FLAGGED" total={s.FLAGGED} />
              </TableCell>
            )}
            {show("creator") && <TableCell className="whitespace-nowrap">{c.creator.name}</TableCell>}
            {show("created") && <TableCell className="whitespace-nowrap">{shortDateTime(c.createdDate)}</TableCell>}
            {show("totalRequests") && (
              <TableCell className={num}>
                <StatCount campaignId={c.id} stat="TOTAL" total={s.TOTAL} />
              </TableCell>
            )}
            {show("completed") && (
              <TableCell className={num}>
                <StatCount campaignId={c.id} stat="COMPLETED" total={s.COMPLETED} />
              </TableCell>
            )}
            {show("expired") && (
              <TableCell className={num}>
                <StatCount campaignId={c.id} stat="EXPIRED" total={s.EXPIRED} />
              </TableCell>
            )}
            {show("open") && (
              <TableCell className={num}>
                <StatCount campaignId={c.id} stat="OPEN" total={s.OPEN} />
              </TableCell>
            )}
            <TableCell>
              <RowActions
                actions={[
                  { label: "Edit Campaign", icon: "bi-pencil-square", onSelect: () => {} },
                  { label: "Archive Campaign", icon: "bi-archive", onSelect: () => {} },
                  { label: "Delete Campaign", icon: "bi-trash", onSelect: () => {}, destructive: true },
                ]}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableShell>
  );
}
