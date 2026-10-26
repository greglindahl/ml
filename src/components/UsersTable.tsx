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
import {
  USERS_TABLE_COLUMNS,
  type UsersTableColumnKey,
  type UsersTableColumnVisibility,
} from "./UsersSettingsDrawer";

interface UsersTableProps {
  users: User[];
  searchQuery?: string;
  perPage?: number;
  columnVisibility?: UsersTableColumnVisibility;
}

// Prod's sortable columns (Role isn't sortable there) and the direction each starts in.
type SortField = "name" | "groups" | "joinDate" | "lastLogin" | "instagram" | "facebook" | "x" | "tikTok" | "lastDownload" | "lastShare";
const FIRST_DIRECTION: Record<SortField, "asc" | "desc"> = {
  name: "asc",
  groups: "desc",
  joinDate: "desc",
  lastLogin: "desc",
  instagram: "asc",
  facebook: "asc",
  x: "asc",
  tikTok: "asc",
  lastDownload: "desc",
  lastShare: "desc",
};
const SOCIAL = ["instagram", "facebook", "x", "tikTok"] as const;
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

  // Sort (empty values always last)
  const sortValue = (u: User): string | number | null => {
    switch (sortField) {
      case "name": return u.name.toLowerCase();
      case "groups": return u.groups.length;
      case "joinDate": return u.joinDate.getTime();
      case "lastLogin": return u.lastLogin.getTime();
      case "lastDownload": return u.lastDownload?.getTime() ?? null;
      case "lastShare": return u.lastShare?.getTime() ?? null;
      default: return u[sortField]?.toLowerCase() ?? null;
    }
  };
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const av = sortValue(a);
    const bv = sortValue(b);
    if (av === null || bv === null) return av === bv ? 0 : av === null ? 1 : -1;
    const comparison = av < bv ? -1 : av > bv ? 1 : 0;
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
      setSortDirection(FIRST_DIRECTION[field]);
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

  const empty = <span className="text-muted-foreground">--</span>;
  const renderCell = (user: User, key: UsersTableColumnKey) => {
    switch (key) {
      // Prod: the user's AI Assist headshot, or a fallback silhouette.
      case "aiImage":
        return (
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-muted text-muted-foreground">
              <i className="bi bi-person-fill text-lg" />
            </AvatarFallback>
          </Avatar>
        );
      case "name":
        return (
          <div className="flex flex-col">
            <button className="text-[15px] text-primary hover:underline text-left">{user.name}</button>
            <span className="text-[13px] text-muted-foreground">{user.email}</span>
          </div>
        );
      case "role": return user.role;
      case "aiAssist": return user.aiAssist;
      case "inviteCode": return user.inviteCode ?? empty;
      case "groups":
        return user.groups.length ? <button className="text-primary hover:underline">{user.groups.length}</button> : 0;
      case "joinDate": return formatCampaignDate(user.joinDate);
      case "lastLogin": return formatCampaignDate(user.lastLogin);
      case "lastDownload": return user.lastDownload ? formatCampaignDate(user.lastDownload) : null;
      case "lastShare": return user.lastShare ? formatCampaignDate(user.lastShare) : null;
      case "galleries":
        return user.galleryCount ? <button className="text-primary hover:underline">{user.galleryCount}</button> : 0;
      case "notifications":
        return user.notifications === "Enabled" ? <i className="bi bi-check-lg text-lg text-success" aria-label="On" /> : null;
      default: {
        // Social handles link out; with none, prod shows an edit badge to add one.
        const handle = user[key as (typeof SOCIAL)[number]];
        return handle ? (
          <a href="#" onClick={(e) => e.preventDefault()} className="text-primary hover:underline whitespace-nowrap">{handle}</a>
        ) : (
          <button className="inline-flex items-center justify-center rounded bg-primary/10 text-primary p-1.5" aria-label="Update social handles">
            <i className="bi bi-pencil-square" />
          </button>
        );
      }
    }
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
              {USERS_TABLE_COLUMNS.filter((c) => isVisible(c.key)).map((c) => {
                const sortable = c.key in FIRST_DIRECTION;
                const centered = c.key === "groups" || c.key === "galleries" || c.key === "notifications";
                return (
                  <TableHead
                    key={c.key}
                    className={cn("whitespace-nowrap", sortable && "cursor-pointer select-none")}
                    onClick={sortable ? () => handleSort(c.key as SortField) : undefined}
                  >
                    <div className={cn("flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground", centered && "justify-center")}>
                      {c.key === "aiImage" ? <span className="sr-only">{c.label}</span> : c.label}
                      {sortable && <SortIcon field={c.key as SortField} />}
                    </div>
                  </TableHead>
                );
              })}
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
                {USERS_TABLE_COLUMNS.filter((c) => isVisible(c.key)).map((c) => (
                  <TableCell key={c.key} className={cn("text-[13px]", (c.key === "groups" || c.key === "galleries" || c.key === "notifications") && "text-center")}>
                    {renderCell(user, c.key)}
                  </TableCell>
                ))}
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
