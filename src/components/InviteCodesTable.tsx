import { useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { InviteCode } from "@/lib/mockInviteCodeData";
import { formatCampaignDate } from "@/lib/mockCampaignData";
import type {
  InviteCodesTableColumnKey,
  InviteCodesTableColumnVisibility,
} from "./InviteCodesSettingsDrawer";

interface InviteCodesTableProps {
  inviteCodes: InviteCode[];
  searchQuery?: string;
  perPage?: number;
  columnVisibility?: InviteCodesTableColumnVisibility;
}

type SortField = "code" | "groupCount" | "creator" | "dateCreated";
type SortDirection = "asc" | "desc";

export function InviteCodesTable({
  inviteCodes,
  searchQuery,
  perPage = 40,
  columnVisibility,
}: InviteCodesTableProps) {
  const [sortField, setSortField] = useState<SortField>("dateCreated");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = perPage;

  const isVisible = (key: InviteCodesTableColumnKey) =>
    columnVisibility?.[key] !== false;

  const filtered = inviteCodes.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.code.toLowerCase().includes(q) || c.creator.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "code":
        comparison = a.code.localeCompare(b.code);
        break;
      case "groupCount":
        comparison = a.groupCount - b.groupCount;
        break;
      case "creator":
        comparison = a.creator.localeCompare(b.creator);
        break;
      case "dateCreated":
        comparison = a.dateCreated.getTime() - b.dateCreated.getTime();
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginated = sorted.slice(startIndex, endIndex);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <i className="bi bi-chevron-expand text-[10px] opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <i className="bi bi-chevron-up text-[10px]" />
    ) : (
      <i className="bi bi-chevron-down text-[10px]" />
    );
  };

  return (
    <div className="flex flex-col border rounded-lg bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f9fbfd]">
              {isVisible("code") && (
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("code")}
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Invite Code
                    <SortIcon field="code" />
                  </div>
                </TableHead>
              )}
              {isVisible("groupCount") && (
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("groupCount")}
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Groups
                    <SortIcon field="groupCount" />
                  </div>
                </TableHead>
              )}
              {isVisible("creator") && (
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("creator")}
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Creator
                    <SortIcon field="creator" />
                  </div>
                </TableHead>
              )}
              {isVisible("dateCreated") && (
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("dateCreated")}
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Date Created
                    <SortIcon field="dateCreated" />
                  </div>
                </TableHead>
              )}
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((c) => (
              <TableRow key={c.id} className="group">
                {isVisible("code") && (
                  <TableCell>
                    <span className="text-[13px]">{c.code}</span>
                  </TableCell>
                )}
                {isVisible("groupCount") && (
                  <TableCell>
                    {c.groupCount > 0 ? (
                      <button className="text-[13px] text-primary hover:underline">
                        {c.groupCount}
                      </button>
                    ) : (
                      <span className="text-[13px]">{c.groupCount}</span>
                    )}
                  </TableCell>
                )}
                {isVisible("creator") && (
                  <TableCell>
                    <span className="text-[13px]">{c.creator}</span>
                  </TableCell>
                )}
                {isVisible("dateCreated") && (
                  <TableCell>
                    <span className="text-[13px]">{formatCampaignDate(c.dateCreated)}</span>
                  </TableCell>
                )}
                <TableCell>
                  <button
                    type="button"
                    disabled
                    className="text-muted-foreground/60 cursor-default"
                    aria-label="Row actions"
                  >
                    <i className="bi bi-three-dots-vertical" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="flex items-stretch w-full">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={cn(
              "flex items-center justify-center gap-2 px-6 h-16 bg-[#edf2f9] border border-border rounded-bl-lg text-[15px]",
              currentPage === 1
                ? "text-muted-foreground cursor-not-allowed"
                : "text-foreground hover:bg-muted"
            )}
          >
            <i className="bi bi-arrow-left" />
            Prev
          </button>
          <div className="flex-1 flex items-center justify-center gap-2 border-y border-border bg-white">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(0, 5)
              .map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center text-[15px] rounded",
                    currentPage === page
                      ? "border-b-2 border-primary font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {page}
                </button>
              ))}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className={cn(
              "flex items-center justify-center gap-2 px-6 h-16 bg-[#edf2f9] border border-border rounded-br-lg text-[15px]",
              currentPage === totalPages || totalPages === 0
                ? "text-muted-foreground cursor-not-allowed"
                : "text-foreground hover:bg-muted"
            )}
          >
            Next
            <i className="bi bi-arrow-right" />
          </button>
        </div>
        <span className="text-[13px] text-foreground">
          Viewing {sorted.length === 0 ? 0 : startIndex + 1} -{" "}
          {Math.min(endIndex, sorted.length)} of {sorted.length}
        </span>
      </div>
    </div>
  );
}
