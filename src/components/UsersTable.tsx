import { useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/mockUserData";
import { formatCampaignDate } from "@/lib/mockCampaignData";
import type {
  UsersTableColumnKey,
  UsersTableColumnVisibility,
} from "./UsersSettingsDrawer";

interface UsersTableProps {
  users: User[];
  searchQuery?: string;
  perPage?: number;
  columnVisibility?: UsersTableColumnVisibility;
}

type SortField = "name" | "role" | "joinDate";
type SortDirection = "asc" | "desc";

export function UsersTable({
  users,
  searchQuery,
  perPage = 40,
  columnVisibility,
}: UsersTableProps) {
  const [sortField, setSortField] = useState<SortField>("joinDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const itemsPerPage = perPage;

  const isVisible = (key: UsersTableColumnKey) =>
    columnVisibility?.[key] !== false;

  // Filter by search query
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query) ||
      (user.inviteCode?.toLowerCase().includes(query) ?? false)
    );
  });

  // Sort
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "role":
        comparison = a.role.localeCompare(b.role);
        break;
      case "joinDate":
        comparison = a.joinDate.getTime() - b.joinDate.getTime();
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Paginate
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

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

  const visibleIds = paginatedUsers.map((u) => u.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected =
    visibleIds.some((id) => selectedIds.has(id)) && !allVisibleSelected;

  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col border rounded-lg bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f9fbfd]">
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    allVisibleSelected
                      ? true
                      : someVisibleSelected
                      ? "indeterminate"
                      : false
                  }
                  onCheckedChange={toggleAllVisible}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Select all visible users"
                />
              </TableHead>
              {isVisible("name") && (
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Name
                    <SortIcon field="name" />
                  </div>
                </TableHead>
              )}
              {isVisible("role") && (
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("role")}
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Role
                    <SortIcon field="role" />
                  </div>
                </TableHead>
              )}
              {isVisible("aiAssist") && (
                <TableHead>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    AI Assist
                  </div>
                </TableHead>
              )}
              {isVisible("inviteCode") && (
                <TableHead>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Invite Code
                  </div>
                </TableHead>
              )}
              {isVisible("groups") && (
                <TableHead>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Groups
                  </div>
                </TableHead>
              )}
              {isVisible("joinDate") && (
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("joinDate")}
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Join Date
                    <SortIcon field="joinDate" />
                  </div>
                </TableHead>
              )}
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.id} className="group">
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(user.id)}
                    onCheckedChange={() => toggleOne(user.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${user.name}`}
                  />
                </TableCell>
                {isVisible("name") && (
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 text-[12px]">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <button className="text-[13px] text-primary hover:underline text-left">
                          {user.name}
                        </button>
                        <span className="text-[13px] text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                )}
                {isVisible("role") && (
                  <TableCell>
                    <span className="text-[13px]">{user.role}</span>
                  </TableCell>
                )}
                {isVisible("aiAssist") && (
                  <TableCell>
                    <span className="text-[13px]">{user.aiAssist}</span>
                  </TableCell>
                )}
                {isVisible("inviteCode") && (
                  <TableCell>
                    {user.inviteCode ? (
                      <span className="text-[13px]">{user.inviteCode}</span>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">--</span>
                    )}
                  </TableCell>
                )}
                {isVisible("groups") && (
                  <TableCell>
                    <button className="text-[13px] text-primary hover:underline">
                      {user.groups.length}
                    </button>
                  </TableCell>
                )}
                {isVisible("joinDate") && (
                  <TableCell>
                    <span className="text-[13px]">
                      {formatCampaignDate(user.joinDate)}
                    </span>
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
          Viewing {sortedUsers.length === 0 ? 0 : startIndex + 1} -{" "}
          {Math.min(endIndex, sortedUsers.length)} of {sortedUsers.length}
        </span>
      </div>
    </div>
  );
}
