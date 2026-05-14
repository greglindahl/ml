import { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const GROUPS_TABLE_COLUMNS = [
  { key: "name", label: "Group Name" },
  { key: "userCount", label: "Users" },
  { key: "creator", label: "Creator" },
  { key: "dateCreated", label: "Date Created" },
] as const;

export type GroupsTableColumnKey = typeof GROUPS_TABLE_COLUMNS[number]["key"];
export type GroupsTableColumnVisibility = Record<GroupsTableColumnKey, boolean>;

export const DEFAULT_GROUPS_TABLE_COLUMN_VISIBILITY: GroupsTableColumnVisibility = {
  name: true,
  userCount: true,
  creator: true,
  dateCreated: true,
};

const PER_PAGE_KEY = "tablePerPage.groups";
const COLUMN_VISIBILITY_KEY = "tableColumns.groups.v1";

export function useGroupsPerPage(defaultValue = 40) {
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

export function useGroupsColumnVisibility() {
  const [columnVisibility, setColumnVisibility] = useState<GroupsTableColumnVisibility>(() => {
    if (typeof window === "undefined") return DEFAULT_GROUPS_TABLE_COLUMN_VISIBILITY;
    const stored = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_GROUPS_TABLE_COLUMN_VISIBILITY, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_GROUPS_TABLE_COLUMN_VISIBILITY;
      }
    }
    return DEFAULT_GROUPS_TABLE_COLUMN_VISIBILITY;
  });

  useEffect(() => {
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  return [columnVisibility, setColumnVisibility] as const;
}

interface GroupsSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perPage: number;
  onPerPageChange: (value: number) => void;
  columnVisibility: GroupsTableColumnVisibility;
  onColumnVisibilityChange: (value: GroupsTableColumnVisibility) => void;
}

export function GroupsSettingsDrawer({
  open,
  onOpenChange,
  perPage,
  onPerPageChange,
  columnVisibility,
  onColumnVisibilityChange,
}: GroupsSettingsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[320px] sm:w-[360px]">
        <SheetHeader>
          <SheetTitle>Table Preferences</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
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
                onClick={() => onColumnVisibilityChange(DEFAULT_GROUPS_TABLE_COLUMN_VISIBILITY)}
              >
                Restore Default
              </button>
            </div>
            <div className="space-y-2">
              {GROUPS_TABLE_COLUMNS.map((col) => (
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
