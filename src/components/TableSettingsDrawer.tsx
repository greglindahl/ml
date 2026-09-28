import { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

/**
 * Config-driven twin of RequestsSettingsDrawer: right-side "View Settings" with
 * Table Preferences (per page + Manage Columns) and, when the list has filters,
 * a Filters tab that pins which dropdowns show in the filter row.
 */

export interface SettingsOption {
  key: string;
  label: string;
}

export type VisibilityMap = Record<string, boolean>;

/** localStorage-backed visibility map; new keys pick up their defaults. */
export function useVisibilityPreference(storageKey: string, defaults: VisibilityMap) {
  const [value, setValue] = useState<VisibilityMap>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Storage unavailable — preference just won't persist.
    }
  }, [storageKey, value]);

  return [value, setValue] as const;
}

export const allVisible = (options: SettingsOption[]): VisibilityMap =>
  Object.fromEntries(options.map((o) => [o.key, true]));

interface TableSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perPage: number;
  onPerPageChange: (value: number) => void;
  columns: SettingsOption[];
  columnVisibility: VisibilityMap;
  defaultColumnVisibility: VisibilityMap;
  onColumnVisibilityChange: (value: VisibilityMap) => void;
  filters?: SettingsOption[];
  filterVisibility?: VisibilityMap;
  defaultFilterVisibility?: VisibilityMap;
  onFilterVisibilityChange?: (value: VisibilityMap) => void;
}

function VisibilityList({
  label,
  options,
  value,
  defaults,
  onChange,
}: {
  label: string;
  options: SettingsOption[];
  value: VisibilityMap;
  defaults: VisibilityMap;
  onChange: (value: VisibilityMap) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-[13px] text-muted-foreground">{label}</Label>
        <button type="button" className="text-[13px] text-primary hover:underline" onClick={() => onChange(defaults)}>
          Restore Default
        </button>
      </div>
      <div className="space-y-2">
        {options.map((opt) => (
          <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={value[opt.key] !== false}
              onCheckedChange={() => onChange({ ...value, [opt.key]: value[opt.key] === false })}
            />
            <span className="text-sm">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function TableSettingsDrawer({
  open,
  onOpenChange,
  perPage,
  onPerPageChange,
  columns,
  columnVisibility,
  defaultColumnVisibility,
  onColumnVisibilityChange,
  filters,
  filterVisibility,
  defaultFilterVisibility,
  onFilterVisibilityChange,
}: TableSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<"table" | "filters">("table");
  const hasFiltersTab = !!(filters?.length && filterVisibility && defaultFilterVisibility && onFilterVisibilityChange);

  const tabClass = (tab: "table" | "filters") =>
    cn(
      "flex items-center gap-2 px-3 py-2 text-[13px] border-b-2 rounded-none",
      activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground",
    );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[320px] sm:w-[360px]">
        <SheetHeader>
          <SheetTitle>View Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "table" | "filters")}>
            <TabsList className="w-full border-b border-gray-200 pb-0 gap-0">
              <TabsTrigger value="table" className={tabClass("table")}>
                <i className="bi bi-table text-[15px]" />
                Table Preferences
              </TabsTrigger>
              {hasFiltersTab && (
                <TabsTrigger value="filters" className={tabClass("filters")}>
                  <i className={`bi ${activeTab === "filters" ? "bi-filter-square-fill" : "bi-filter"} text-[15px]`} />
                  Filters
                </TabsTrigger>
              )}
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

              <VisibilityList
                label="Manage Columns"
                options={columns}
                value={columnVisibility}
                defaults={defaultColumnVisibility}
                onChange={onColumnVisibilityChange}
              />
            </TabsContent>

            {hasFiltersTab && (
              <TabsContent value="filters" className="mt-6">
                <VisibilityList
                  label="Manage Filters"
                  options={filters!}
                  value={filterVisibility!}
                  defaults={defaultFilterVisibility!}
                  onChange={onFilterVisibilityChange!}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
