import { useMemo, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "@/hooks/use-toast";
import { ListToolbar, useListControls } from "./ListToolbar";
import { CREATED_DATE_OPTIONS, matchesFilter, type ListFilterDef } from "./ListFilters";
import { TablePagination } from "./TablePagination";
import { HeadCell, RowActions, SortableHeadCell, StatusBadge, TableShell, sortRows, usePage, useSort } from "./ListTable";
import { matchesDateRange, type DateRangeValue } from "@/lib/dateRangeFilter";
import {
  WORKFLOW_STATUS_CONFIG,
  mockBrandingPackages,
  mockWorkflows,
  type BrandingPackage,
  type Workflow,
  type WorkflowStatus,
} from "@/lib/mockLibraryListsData";

/**
 * Library › Branding and Library › Workflows. Table only (prod has no grid
 * view for either), on the ML 2.0 list kit. Columns, filters and row menus
 * follow prod's branding-packages-page and workflows-page.
 */

// Prod renders these with Angular's `date: 'short'`.
const shortDateTime = (d: Date) =>
  d.toLocaleString("en-US", { month: "numeric", day: "numeric", year: "2-digit", hour: "numeric", minute: "2-digit" });

const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

const includesText = (q: string, ...fields: string[]) => !q || fields.some((f) => f.toLowerCase().includes(q));

function ConfirmDelete({
  title,
  name,
  onCancel,
  onConfirm,
}: {
  title: string;
  name: string | undefined;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={!!name} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>Are you sure you want to delete "{name}"? This can't be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Branding
// ---------------------------------------------------------------------------

const BRANDING_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
  { key: "creator", label: "Creator" },
  { key: "created", label: "Created" },
  { key: "assets", label: "Assets" },
];

type BrandingSortField = "name" | "creator" | "created" | "assets";

export function BrandingTab() {
  // Prod: search only, no filters.
  const controls = useListControls("library.branding", { columns: BRANDING_COLUMNS });
  const { search, columnVisibility, perPage } = controls;
  const show = (key: string) => columnVisibility[key] !== false;
  const [packages, setPackages] = useState(mockBrandingPackages);
  const [deleteTarget, setDeleteTarget] = useState<BrandingPackage | null>(null);

  // Prod's default sort is Created, newest first.
  const sort = useSort<BrandingSortField>("created");
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = packages.filter((p) => includesText(q, p.title, p.description, p.createdBy));
    return sortRows(matched, sort.field, sort.direction, (p, field) => {
      switch (field) {
        case "name": return p.title.toLowerCase();
        case "creator": return p.createdBy.toLowerCase();
        case "created": return p.created.getTime();
        case "assets": return p.totalAssetsBranded;
      }
    });
  }, [packages, search, sort.field, sort.direction]);
  const { page, setPage, paged } = usePage(rows, perPage);

  return (
    <>
      <ListToolbar controls={controls} columns={BRANDING_COLUMNS} searchPlaceholder="Search branding" />
      <div className="min-h-[400px]">
        {rows.length === 0 ? (
          <EmptyState icon="bi-badge-tm" title="No branding packages found." onClearAll={controls.isFiltered ? controls.clearAll : undefined} />
        ) : (
          <TableShell footer={<TablePagination page={page} perPage={perPage} total={rows.length} onPageChange={setPage} />}>
            <TableHeader>
              <TableRow className="bg-[#f9fbfd]">
                {show("name") && <SortableHeadCell label="Name" field="name" sort={sort} />}
                {show("description") && <HeadCell label="Description" />}
                {show("creator") && <SortableHeadCell label="Creator" field="creator" sort={sort} />}
                {show("created") && <SortableHeadCell label="Created" field="created" sort={sort} />}
                {show("assets") && <SortableHeadCell label="Assets" field="assets" sort={sort} />}
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((p) => (
                <TableRow key={p.id} className="text-[13px]">
                  {show("name") && (
                    <TableCell className="min-w-[180px]">
                      <button className="font-medium text-primary hover:underline text-left">{p.title}</button>
                    </TableCell>
                  )}
                  {show("description") && <TableCell className="min-w-[220px] max-w-[420px]">{p.description}</TableCell>}
                  {show("creator") && <TableCell className="whitespace-nowrap">{p.createdBy}</TableCell>}
                  {show("created") && <TableCell className="whitespace-nowrap">{shortDateTime(p.created)}</TableCell>}
                  {show("assets") && <TableCell className="tabular-nums">{p.totalAssetsBranded.toLocaleString()}</TableCell>}
                  <TableCell>
                    <RowActions
                      actions={[
                        { label: "Edit Branding", icon: "bi-pencil-square", onSelect: () => {} },
                        { label: "Delete Branding", icon: "bi-trash", onSelect: () => setDeleteTarget(p), destructive: true },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableShell>
        )}
      </div>

      <ConfirmDelete
        title="Delete Branding?"
        name={deleteTarget?.title}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          setPackages((prev) => prev.filter((p) => p.id !== deleteTarget.id));
          toast({ title: "Branding deleted", description: deleteTarget.title });
          setDeleteTarget(null);
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Workflows
// ---------------------------------------------------------------------------

const WORKFLOW_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "status", label: "Status" },
  { key: "description", label: "Description" },
  { key: "creator", label: "Creator" },
  { key: "created", label: "Created" },
  { key: "galleries", label: "Galleries" },
];

// Prod's three filters, each pick-one: Status, Creator, Created Date.
const WORKFLOW_FILTERS: ListFilterDef[] = [
  {
    id: "status",
    label: "Status",
    icon: "bi-circle-half",
    multi: false,
    options: (Object.keys(WORKFLOW_STATUS_CONFIG) as WorkflowStatus[]).map((s) => ({ value: s, label: WORKFLOW_STATUS_CONFIG[s].label })),
  },
  {
    id: "creator",
    label: "Creator",
    icon: "bi-person",
    multi: false,
    searchable: true,
    options: unique(mockWorkflows.map((w) => w.createdBy)).map((name) => ({ value: name, label: name })),
  },
  { id: "created", label: "Created Date", icon: "bi-calendar", multi: false, options: CREATED_DATE_OPTIONS },
];
const WORKFLOW_FILTER_SETTINGS = WORKFLOW_FILTERS.map((f) => ({ key: f.id, label: f.label }));

export function WorkflowsTab() {
  const controls = useListControls("library.workflows", { columns: WORKFLOW_COLUMNS, filters: WORKFLOW_FILTER_SETTINGS });
  const { search, filters, columnVisibility, perPage } = controls;
  const show = (key: string) => columnVisibility[key] !== false;
  const [workflows, setWorkflows] = useState(mockWorkflows);
  const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null);

  // Prod's columns aren't sortable; rows come newest first.
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const range = filters.created?.[0]?.value as DateRangeValue | undefined;
    return workflows
      .filter(
        (w) =>
          includesText(q, w.name, w.description, w.createdBy) &&
          matchesFilter(filters, "status", w.status) &&
          matchesFilter(filters, "creator", w.createdBy) &&
          (!range || matchesDateRange(w.created, range)),
      )
      .sort((a, b) => b.created.getTime() - a.created.getTime());
  }, [workflows, search, filters]);
  const { page, setPage, paged } = usePage(rows, perPage);

  const setStatus = (w: Workflow, status: WorkflowStatus) => {
    setWorkflows((prev) => prev.map((x) => (x.id === w.id ? { ...x, status } : x)));
    toast({ title: status === "ARCHIVED" ? "Workflow archived" : "Workflow unarchived", description: w.name });
  };

  return (
    <>
      <ListToolbar
        controls={controls}
        filterDefs={WORKFLOW_FILTERS}
        columns={WORKFLOW_COLUMNS}
        searchPlaceholder="Search workflows"
        sheetTitle="Workflow Filters"
      />
      <div className="min-h-[400px]">
        {rows.length === 0 ? (
          <EmptyState icon="bi-diagram-3" title="No approval workflows found." onClearAll={controls.isFiltered ? controls.clearAll : undefined} />
        ) : (
          <TableShell footer={<TablePagination page={page} perPage={perPage} total={rows.length} onPageChange={setPage} />}>
            <TableHeader>
              <TableRow className="bg-[#f9fbfd]">
                {show("name") && <HeadCell label="Name" />}
                {show("status") && <HeadCell label="Status" />}
                {show("description") && <HeadCell label="Description" />}
                {show("creator") && <HeadCell label="Creator" />}
                {show("created") && <HeadCell label="Created" />}
                {show("galleries") && <HeadCell label="Galleries" />}
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((w) => (
                <TableRow key={w.id} className="text-[13px]">
                  {show("name") && (
                    <TableCell className="min-w-[180px]">
                      <button className="font-medium text-primary hover:underline text-left">{w.name}</button>
                    </TableCell>
                  )}
                  {show("status") && (
                    <TableCell>
                      <StatusBadge tone={WORKFLOW_STATUS_CONFIG[w.status].tone}>{WORKFLOW_STATUS_CONFIG[w.status].label}</StatusBadge>
                    </TableCell>
                  )}
                  {show("description") && (
                    <TableCell className="min-w-[220px] max-w-[420px] text-muted-foreground">{w.description || "—"}</TableCell>
                  )}
                  {show("creator") && <TableCell className="whitespace-nowrap">{w.createdBy}</TableCell>}
                  {show("created") && <TableCell className="whitespace-nowrap">{shortDateTime(w.created)}</TableCell>}
                  {show("galleries") && <TableCell className="tabular-nums">{w.galleryCount}</TableCell>}
                  <TableCell>
                    <RowActions
                      actions={[
                        // Prod: archived workflows can only be unarchived or deleted.
                        ...(w.status !== "ARCHIVED"
                          ? [
                              { label: "Edit Workflow", icon: "bi-pencil-square", onSelect: () => {} },
                              { label: "Archive Workflow", icon: "bi-archive", onSelect: () => setStatus(w, "ARCHIVED") },
                            ]
                          : [{ label: "Unarchive Workflow", icon: "bi-archive", onSelect: () => setStatus(w, "ACTIVE") }]),
                        { label: "Delete Workflow", icon: "bi-trash", onSelect: () => setDeleteTarget(w), destructive: true },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableShell>
        )}
      </div>

      <ConfirmDelete
        title="Delete Workflow?"
        name={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          setWorkflows((prev) => prev.filter((w) => w.id !== deleteTarget.id));
          toast({ title: "Workflow deleted", description: deleteTarget.name });
          setDeleteTarget(null);
        }}
      />
    </>
  );
}
