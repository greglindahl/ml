import { useMemo } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { ListToolbar, type ListControls } from "./ListToolbar";
import { matchesFilter, type ListFilterDef } from "./ListFilters";
import { HEAD_TEXT, SortableHeadCell, TableShell, sortRows, usePage, useSort } from "./ListTable";
import { TablePagination } from "./TablePagination";
import { StatTile } from "./InsightsShared";
import { cn } from "@/lib/utils";
import { getUniqueUserGroups, getUniqueUserRoles, mockUsers } from "@/lib/mockUserData";
import { formatNumber, getUserMetrics, getUsersTiles, type InsightsRange, type UserMetricsRow } from "@/lib/mockInsightsData";

type MetricKey = Exclude<keyof UserMetricsRow, "user">;
type SortField = "name" | MetricKey;

interface ColumnGroup {
  key: string;
  label: string;
  columns: { key: MetricKey; label: string; pct?: boolean }[];
}

/** Prod's column groups, in order. Each is one "Manage Columns" toggle — prod's show/hide buttons. */
const COLUMN_GROUPS: ColumnGroup[] = [
  {
    key: "universal",
    label: "Universal Metrics",
    columns: [
      { key: "downloads", label: "Downloads" },
      { key: "shares", label: "Shares" },
      { key: "uploads", label: "Uploads" },
      { key: "views", label: "Views" },
    ],
  },
  {
    key: "shareRequests",
    label: "Share Requests",
    columns: [
      { key: "shareRequestsSent", label: "Sent" },
      { key: "shareRequestsFulfilled", label: "Fulfilled" },
      { key: "shareRequestPct", label: "% Ratio", pct: true },
    ],
  },
  {
    key: "contentRequests",
    label: "Content Requests",
    columns: [
      { key: "contentRequestsSent", label: "Sent" },
      { key: "contentRequestsFulfilled", label: "Fulfilled" },
      { key: "contentRequestPct", label: "% Ratio", pct: true },
    ],
  },
  {
    key: "galleries",
    label: "Galleries",
    columns: [
      { key: "galleriesShared", label: "Shared" },
      { key: "galleryAssets", label: "Assets" },
      { key: "galleryViews", label: "Views" },
      { key: "galleryDownloads", label: "Downloads" },
      { key: "galleryShares", label: "Shares" },
    ],
  },
];

export const USERS_COLUMN_SETTINGS = COLUMN_GROUPS.map((g) => ({ key: g.key, label: g.label }));

export const USERS_FILTERS: ListFilterDef[] = [
  {
    id: "users",
    label: "Users",
    icon: "bi-person",
    searchable: true,
    options: [...mockUsers].sort((a, b) => a.name.localeCompare(b.name)).map((u) => ({ value: u.id, label: u.name })),
  },
  {
    id: "groups",
    label: "Groups",
    icon: "bi-people",
    searchable: true,
    options: getUniqueUserGroups().map((g) => ({ value: g.id, label: g.name })),
  },
  { id: "role", label: "Role", icon: "bi-person-badge", multi: false, options: getUniqueUserRoles().map((r) => ({ value: r, label: r })) },
];
export const USERS_FILTER_SETTINGS = USERS_FILTERS.map((f) => ({ key: f.id, label: f.label }));

function filterUserRows(rows: UserMetricsRow[], { search, filters }: Pick<ListControls, "search" | "filters">) {
  const q = search.trim().toLowerCase();
  return rows.filter(
    (r) =>
      (!q || r.user.name.toLowerCase().includes(q) || r.user.email.toLowerCase().includes(q)) &&
      matchesFilter(filters, "users", r.user.id) &&
      matchesFilter(filters, "groups", r.user.groups.map((g) => g.id)) &&
      matchesFilter(filters, "role", r.user.role),
  );
}

const fmt = (value: number | null, pct?: boolean) => (value === null ? "—" : pct ? `${value}%` : formatNumber(value));

