import { useEffect, useMemo, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TablePagination } from "./TablePagination";
import type { VisibilityMap } from "./TableSettingsDrawer";
import { cn } from "@/lib/utils";
import {
  EXPORT_STATUS_LABELS,
  IMPORT_STATUS_LABELS,
  formatConnectDate,
  getDamTypeLabel,
  getExportDisplayStatus,
  getImportDisplayStatus,
  getImportRunState,
  getIntegrationStatus,
  type ConnectExport,
  type ConnectGalleryRef,
  type DamImport,
  type Integration,
  type RoutingRule,
} from "@/lib/mockConnectData";

// ---------------------------------------------------------------------------
// Shared table bits
// ---------------------------------------------------------------------------

type SortDirection = "asc" | "desc";

function useSort<F extends string>(initialField: F, initialDirection: SortDirection = "desc") {
  const [field, setField] = useState<F>(initialField);
  const [direction, setDirection] = useState<SortDirection>(initialDirection);
  const toggle = (next: F) => {
    if (next === field) setDirection((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setField(next);
      setDirection("asc");
    }
  };
  return { field, direction, toggle };
}

/** Resets to page 1 whenever the (memoized) rows change — i.e. a filter or search moved. */
function usePage<T>(rows: T[], perPage: number) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [rows, perPage]);
  const paged = useMemo(() => rows.slice((page - 1) * perPage, page * perPage), [rows, page, perPage]);
  return { page, setPage, paged };
}

const HEAD_TEXT = "flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground";

function HeadCell({ label, className }: { label: string; className?: string }) {
  return (
    <TableHead className={className}>
      <div className={HEAD_TEXT}>{label}</div>
    </TableHead>
  );
}

function SortableHeadCell<F extends string>({
  label,
  field,
  sort,
}: {
  label: string;
  field: F;
  sort: { field: F; direction: SortDirection; toggle: (f: F) => void };
}) {
  const active = sort.field === field;
  return (
    <TableHead
      className="cursor-pointer select-none"
      onClick={() => sort.toggle(field)}
      aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <div className={HEAD_TEXT}>
        {label}
        {active ? (
          <i className={cn("bi text-[10px]", sort.direction === "asc" ? "bi-chevron-up" : "bi-chevron-down")} />
        ) : (
          <i className="bi bi-chevron-expand text-[10px] opacity-50" />
        )}
      </div>
    </TableHead>
  );
}

const cmp = (a: string | number | null | undefined, b: string | number | null | undefined) => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));
};

const time = (d: Date | null) => (d ? d.getTime() : null);

function sortRows<T, F extends string>(rows: T[], field: F, direction: SortDirection, key: (row: T, field: F) => string | number | null) {
  return [...rows].sort((a, b) => {
    const result = cmp(key(a, field), key(b, field));
    return direction === "asc" ? result : -result;
  });
}

function TableShell({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="flex flex-col border rounded-lg bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <Table>{children}</Table>
      </div>
      {footer}
    </div>
  );
}

function StatusBadge({ tone, children }: { tone: "success" | "warning" | "secondary" | "danger"; children: React.ReactNode }) {
  return (
    <Badge colorStyle={tone} theme="subtle" shape="rounded" className="text-[12px] normal-case tracking-normal font-medium whitespace-nowrap">
      {children}
    </Badge>
  );
}

function GalleryLinks({ galleries }: { galleries: ConnectGalleryRef[] }) {
  return (
    <>
      {galleries.map((g, i) => (
        // Keep each name + its comma together; wrap only between galleries.
        <span key={g.id} className="whitespace-nowrap">
          <button className="text-primary hover:underline">{g.name}</button>
          {i < galleries.length - 1 && ", "}
        </span>
      ))}
    </>
  );
}

interface RowAction {
  label: string;
  icon: string;
  onSelect: () => void;
  destructive?: boolean;
}

