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

export type UsersSettingsTab = "table" | "filters";

// Column definitions for Table View — matches UsersTable columns.
// Checkbox + 3-dot columns are structural and NOT in this map.
export const USERS_TABLE_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "role", label: "Role" },
  { key: "aiAssist", label: "AI Assist" },
  { key: "inviteCode", label: "Invite Code" },
  { key: "groups", label: "Groups" },
  { key: "joinDate", label: "Join Date" },
] as const;

export type UsersTableColumnKey = typeof USERS_TABLE_COLUMNS[number]["key"];
export type UsersTableColumnVisibility = Record<UsersTableColumnKey, boolean>;

export const DEFAULT_USERS_TABLE_COLUMN_VISIBILITY: UsersTableColumnVisibility = {
  name: true,
  role: true,
  aiAssist: true,
  inviteCode: true,
  groups: true,
  joinDate: true,
};

// Filter definitions for Filters tab
export const USERS_FILTERS = [
  { key: "notifications", label: "Notifications" },
  { key: "roles", label: "Roles" },
  { key: "inviteCodes", label: "Invite Codes" },
  { key: "groups", label: "Groups" },
  { key: "aiAssist", label: "AI Assist" },
  { key: "lastLogin", label: "Last Login" },
  { key: "joinDate", label: "Join Date" },
  { key: "organizationRole", label: "Organization Role" },
  { key: "orgDepartment", label: "Org Department" },
  { key: "duration", label: "Duration" },
] as const;

export type UsersFilterKey = typeof USERS_FILTERS[number]["key"];
export type UsersFilterVisibility = Record<UsersFilterKey, boolean>;

export const DEFAULT_USERS_FILTER_VISIBILITY: UsersFilterVisibility = {
  notifications: true,
  roles: true,
  inviteCodes: true,
  groups: true,
  aiAssist: true,
  lastLogin: true,
  joinDate: true,
  organizationRole: true,
  orgDepartment: true,
  duration: true,
};

// Storage keys
const PER_PAGE_KEY = "tablePerPage.users";
const COLUMN_VISIBILITY_KEY = "tableColumns.users.v1";
const FILTER_VISIBILITY_KEY = "filterVisibility.users";

// Hooks
export function useUsersPerPage(defaultValue = 40) {
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

export function useUsersColumnVisibility() {
  const [columnVisibility, setColumnVisibility] = useState<UsersTableColumnVisibility>(() => {
    if (typeof window === "undefined") return DEFAULT_USERS_TABLE_COLUMN_VISIBILITY;
    const stored = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_USERS_TABLE_COLUMN_VISIBILITY, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_USERS_TABLE_COLUMN_VISIBILITY;
      }
    }
    return DEFAULT_USERS_TABLE_COLUMN_VISIBILITY;
  });

  useEffect(() => {
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  return [columnVisibility, setColumnVisibility] as const;
}

export function useUsersFilterVisibility() {
  const [filterVisibility, setFilterVisibility] = useState<UsersFilterVisibility>(() => {
    if (typeof window === "undefined") return DEFAULT_USERS_FILTER_VISIBILITY;
    const stored = localStorage.getItem(FILTER_VISIBILITY_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_USERS_FILTER_VISIBILITY, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_USERS_FILTER_VISIBILITY;
      }
    }
    return DEFAULT_USERS_FILTER_VISIBILITY;
  });

  useEffect(() => {
    localStorage.setItem(FILTER_VISIBILITY_KEY, JSON.stringify(filterVisibility));
  }, [filterVisibility]);

  return [filterVisibility, setFilterVisibility] as const;
}

interface UsersSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perPage: number;
  onPerPageChange: (value: number) => void;
  columnVisibility: UsersTableColumnVisibility;
  onColumnVisibilityChange: (value: UsersTableColumnVisibility) => void;
  filterVisibility: UsersFilterVisibility;
  onFilterVisibilityChange: (value: UsersFilterVisibility) => void;
  defaultTab?: UsersSettingsTab;
}

export function UsersSettingsDrawer({
  open,
  onOpenChange,
  perPage,
  onPerPageChange,
  columnVisibility,
  onColumnVisibilityChange,
  filterVisibility,
  onFilterVisibilityChange,
  defaultTab = "table",
}: UsersSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<UsersSettingsTab>(defaultTab);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[320px] sm:w-[360px]">
        <SheetHeader>
          <SheetTitle>View Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UsersSettingsTab)}>
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
                <i className="bi bi-table text-[15px]" />
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

            <TabsContent value="table" className="mt-6 space-y-6">
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

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px] text-muted-foreground">Manage Columns</Label>
                  <button
                    type="button"
                    className="text-[13px] text-primary hover:underline"
                    onClick={() => onColumnVisibilityChange(DEFAULT_USERS_TABLE_COLUMN_VISIBILITY)}
                  >
                    Restore Default
                  </button>
                </div>
                <div className="space-y-2">
                  {USERS_TABLE_COLUMNS.map((col) => (
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

            <TabsContent value="filters" className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[13px] text-muted-foreground">Manage Filters</Label>
                <button
                  type="button"
                  className="text-[13px] text-primary hover:underline"
                  onClick={() => onFilterVisibilityChange(DEFAULT_USERS_FILTER_VISIBILITY)}
                >
                  Restore Default
                </button>
              </div>
              <div className="space-y-2">
                {USERS_FILTERS.map((filter) => (
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
