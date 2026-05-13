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

export type CampaignsSettingsTab = "table" | "filters";

// Column definitions for Table View - matches CampaignsTable columns
export const CAMPAIGNS_TABLE_COLUMNS = [
  { key: "thumbnail", label: "Thumbnail" },
  { key: "name", label: "Request Name" },
  { key: "status", label: "Status" },
  { key: "requestType", label: "Request Type" },
  { key: "creator", label: "Creator" },
  { key: "created", label: "Created" },
  { key: "assignee", label: "Assignee" },
  { key: "recipient", label: "Recipient" },
  { key: "views", label: "Views" },
  { key: "shares", label: "Shares" },
] as const;

export type CampaignsTableColumnKey = typeof CAMPAIGNS_TABLE_COLUMNS[number]["key"];
export type CampaignsTableColumnVisibility = Record<CampaignsTableColumnKey, boolean>;

export const DEFAULT_CAMPAIGNS_TABLE_COLUMN_VISIBILITY: CampaignsTableColumnVisibility = {
  thumbnail: true,
  name: true,
  status: true,
  requestType: true,
  creator: true,
  created: true,
  assignee: true,
  recipient: true,
  views: true,
  shares: true,
};

// Filter definitions for Filters tab
export const CAMPAIGNS_FILTERS = [
  { key: "creator", label: "Creator" },
  { key: "createdDate", label: "Created Date" },
  { key: "archived", label: "Archived" },
] as const;

export type CampaignsFilterKey = typeof CAMPAIGNS_FILTERS[number]["key"];
export type CampaignsFilterVisibility = Record<CampaignsFilterKey, boolean>;

export const DEFAULT_CAMPAIGNS_FILTER_VISIBILITY: CampaignsFilterVisibility = {
  creator: true,
  createdDate: true,
  archived: false,
};

// Storage keys
const PER_PAGE_KEY = "tablePerPage.campaigns";
const COLUMN_VISIBILITY_KEY = "tableColumns.campaigns.v1";
const FILTER_VISIBILITY_KEY = "filterVisibility.campaigns";

// Hooks
export function useCampaignsPerPage(defaultValue = 40) {
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

export function useCampaignsColumnVisibility() {
  const [columnVisibility, setColumnVisibility] = useState<CampaignsTableColumnVisibility>(() => {
    if (typeof window === "undefined") return DEFAULT_CAMPAIGNS_TABLE_COLUMN_VISIBILITY;
    const stored = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_CAMPAIGNS_TABLE_COLUMN_VISIBILITY, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_CAMPAIGNS_TABLE_COLUMN_VISIBILITY;
      }
    }
    return DEFAULT_CAMPAIGNS_TABLE_COLUMN_VISIBILITY;
  });

  useEffect(() => {
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  return [columnVisibility, setColumnVisibility] as const;
}

export function useCampaignsFilterVisibility() {
  const [filterVisibility, setFilterVisibility] = useState<CampaignsFilterVisibility>(() => {
    if (typeof window === "undefined") return DEFAULT_CAMPAIGNS_FILTER_VISIBILITY;
    const stored = localStorage.getItem(FILTER_VISIBILITY_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_CAMPAIGNS_FILTER_VISIBILITY, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_CAMPAIGNS_FILTER_VISIBILITY;
      }
    }
    return DEFAULT_CAMPAIGNS_FILTER_VISIBILITY;
  });

  useEffect(() => {
    localStorage.setItem(FILTER_VISIBILITY_KEY, JSON.stringify(filterVisibility));
  }, [filterVisibility]);

  return [filterVisibility, setFilterVisibility] as const;
}

interface CampaignsSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perPage: number;
  onPerPageChange: (value: number) => void;
  columnVisibility: CampaignsTableColumnVisibility;
  onColumnVisibilityChange: (value: CampaignsTableColumnVisibility) => void;
  filterVisibility: CampaignsFilterVisibility;
  onFilterVisibilityChange: (value: CampaignsFilterVisibility) => void;
  defaultTab?: CampaignsSettingsTab;
}

export function CampaignsSettingsDrawer({
  open,
  onOpenChange,
  perPage,
  onPerPageChange,
  columnVisibility,
  onColumnVisibilityChange,
  filterVisibility,
  onFilterVisibilityChange,
  defaultTab = "table",
}: CampaignsSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<CampaignsSettingsTab>(defaultTab);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[320px] sm:w-[360px]">
        <SheetHeader>
          <SheetTitle>View Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CampaignsSettingsTab)}>
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
                Table View
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
                    onClick={() => onColumnVisibilityChange(DEFAULT_CAMPAIGNS_TABLE_COLUMN_VISIBILITY)}
                  >
                    Restore Default
                  </button>
                </div>
                <div className="space-y-2">
                  {CAMPAIGNS_TABLE_COLUMNS.map((col) => (
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
                  onClick={() => onFilterVisibilityChange(DEFAULT_CAMPAIGNS_FILTER_VISIBILITY)}
                >
                  Restore Default
                </button>
              </div>
              <div className="space-y-2">
                {CAMPAIGNS_FILTERS.map((filter) => (
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
