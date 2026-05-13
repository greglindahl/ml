import { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type RequestsSettingsTab = "table" | "filters";

// Column definitions for Table View - matches RequestsTable columns
export const REQUESTS_TABLE_COLUMNS = [
  { key: "thumbnail", label: "Thumbnail" },
  { key: "name", label: "Request Name" },
  { key: "status", label: "Status" },
  { key: "requestType", label: "Request Type" },
  { key: "campaign", label: "Campaign" },
  { key: "creator", label: "Creator" },
  { key: "created", label: "Created" },
  { key: "assignee", label: "Assignee" },
  { key: "recipient", label: "Recipient" },
  { key: "views", label: "Views" },
  { key: "shares", label: "Shares" },
] as const;

export type RequestsTableColumnKey = typeof REQUESTS_TABLE_COLUMNS[number]["key"];
export type RequestsTableColumnVisibility = Record<RequestsTableColumnKey, boolean>;

export const DEFAULT_REQUESTS_TABLE_COLUMN_VISIBILITY: RequestsTableColumnVisibility = {
  thumbnail: true,
  name: true,
  status: true,
  requestType: true,
  campaign: true,
  creator: true,
  created: true,
  assignee: true,
  recipient: true,
  views: true,
  shares: true,
};

// Filter definitions for Filters tab
export const REQUESTS_FILTERS = [
  { key: "campaign", label: "Campaign" },
  { key: "requestType", label: "Request Type" },
  { key: "status", label: "Status" },
  { key: "creator", label: "Creator" },
  { key: "createdDate", label: "Created Date" },
  { key: "assignee", label: "Assignee" },
  { key: "recipient", label: "Recipient" },
  { key: "flagged", label: "Flagged" },
  { key: "archived", label: "Archived" },
] as const;

export type RequestsFilterKey = typeof REQUESTS_FILTERS[number]["key"];
export type RequestsFilterVisibility = Record<RequestsFilterKey, boolean>;

export const DEFAULT_REQUESTS_FILTER_VISIBILITY: RequestsFilterVisibility = {
  campaign: true,
  requestType: true,
  status: true,
  creator: true,
  createdDate: true,
  assignee: true,
  recipient: true,
  flagged: false,
  archived: false,
};

// Storage keys
const PER_PAGE_KEY = "tablePerPage.requests";
const COLUMN_VISIBILITY_KEY = "tableColumns.requests.v1";
const FILTER_VISIBILITY_KEY = "filterVisibility.requests";

// Hooks
export function useRequestsPerPage(defaultValue = 40) {
  const [perPage, setPerPage] = useState<number>(() => {
    if (typeof window === "undefined") return defaultValue;
    const stored = localStorage.getItem(PER_PAGE_KEY);
    return stored ? Number(stored) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(PER_PAGE_KEY, String(perPage));
  }, [perPage]);

  return [perPage, setPerPage] as const;
}

export function useRequestsColumnVisibility() {
  const [columnVisibility, setColumnVisibility] = useState<RequestsTableColumnVisibility>(() => {
    if (typeof window === "undefined") return DEFAULT_REQUESTS_TABLE_COLUMN_VISIBILITY;
    const stored = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_REQUESTS_TABLE_COLUMN_VISIBILITY, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_REQUESTS_TABLE_COLUMN_VISIBILITY;
      }
    }
    return DEFAULT_REQUESTS_TABLE_COLUMN_VISIBILITY;
  });

  useEffect(() => {
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  return [columnVisibility, setColumnVisibility] as const;
}

export function useRequestsFilterVisibility() {
  const [filterVisibility, setFilterVisibility] = useState<RequestsFilterVisibility>(() => {
    if (typeof window === "undefined") return DEFAULT_REQUESTS_FILTER_VISIBILITY;
    const stored = localStorage.getItem(FILTER_VISIBILITY_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_REQUESTS_FILTER_VISIBILITY, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_REQUESTS_FILTER_VISIBILITY;
      }
    }
    return DEFAULT_REQUESTS_FILTER_VISIBILITY;
  });

  useEffect(() => {
    localStorage.setItem(FILTER_VISIBILITY_KEY, JSON.stringify(filterVisibility));
  }, [filterVisibility]);

  return [filterVisibility, setFilterVisibility] as const;
}