export function InsightsUsers({ range, controls }: { range: InsightsRange; controls: ListControls }) {
  const tiles = useMemo(() => getUsersTiles(range), [range]);
  const all = useMemo(() => getUserMetrics(range), [range]);
  const { search, filters } = controls;
  const rows = useMemo(() => filterUserRows(all, { search, filters }), [all, search, filters]);

  // Prod default: DOWNLOADS_DESC.
  const sort = useSort<SortField>("downloads");
  const sorted = useMemo(
    () => sortRows(rows, sort.field, sort.direction, (row, field) => (field === "name" ? row.user.name : row[field])),
    [rows, sort.field, sort.direction],
  );
  const { page, setPage, paged } = usePage(sorted, controls.perPage);
  const groups = COLUMN_GROUPS.filter((g) => controls.columnVisibility[g.key] !== false);

  return (
    <div className="flex flex-col gap-4">
      <div className="border rounded-lg bg-white p-5 grid gap-5 grid-cols-2 md:grid-cols-3">
        {tiles.counts.map((t) => (
          <StatTile key={t.label} label={t.label} value={t.value} />
        ))}
        {tiles.percents.map((t) => (
          <StatTile key={t.label} label={t.label} value={t.value} format={(n) => `${n}%`} />
        ))}
      </div>

      <ListToolbar
        controls={controls}
        filterDefs={USERS_FILTERS}
        columns={USERS_COLUMN_SETTINGS}
        searchPlaceholder="Search users"
        searchProposed
        sheetTitle="User Filters"
      />

      <div className="min-h-[400px]">
        {sorted.length === 0 ? (
          <EmptyState
            icon="bi-people"
            title="No results found."
            description="Try clearing filters to expand the user results."
            onClearAll={controls.clearAll}
          />
        ) : (
          <TableShell footer={<TablePagination page={page} perPage={controls.perPage} total={sorted.length} onPageChange={setPage} />}>
            <TableHeader>
              <TableRow className="bg-[#f9fbfd] hover:bg-[#f9fbfd]">
                <TableHead />
                {groups.map((g) => (
                  <TableHead key={g.key} colSpan={g.columns.length} className="border-l text-center">
                    <span className={cn(HEAD_TEXT, "justify-center text-foreground")}>{g.label}</span>
                  </TableHead>
                ))}
              </TableRow>
              <TableRow className="bg-[#f9fbfd]">
                <SortableHeadCell label="Name" field="name" sort={sort} />
                {groups.flatMap((g) =>
                  g.columns.map((c) => <SortableHeadCell key={`${g.key}-${c.key}`} label={c.label} field={c.key} sort={sort} className="whitespace-nowrap" />),
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((r) => (
                <TableRow key={r.user.id} className="text-[13px]">
                  <TableCell className="min-w-[200px]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-[11px] font-semibold inline-flex items-center justify-center flex-shrink-0">
                        {r.user.initials}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-foreground truncate">{r.user.name}</span>
                        <span className="text-[12px] text-muted-foreground truncate">{r.user.role} · {r.user.orgDepartment}</span>
                      </div>
                    </div>
                  </TableCell>
                  {groups.flatMap((g) =>
                    g.columns.map((c, i) => (
                      <TableCell key={`${g.key}-${c.key}`} className={cn("tabular-nums whitespace-nowrap", i === 0 && "border-l")}>
                        {fmt(r[c.key], c.pct)}
                      </TableCell>
                    )),
                  )}
                </TableRow>
              ))}
            </TableBody>
          </TableShell>
        )}
      </div>
    </div>
  );
}

/** Rows for the Users tab's Export as CSV — current filters, visible column groups only (prod behaviour). */
export function usersCsvRows(range: InsightsRange, controls: ListControls): (string | number | null)[][] {
  const groups = COLUMN_GROUPS.filter((g) => controls.columnVisibility[g.key] !== false);
  const rows = filterUserRows(getUserMetrics(range), controls);
  return [
    ["Name", ...groups.flatMap((g) => g.columns.map((c) => `${g.label} ${c.label}`))],
    ...rows.map((r) => [r.user.name, ...groups.flatMap((g) => g.columns.map((c) => r[c.key]))]),
  ];
}
