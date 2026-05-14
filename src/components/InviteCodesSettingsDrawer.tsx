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

export const INVITE_CODES_TABLE_COLUMNS = [
  { key: "code", label: "Invite Code" },
  { key: "groupCount", label: "Groups" },
  { key: "creator", label: "Creator" },
  { key: "dateCreated", label: "Date Created" },
] as const;

export type InviteCodesTableColumnKey = typeof INVITE_CODES_TABLE_COLUMNS[number]["key"];
export type InviteCodesTableColumnVisibility = Record<InviteCodesTableColumnKey, boolean>;

export const DEFAULT_INVITE_CODES_TABLE_COLUMN_VISIBILITY: InviteCodesTableColumnVisibility = {
  code: true,
  groupCount: true,
  creator: true,
  dateCreated: true,
};

const PER_PAGE_KEY = "tablePerPage.invite-codes";
const COLUMN_VISIBILITY_KEY = "tableColumns.invite-codes.v1";

export function useInviteCodesPerPage(defaultValue = 40) {
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

export function useInviteCodesColumnVisibility() {
  const [columnVisibility, setColumnVisibility] = useState<InviteCodesTableColumnVisibility>(() => {
    if (typeof window === "undefined") return DEFAULT_INVITE_CODES_TABLE_COLUMN_VISIBILITY;
    const stored = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_INVITE_CODES_TABLE_COLUMN_VISIBILITY, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_INVITE_CODES_TABLE_COLUMN_VISIBILITY;
      }
    }
    return DEFAULT_INVITE_CODES_TABLE_COLUMN_VISIBILITY;
  });

  useEffect(() => {
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  return [columnVisibility, setColumnVisibility] as const;
}

interface InviteCodesSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perPage: number;
  onPerPageChange: (value: number) => void;
  columnVisibility: InviteCodesTableColumnVisibility;
  onColumnVisibilityChange: (value: InviteCodesTableColumnVisibility) => void;
}

export function InviteCodesSettingsDrawer({
  open,
  onOpenChange,
  perPage,
  onPerPageChange,
  columnVisibility,
  onColumnVisibilityChange,
}: InviteCodesSettingsDrawerProps) {
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
                onClick={() => onColumnVisibilityChange(DEFAULT_INVITE_CODES_TABLE_COLUMN_VISIBILITY)}
              >
                Restore Default
              </button>
            </div>
            <div className="space-y-2">
              {INVITE_CODES_TABLE_COLUMNS.map((col) => (
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