interface RequestsSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perPage: number;
  onPerPageChange: (value: number) => void;
  columnVisibility: RequestsTableColumnVisibility;
  onColumnVisibilityChange: (value: RequestsTableColumnVisibility) => void;
  filterVisibility: RequestsFilterVisibility;
  onFilterVisibilityChange: (value: RequestsFilterVisibility) => void;
  defaultTab?: RequestsSettingsTab;
}

export function RequestsSettingsDrawer({
  open,
  onOpenChange,
  perPage,
  onPerPageChange,
  columnVisibility,
  onColumnVisibilityChange,
  filterVisibility,
  onFilterVisibilityChange,
  defaultTab = "table",
}: RequestsSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<RequestsSettingsTab>(defaultTab);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[320px] sm:w-[360px]">
        <SheetHeader>
          <SheetTitle>View Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RequestsSettingsTab)}>
            <TabsList className="w-full border-b border-gray-200 pb-0 gap-0">
              <TabsTrigger
                value="table"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-[13px] border-b-2 rounded-none",
                  activeTab === "table"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground"
                )}
              >
                <i className={`bi ${activeTab === "table" ? "bi-table" : "bi-table"} text-[15px]`} />
                Table Preferences
              </TabsTrigger>
              <TabsTrigger
                value="filters"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-[13px] border-b-2 rounded-none",
                  activeTab === "filters"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground"
                )}
              >
                <i className={`bi ${activeTab === "filters" ? "bi-filter-square-fill" : "bi-filter"} text-[15px]`} />
                Filters
              </TabsTrigger>
            </TabsList>

            {/* Table View Tab */}
            <TabsContent value="table" className="mt-6 space-y-6">
              {/* Results per page */}
              <div className="space-y-2">
                <Label className="text-[13px] text-muted-foreground">Results per page</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {perPage} per page
                      <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full bg-white">
                    {[10, 20, 40, 100].map((option) => (
                      <DropdownMenuItem key={option} onClick={() => onPerPageChange(option)}>
                        {option} per page
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Manage Columns */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px] text-muted-foreground">Manage Columns</Label>
                  <button
                    type="button"
                    className="text-[13px] text-primary hover:underline"
                    onClick={() => onColumnVisibilityChange(DEFAULT_REQUESTS_TABLE_COLUMN_VISIBILITY)}
                  >
                    Restore Default
                  </button>
                </div>
                <div className="space-y-2">
                  {REQUESTS_TABLE_COLUMNS.map((col) => (
                    <label key={col.key} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={columnVisibility[col.key]}
                        onCheckedChange={() =>
                          onColumnVisibilityChange({
                            ...columnVisibility,
                            [col.key]: !columnVisibility[col.key],
                          })
                        }
                      />
                      <span className="text-sm">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Filters Tab */}
            <TabsContent value="filters" className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[13px] text-muted-foreground">Manage Filters</Label>
                <button
                  type="button"
                  className="text-[13px] text-primary hover:underline"
                  onClick={() => onFilterVisibilityChange(DEFAULT_REQUESTS_FILTER_VISIBILITY)}
                >
                  Restore Default
                </button>
              </div>
              <div className="space-y-2">
                {REQUESTS_FILTERS.map((filter) => (
                  <label key={filter.key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={filterVisibility[filter.key]}
                      onCheckedChange={() =>
                        onFilterVisibilityChange({
                          ...filterVisibility,
                          [filter.key]: !filterVisibility[filter.key],
                        })
                      }
                    />
                    <span className="text-sm">{filter.label}</span>
                  </label>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
