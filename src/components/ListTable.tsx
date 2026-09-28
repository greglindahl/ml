import { useEffect, useMemo, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Table, TableHead } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Building blocks for the ML 2.0 list tables (Connect, Engage, …): client-side
 * sort + pagination hooks, header cells, the bordered shell, status badges and
 * the kebab row menu. Markup matches GroupsTable / RequestsTable.
 */

export type SortDirection = "asc" | "desc";

export function useSort<F extends string>(initialField: F, initialDirection: SortDirection = "desc") {
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
export function usePage<T>(rows: T[], perPage: number) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [rows, perPage]);
  const paged = useMemo(() => rows.slice((page - 1) * perPage, page * perPage), [rows, page, perPage]);
  return { page, setPage, paged };
}

export const HEAD_TEXT = "flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground";

export function HeadCell({ label, className }: { label: string; className?: string }) {
  return (
    <TableHead className={className}>
      <div className={HEAD_TEXT}>{label}</div>
    </TableHead>
  );
}

export function SortableHeadCell<F extends string>({
  label,
  field,
  sort,
  className,
}: {
  label: string;
  field: F;
  sort: { field: F; direction: SortDirection; toggle: (f: F) => void };
  /** Applied to the label row, e.g. whitespace-nowrap for dense numeric tables. */
  className?: string;
}) {
  const active = sort.field === field;
  return (
    <TableHead
      className="cursor-pointer select-none"
      onClick={() => sort.toggle(field)}
      aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <div className={cn(HEAD_TEXT, className)}>
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

export const time = (d: Date | null) => (d ? d.getTime() : null);

export function sortRows<T, F extends string>(rows: T[], field: F, direction: SortDirection, key: (row: T, field: F) => string | number | null) {
  return [...rows].sort((a, b) => {
    const result = cmp(key(a, field), key(b, field));
    return direction === "asc" ? result : -result;
  });
}

export function TableShell({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="flex flex-col border rounded-lg bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <Table>{children}</Table>
      </div>
      {footer}
    </div>
  );
}

export function StatusBadge({ tone, children }: { tone: "success" | "warning" | "secondary" | "danger"; children: React.ReactNode }) {
  return (
    <Badge colorStyle={tone} theme="subtle" shape="rounded" className="text-[12px] normal-case tracking-normal font-medium whitespace-nowrap">
      {children}
    </Badge>
  );
}

export interface RowAction {
  label: string;
  icon: string;
  onSelect: () => void;
  destructive?: boolean;
}

export function RowActions({ actions }: { actions: RowAction[] }) {
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
