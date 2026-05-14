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
import type { Group } from "@/lib/mockGroupData";
import { formatCampaignDate } from "@/lib/mockCampaignData";
import type {
  GroupsTableColumnKey,
  GroupsTableColumnVisibility,
} from "./GroupsSettingsDrawer";

interface GroupsTableProps {
  groups: Group[];
  searchQuery?: string;
  perPage?: number;
  columnVisibility?: GroupsTableColumnVisibility;
}

type SortField = "name" | "userCount" | "creator" | "dateCreated";
type SortDirection = "asc" | "desc";

export function GroupsTable({
  groups,
  searchQuery,
  perPage = 40,
  columnVisibility,
}: GroupsTableProps) {
  const [sortField, setSortField] = useState<SortField>("dateCreated");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = perPage;

  const isVisible = (key: GroupsTableColumnKey) =>
    columnVisibility?.[key] !== false;

  const filteredGroups = groups.filter((g) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) || g.creator.toLowerCase().includes(q)
    );
  });

  const sortedGroups = [...filteredGroups].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "userCount":
        comparison = a.userCount - b.userCount;
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

  const totalPages = Math.ceil(sortedGroups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginated = sortedGroups.slice(startIndex, endIndex);

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
              {isVisible("name") && (
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Group Name
                    <SortIcon field="name" />
                  </div>
                </TableHead>
              )}
              {isVisible("userCount") && (
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("userCount")}
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Users
                    <SortIcon field="userCount" />
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
            {paginated.map((g) => (
              <TableRow key={g.id} className="group">
                {isVisible("name") && (
                  <TableCell>
                    <button className="text-[13px] text-primary hover:underline text-left">
                      {g.name}
                    </button>
                  </TableCell>
                )}
                {isVisible("userCount") && (
                  <TableCell>
                    <button className="text-[13px] text-primary hover:underline">
                      {g.userCount}
                    </button>
                  </TableCell>
                )}
                {isVisible("creator") && (
                  <TableCell>
                    <span className="text-[13px]">{g.creator}</span>
                  </TableCell>
                )}
                {isVisible("dateCreated") && (
                  <TableCell>
                    <span className="text-[13px]">{formatCampaignDate(g.dateCreated)}</span>
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
          Viewing {sortedGroups.length === 0 ? 0 : startIndex + 1} -{" "}
          {Math.min(endIndex, sortedGroups.length)} of {sortedGroups.length}
        </span>
      </div>
    </div>
  );
}
