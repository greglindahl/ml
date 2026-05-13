import { useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Request,
  formatRequestStatus,
  formatCampaignDate,
} from "@/lib/mockCampaignData";

interface RequestsTableProps {
  requests: Request[];
  searchQuery?: string;
  perPage?: number;
}

type SortField = "name" | "status" | "requestType" | "campaign" | "creator" | "createdDate" | "views" | "shares";
type SortDirection = "asc" | "desc";

export function RequestsTable({ requests, searchQuery, perPage = 40 }: RequestsTableProps) {
  const [sortField, setSortField] = useState<SortField>("createdDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = perPage;

  // Filter by search query
  const filteredRequests = requests.filter((request) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      request.name.toLowerCase().includes(query) ||
      request.requestType.toLowerCase().includes(query) ||
      request.creator.name.toLowerCase().includes(query) ||
      (request.campaignName && request.campaignName.toLowerCase().includes(query))
    );
  });

  // Sort requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "requestType":
        comparison = a.requestType.localeCompare(b.requestType);
        break;
      case "campaign":
        comparison = (a.campaignName || "").localeCompare(b.campaignName || "");
        break;
      case "creator":
        comparison = a.creator.name.localeCompare(b.creator.name);
        break;
      case "createdDate":
        comparison = a.createdDate.getTime() - b.createdDate.getTime();
        break;
      case "views":
        comparison = a.views - b.views;
        break;
      case "shares":
        comparison = a.shares - b.shares;
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Paginate
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = sortedRequests.slice(startIndex, endIndex);

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
      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f9fbfd]">
              <TableHead className="w-[80px]" />
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Request Name
                  <SortIcon field="name" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Status
                  <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("requestType")}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Request Type
                  <SortIcon field="requestType" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("campaign")}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Campaign
                  <SortIcon field="campaign" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("creator")}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Creator
                  <SortIcon field="creator" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("createdDate")}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Created
                  <SortIcon field="createdDate" />
                </div>
              </TableHead>
              <TableHead>
                <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Assignee
                </div>
              </TableHead>
              <TableHead>
                <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Recipient
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("views")}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Views
                  <SortIcon field="views" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("shares")}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Shares
                  <SortIcon field="shares" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRequests.map((request) => (
              <TableRow key={request.id} className="group">
                <TableCell>
                  <div className="w-16 h-16 rounded overflow-hidden bg-[#d2ddec] flex items-center justify-center">
                    {request.thumbnailUrl ? (
                      <img
                        src={request.thumbnailUrl}
                        alt={request.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className="bi bi-image text-2xl text-muted-foreground/50" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <button className="text-[13px] text-primary hover:underline text-left">
                    {request.name}
                  </button>
                </TableCell>
                <TableCell>
                  <span className="text-[13px]">
                    {formatRequestStatus(request.status)} |{" "}
                    {formatCampaignDate(request.statusDate)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-[13px]">{request.requestType}</span>
                </TableCell>
                <TableCell>
                  {request.campaignName ? (
                    <button className="text-[13px] text-primary hover:underline text-left">
                      {request.campaignName}
                    </button>
                  ) : (
                    <span className="text-[13px] text-muted-foreground">--</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 text-[10px]">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                        {request.creator.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[13px] text-primary">
                      {request.creator.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-[13px]">
                    {formatCampaignDate(request.createdDate)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-1">
                    {request.assignees.slice(0, 2).map((assignee) => (
                      <Avatar
                        key={assignee.id}
                        className="h-6 w-6 border-2 border-white text-[10px]"
                      >
                        <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                          {assignee.initials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {request.assignees.length > 2 && (
                      <Avatar className="h-6 w-6 border-2 border-white text-[10px]">
                        <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                          +{request.assignees.length - 2}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-1">
                    {request.recipients.slice(0, 2).map((recipient) => (
                      <Avatar
                        key={recipient.id}
                        className="h-6 w-6 border-2 border-white text-[10px]"
                      >
                        <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                          {recipient.initials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {request.recipients.length > 2 && (
                      <Avatar className="h-6 w-6 border-2 border-white text-[10px]">
                        <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                          +{request.recipients.length - 2}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-[13px]">{request.views}</span>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "text-[13px]",
                      request.shares > 0 && "text-primary"
                    )}
                  >
                    {request.shares}
                  </span>
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
          Viewing {startIndex + 1} -{" "}
          {Math.min(endIndex, sortedRequests.length)} of{" "}
          {sortedRequests.length}
        </span>
      </div>
    </div>
  );
}