function RowActions({ actions }: { actions: RowAction[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="Row actions">
          <i className="bi bi-three-dots-vertical" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((a) => (
          <DropdownMenuItem key={a.label} onClick={a.onSelect} className={cn(a.destructive && "text-destructive focus:text-destructive")}>
            <i className={cn("bi", a.icon, "w-4 h-4 mr-2 inline-flex items-center justify-center leading-none")} />
            {a.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

export const IMPORT_COLUMNS = [
  { key: "service", label: "Service" },
  { key: "importedFrom", label: "Imported From" },
  { key: "destination", label: "Destination" },
  { key: "created", label: "Created" },
  { key: "status", label: "Status" },
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
  { key: "captureRange", label: "Capture Range" },
  { key: "lastRun", label: "Last Run" },
];

type ImportSortField = "importedFrom" | "created" | "status" | "startDate" | "endDate" | "lastRun";

const MAX_TAGS = 5;

function ImportLastRun({ imp }: { imp: DamImport }) {
  const state = getImportRunState(imp);
  const counts = `${imp.completedFiles}/${imp.totalFiles}`;

  if (state === "preparing") return <span className="text-muted-foreground">Preparing…</span>;
  if (state === "failed") return <span className="text-destructive">Failed</span>;
  if (state === "importing") {
    return (
      <div className="flex flex-col gap-1 min-w-[120px]">
        <span>Importing {counts}</span>
        <Progress value={(imp.completedFiles / Math.max(1, imp.totalFiles)) * 100} className="h-[5px]" />
      </div>
    );
  }
  return (
    <div className="flex flex-col">
      <span className={cn("inline-flex items-center gap-1.5", state === "errors" && "text-destructive")}>
        {state === "errors" ? `Imported ${counts}` : `Completed ${counts}`}
        {imp.type === "POLLING" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <i className="bi bi-arrow-repeat text-muted-foreground" aria-label="Polling" />
            </TooltipTrigger>
            <TooltipContent>Polling</TooltipContent>
          </Tooltip>
        )}
      </span>
      <span className="text-muted-foreground text-[12px]">{formatConnectDate(imp.dateCompleted)}</span>
      {state === "errors" && (
        <button className="text-primary hover:underline text-left text-[12px]">View Errors</button>
      )}
    </div>
  );
}

export function ImportsTable({
  imports,
  perPage,
  columnVisibility,
  onPauseToggle,
  onArchiveToggle,
}: {
  imports: DamImport[];
  perPage: number;
  columnVisibility: VisibilityMap;
  onPauseToggle: (imp: DamImport) => void;
  onArchiveToggle: (imp: DamImport) => void;
}) {
  const show = (key: string) => columnVisibility[key] !== false;
  const sort = useSort<ImportSortField>("created");

  const sorted = useMemo(
    () =>
      sortRows(imports, sort.field, sort.direction, (row, field) => {
        switch (field) {
          case "importedFrom": return row.folderName ?? row.tags[0] ?? null;
          case "created": return time(row.dateRequested);
          case "status": return IMPORT_STATUS_LABELS[getImportDisplayStatus(row)];
          case "startDate": return time(row.runAfter);
          case "endDate": return time(row.runUntil);
          case "lastRun": return time(row.dateCompleted);
        }
      }),
    [imports, sort.field, sort.direction],
  );
  const { page, setPage, paged } = usePage(sorted, perPage);

  return (
    <TableShell footer={<TablePagination page={page} perPage={perPage} total={sorted.length} onPageChange={setPage} />}>
      <TableHeader>
        <TableRow className="bg-[#f9fbfd]">
          {show("service") && <HeadCell label="Service" />}
          {show("importedFrom") && <SortableHeadCell label="Imported From" field="importedFrom" sort={sort} />}
          {show("destination") && <HeadCell label="Destination" />}
          {show("created") && <SortableHeadCell label="Created" field="created" sort={sort} />}
          {show("status") && <SortableHeadCell label="Status" field="status" sort={sort} />}
          {show("startDate") && <SortableHeadCell label="Start Date" field="startDate" sort={sort} />}
          {show("endDate") && <SortableHeadCell label="End Date" field="endDate" sort={sort} />}
          {show("captureRange") && <HeadCell label="Capture Range" />}
          {show("lastRun") && <SortableHeadCell label="Last Run" field="lastRun" sort={sort} />}
          <TableHead className="w-[40px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {paged.map((imp) => {
          const status = getImportDisplayStatus(imp);
          return (
            <TableRow key={imp.id} className="text-[13px] align-top">
              {show("service") && (
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{imp.credential.name}</span>
                    <span className="text-muted-foreground text-[12px]">{getDamTypeLabel(imp.credential.damType)}</span>
                    {imp.credential.status === "INVALID" && <StatusBadge tone="danger">Invalid credentials</StatusBadge>}
                  </div>
                </TableCell>
              )}
              {show("importedFrom") && (
                <TableCell className="min-w-[160px] max-w-[240px]">
                  {imp.folderName && (
                    <span className="inline-flex items-center gap-1.5">
                      <i className="bi bi-folder text-muted-foreground" />
                      {imp.folderName}
                    </span>
                  )}
                  {imp.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {imp.tags.slice(0, MAX_TAGS).map((tag) => (
                        <Badge key={tag} colorStyle="secondary" theme="subtle" shape="rounded" className="text-[12px] normal-case tracking-normal font-normal">
                          {tag}
                        </Badge>
                      ))}
                      {imp.tags.length > MAX_TAGS && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-[12px] text-primary cursor-default">+ {imp.tags.length - MAX_TAGS} more</span>
                          </TooltipTrigger>
                          <TooltipContent>{imp.tags.slice(MAX_TAGS).join(", ")}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </TableCell>
              )}
              {show("destination") && (
                <TableCell className="min-w-[180px] max-w-[240px]">
                  {imp.galleries.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Gallery: </span>
                      <GalleryLinks galleries={imp.galleries} />
                    </div>
                  )}
                  {imp.routingRules.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Routing Rule: </span>
                      {imp.routingRules.map((r) => (
                        <button key={r.id} className="text-primary hover:underline">{r.name}</button>
                      ))}
                    </div>
                  )}
                </TableCell>
              )}
              {show("created") && <TableCell className="whitespace-nowrap">{formatConnectDate(imp.dateRequested)}</TableCell>}
              {show("status") && (
                <TableCell>
                  <span className="inline-flex items-center gap-1.5">
                    <StatusBadge tone={status === "active" ? "success" : status === "paused" ? "warning" : "secondary"}>
                      {IMPORT_STATUS_LABELS[status]}
                    </StatusBadge>
                    {status === "paused" && imp.type === "ONE_TIME" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <i className="bi bi-pause-circle text-muted-foreground" aria-label="One-time Import" />
                        </TooltipTrigger>
                        <TooltipContent>One-time Import</TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                </TableCell>
              )}
              {show("startDate") && <TableCell className="whitespace-nowrap">{formatConnectDate(imp.runAfter)}</TableCell>}
              {show("endDate") && <TableCell className="whitespace-nowrap">{formatConnectDate(imp.runUntil)}</TableCell>}
              {show("captureRange") && (
                <TableCell className="whitespace-nowrap">
                  {imp.capturedAfter || imp.capturedBefore ? (
                    <div className="flex flex-col">
                      <span><span className="text-muted-foreground">Start: </span>{formatConnectDate(imp.capturedAfter)}</span>
                      <span><span className="text-muted-foreground">End: </span>{formatConnectDate(imp.capturedBefore)}</span>
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
              )}
              {show("lastRun") && (
                <TableCell>
                  <ImportLastRun imp={imp} />
                </TableCell>
              )}
              <TableCell>
                <RowActions
                  actions={
                    status === "archived"
                      ? [{ label: "Unarchive Import", icon: "bi-archive", onSelect: () => onArchiveToggle(imp) }]
                      : [
                          status === "paused"
                            ? { label: "Resume Import", icon: "bi-play-circle", onSelect: () => onPauseToggle(imp) }
                            : { label: "Pause Import", icon: "bi-pause-circle", onSelect: () => onPauseToggle(imp) },
                          { label: "Archive Import", icon: "bi-archive", onSelect: () => onArchiveToggle(imp) },
                        ]
                  }
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </TableShell>
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const EXPORT_COLUMNS = [
  { key: "integration", label: "Integration" },
  { key: "sourceGallery", label: "Source Gallery" },
  { key: "destination", label: "Destination" },
  { key: "created", label: "Created" },
  { key: "status", label: "Status" },
];

export function ExportsTable({
  exports,
  perPage,
  columnVisibility,
  onArchiveToggle,
}: {
  exports: ConnectExport[];
  perPage: number;
  columnVisibility: VisibilityMap;
  onArchiveToggle: (exp: ConnectExport) => void;
}) {
  const show = (key: string) => columnVisibility[key] !== false;
  // Prod only sorts Exports by Created.
  const sort = useSort<"created">("created");
  const sorted = useMemo(
    () => sortRows(exports, sort.field, sort.direction, (row) => row.created.getTime()),
    [exports, sort.field, sort.direction],
  );
  const { page, setPage, paged } = usePage(sorted, perPage);

  return (
    <TableShell footer={<TablePagination page={page} perPage={perPage} total={sorted.length} onPageChange={setPage} />}>
      <TableHeader>
        <TableRow className="bg-[#f9fbfd]">
          {show("integration") && <HeadCell label="Integration" />}
          {show("sourceGallery") && <HeadCell label="Source Gallery" />}
          {show("destination") && <HeadCell label="Destination" />}
          {show("created") && <SortableHeadCell label="Created" field="created" sort={sort} />}
          {show("status") && <HeadCell label="Status" />}
          <TableHead className="w-[40px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {paged.map((exp) => {
          const status = getExportDisplayStatus(exp);
          return (
            <TableRow key={exp.id} className="text-[13px]">
              {show("integration") && (
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold">{getDamTypeLabel(exp.damType)}</span>
                    <span className="text-muted-foreground text-[12px]">{exp.credential?.name ?? "[Integration Removed]"}</span>
                  </div>
                </TableCell>
              )}
              {show("sourceGallery") && (
                <TableCell>
                  <button className="text-primary hover:underline">{exp.sourceGallery.name}</button>
                </TableCell>
              )}
              {show("destination") && (
                <TableCell>
                  <span className="inline-flex items-center gap-1.5">
                    <i className="bi bi-slack text-muted-foreground" />
                    {exp.destinationChannel}
                  </span>
                </TableCell>
              )}
              {show("created") && <TableCell className="whitespace-nowrap">{formatConnectDate(exp.created)}</TableCell>}
              {show("status") && (
                <TableCell>
                  {status === "invalid" ? (
                    <span className="inline-flex items-center gap-1.5 text-destructive whitespace-nowrap">
                      <i className="bi bi-exclamation-triangle" />
                      {EXPORT_STATUS_LABELS.invalid}
                    </span>
                  ) : (
                    <StatusBadge tone={status === "active" ? "success" : "secondary"}>{EXPORT_STATUS_LABELS[status]}</StatusBadge>
                  )}
                </TableCell>
              )}
              <TableCell>
                <RowActions
                  actions={[
                    status === "archived"
                      ? { label: "Unarchive Export", icon: "bi-archive", onSelect: () => onArchiveToggle(exp) }
                      : { label: "Archive Export", icon: "bi-archive", onSelect: () => onArchiveToggle(exp) },
                  ]}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </TableShell>
  );
}

// ---------------------------------------------------------------------------
// Routing rules
// ---------------------------------------------------------------------------

export const ROUTING_RULE_COLUMNS = [
  { key: "name", label: "Rule Name" },
  { key: "mappings", label: "Tag → Selected Gallery(s)" },
  { key: "created", label: "Created" },
];

const MAX_MAPPINGS = 2;

function RuleMappings({ rule }: { rule: RoutingRule }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rule.tagMappings : rule.tagMappings.slice(0, MAX_MAPPINGS);
  const hidden = rule.tagMappings.length - MAX_MAPPINGS;

  return (
    <div className="flex flex-col gap-1.5">
      {visible.map((m) => (
        <div key={m.tag} className="grid grid-cols-[minmax(120px,180px)_1fr] gap-3 items-start">
          <span className="inline-flex items-center gap-1.5">
            <i className="bi bi-tag text-muted-foreground" />
            {m.tag}
          </span>
          <div className="flex flex-wrap gap-1">
            {m.galleries.map((g) => (
              <Badge key={g.id} colorStyle="primary" theme="subtle" shape="rounded" className="text-[12px] normal-case tracking-normal font-normal">
                {g.name}
              </Badge>
            ))}
          </div>
        </div>
      ))}
      {hidden > 0 && (
        <button className="text-primary hover:underline text-left text-[12px]" onClick={() => setExpanded((e) => !e)}>
          {expanded ? "Show Less" : `${hidden} More`}
        </button>
      )}
    </div>
  );
}

export function RoutingRulesTable({
  rules,
  perPage,
  columnVisibility,
  onDelete,
}: {
  rules: RoutingRule[];
  perPage: number;
  columnVisibility: VisibilityMap;
  onDelete: (rule: RoutingRule) => void;
}) {
  const show = (key: string) => columnVisibility[key] !== false;
  const sort = useSort<"name" | "created">("created");
  const sorted = useMemo(
    () => sortRows(rules, sort.field, sort.direction, (row, field) => (field === "name" ? row.name : row.created.getTime())),
    [rules, sort.field, sort.direction],
  );
  const { page, setPage, paged } = usePage(sorted, perPage);

  return (
    <TableShell footer={<TablePagination page={page} perPage={perPage} total={sorted.length} onPageChange={setPage} />}>
      <TableHeader>
        <TableRow className="bg-[#f9fbfd]">
          {show("name") && <SortableHeadCell label="Rule Name" field="name" sort={sort} />}
          {show("mappings") && (
            <TableHead>
              <div className="grid grid-cols-[minmax(120px,180px)_1fr] gap-3">
                <span className={HEAD_TEXT}>Tag</span>
                <span className={HEAD_TEXT}>Selected Gallery(s)</span>
              </div>
            </TableHead>
          )}
          {show("created") && <SortableHeadCell label="Created" field="created" sort={sort} />}
          <TableHead className="w-[40px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {paged.map((rule) => (
          <TableRow key={rule.id} className="text-[13px] align-top">
            {show("name") && (
              <TableCell>
                <button className="text-primary hover:underline text-left font-medium">{rule.name}</button>
              </TableCell>
            )}
            {show("mappings") && (
              <TableCell>
                <RuleMappings rule={rule} />
              </TableCell>
            )}
            {show("created") && (
              <TableCell className="whitespace-nowrap">
                {rule.created.toLocaleString("en-US", { month: "numeric", day: "numeric", year: "2-digit", hour: "numeric", minute: "2-digit" })}
              </TableCell>
            )}
            <TableCell>
              <RowActions
                actions={[
                  { label: "Edit Rule", icon: "bi-pencil", onSelect: () => {} },
                  { label: "Delete Rule", icon: "bi-trash", onSelect: () => onDelete(rule), destructive: true },
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
// Integrations
// ---------------------------------------------------------------------------

/** Plain card table, API order, no pagination — same as prod. */
export function IntegrationsTable({
  integrations,
  onAuthorize,
  onDisconnect,
}: {
  integrations: Integration[];
  onAuthorize: (integration: Integration) => void;
  onDisconnect: (integration: Integration) => void;
}) {
  return (
    <TableShell>
      <TableHeader>
        <TableRow className="bg-[#f9fbfd]">
          <HeadCell label="Integration" />
          <HeadCell label="Status" />
          <HeadCell label="Details" />
          <HeadCell label="Action" className="text-right" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {integrations.map((integration) => {
          const status = getIntegrationStatus(integration);
          return (
            <TableRow key={integration.damType} className="text-[13px]">
              <TableCell>
                <span className="inline-flex items-center gap-3">
                  <span className="w-9 h-9 rounded-md bg-muted inline-flex items-center justify-center flex-shrink-0">
                    <i className={cn("bi", integration.icon, "text-[18px] text-foreground")} />
                  </span>
                  <span className="font-medium">{integration.label}</span>
                </span>
              </TableCell>
              <TableCell>
                {status === "connected" && (
                  <div className="flex flex-col gap-0.5">
                    <span className="inline-flex items-center gap-1.5">
                      <StatusBadge tone="success">Connected</StatusBadge>
                      {integration.isCcg && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span><StatusBadge tone="secondary">CCG</StatusBadge></span>
                          </TooltipTrigger>
                          <TooltipContent>Client Credentials Grant</TooltipContent>
                        </Tooltip>
                      )}
                    </span>
                    <span className="text-muted-foreground text-[12px]">Authorized by: {integration.credential!.authorizedBy}</span>
                  </div>
                )}
                {status === "reauthorize" && (
                  <span className="inline-flex items-start gap-1.5 text-destructive max-w-[320px]">
                    <i className="bi bi-exclamation-triangle mt-0.5" />
                    {integration.label} has been disconnected. Please select reauthorize to reconnect.
                  </span>
                )}
              </TableCell>
              <TableCell>
                {integration.damType === "SLACK" && integration.credential && (
                  <span className="text-muted-foreground">{integration.credential.name}</span>
                )}
                {integration.damType === "BOX" && (
                  <button className="text-primary hover:underline">
                    {integration.isCcg ? "Edit CCG settings…" : "Switch to CCG…"}
                  </button>
                )}
              </TableCell>
              <TableCell className="text-right">
                {status === "not-connected" && (
                  <Button size="sm" className="h-8" onClick={() => onAuthorize(integration)}>Authorize</Button>
                )}
                {status === "connected" && (
                  <Button size="sm" variant="outline" className="h-8" onClick={() => onDisconnect(integration)}>Disconnect</Button>
                )}
                {status === "reauthorize" && (
                  <Button size="sm" variant="destructive" className="h-8" onClick={() => onAuthorize(integration)}>Reauthorize</Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </TableShell>
  );
}
