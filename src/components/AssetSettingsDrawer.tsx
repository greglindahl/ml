import { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

export type DisplayLabelOption = "title" | "creator" | "none";
export type SettingsTab = "grid" | "table" | "filters";

// Column definitions for Table View - matches Figma design
export const ASSET_TABLE_COLUMNS = [
  { key: "thumbnail", label: "Asset Thumbnail" },
  { key: "creator", label: "Creator" },
  { key: "added", label: "Added Date" },
  { key: "captured", label: "Capture Date" },
  { key: "details", label: "Details" },
  { key: "metadata", label: "Metadata" },
  { key: "downloads", label: "Downloads" },
  { key: "shares", label: "Shares" },
  { key: "galleries", label: "Galleries" },
  { key: "tags", label: "Tags" },
  { key: "viewers", label: "Viewers" },
  { key: "publicViews", label: "Public Views" },
  { key: "publicDownloads", label: "Public Downloads" },
  { key: "favorites", label: "Favorites" },
  { key: "lastDownloadDate", label: "Last Download Date" },
] as const;

export type AssetTableColumnKey = typeof ASSET_TABLE_COLUMNS[number]["key"];
export type AssetTableColumnVisibility = Record<AssetTableColumnKey, boolean>;

export const DEFAULT_ASSET_TABLE_COLUMN_VISIBILITY: AssetTableColumnVisibility = {
  thumbnail: true,
  creator: true,
  added: true,
  captured: true,
  details: false,
  metadata: false,
  downloads: true,
  shares: true,
  galleries: true,
  tags: true,
  viewers: true,
  publicViews: true,
  publicDownloads: true,
  favorites: true,
  lastDownloadDate: true,
};

// Filter definitions for Filters tab - matches Figma design
export const ASSET_FILTERS = [
  { key: "aiTags", label: "AI Tags" },
  { key: "tags", label: "Tags" },
  { key: "date", label: "Date" },
  { key: "creator", label: "Creator" },
  { key: "type", label: "Type" },
  { key: "ratio", label: "Ratio" },
  { key: "folders", label: "Folders" },
  { key: "source", label: "Source" },
  { key: "unsorted", label: "Unsorted" },
  { key: "unviewedOnly", label: "Unviewed Only" },
  { key: "branded", label: "Branded" },
] as const;

export type AssetFilterKey = typeof ASSET_FILTERS[number]["key"];
export type AssetFilterVisibility = Record<AssetFilterKey, boolean>;

export const DEFAULT_ASSET_FILTER_VISIBILITY: AssetFilterVisibility = {
  aiTags: true,
  tags: true,
  date: true,
  creator: true,
  type: false,
  ratio: false,
  folders: true,
  source: true,
  unsorted: true,
  unviewedOnly: true,
  branded: true,
};

// Storage keys
const DISPLAY_LABEL_KEY = "library-display-label";
const PER_PAGE_KEY = "tablePerPage.assets";
const COLUMN_VISIBILITY_KEY = "tableColumns.assets";
const FILTER_VISIBILITY_KEY = "filterVisibility.assets";

// Hooks
export function useAssetDisplayLabel() {
  const [displayLabel, setDisplayLabel] = useState<DisplayLabelOption>(() => {
    if (typeof window === "undefined") return "title";
    const stored = localStorage.getItem(DISPLAY_LABEL_KEY);
    return (stored as DisplayLabelOption) || "title";
  });

  useEffect(() => {
    localStorage.setItem(DISPLAY_LABEL_KEY, displayLabel);
  }, [displayLabel]);

  return [displayLabel, setDisplayLabel] as const;
}

export function useAssetPerPage(defaultValue = 40) {
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

export function useAssetColumnVisibility() {
  const [columnVisibility, setColumnVisibility] = useState<AssetTableColumnVisibility>(() => {
    if (typeof window === "undefined") return DEFAULT_ASSET_TABLE_COLUMN_VISIBILITY;
    const stored = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_ASSET_TABLE_COLUMN_VISIBILITY, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_ASSET_TABLE_COLUMN_VISIBILITY;
      }
    }
    return DEFAULT_ASSET_TABLE_COLUMN_VISIBILITY;
  });

  useEffect(() => {
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  return [columnVisibility, setColumnVisibility] as const;
}

export function useAssetFilterVisibility() {
  const [filterVisibility, setFilterVisibility] = useState<AssetFilterVisibility>(() => {
    if (typeof window === "undefined") return DEFAULT_ASSET_FILTER_VISIBILITY;
    const stored = localStorage.getItem(FILTER_VISIBILITY_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_ASSET_FILTER_VISIBILITY, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_ASSET_FILTER_VISIBILITY;
      }
    }
    return DEFAULT_ASSET_FILTER_VISIBILITY;
  });

  useEffect(() => {
    localStorage.setItem(FILTER_VISIBILITY_KEY, JSON.stringify(filterVisibility));
  }, [filterVisibility]);

  return [filterVisibility, setFilterVisibility] as const;
}

interface AssetSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayLabel: DisplayLabelOption;
  onDisplayLabelChange: (value: DisplayLabelOption) => void;
  perPage: number;
  onPerPageChange: (value: number) => void;
  columnVisibility: AssetTableColumnVisibility;
  onColumnVisibilityChange: (value: AssetTableColumnVisibility) => void;
  filterVisibility: AssetFilterVisibility;
  onFilterVisibilityChange: (value: AssetFilterVisibility) => void;
  defaultTab?: SettingsTab;
}

export function AssetSettingsDrawer({
  open,
  onOpenChange,
  displayLabel,
  onDisplayLabelChange,
  perPage,
  onPerPageChange,
  columnVisibility,
  onColumnVisibilityChange,
  filterVisibility,
  onFilterVisibilityChange,
  defaultTab = "grid",
}: AssetSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[320px] sm:w-[360px]">
        <SheetHeader>
          <SheetTitle>View Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsTab)}>
            <TabsList className="w-full border-b border-gray-200 pb-0 gap-0">
              <TabsTrigger
                value="grid"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-[13px] border-b-2 rounded-none",
                  activeTab === "grid"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground"
                )}
              >
                <i className="bi bi-grid-3x3-gap text-[15px]" />
                Grid View
              </TabsTrigger>
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
                <i className="bi bi-sliders text-[15px]" />
                Filters
              </TabsTrigger>
            </TabsList>

            {/* Grid View Tab */}
            <TabsContent value="grid" className="mt-6 space-y-4">
              <p className="text-[13px] text-muted-foreground tracking-[-0.13px]">
                Display by:
              </p>
              <RadioGroup
                value={displayLabel}
                onValueChange={(value) => onDisplayLabelChange(value as DisplayLabelOption)}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="title" id="display-title" />
                  <Label htmlFor="display-title" className="font-normal cursor-pointer">
                    Title
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="creator" id="display-creator" />
                  <Label htmlFor="display-creator" className="font-normal cursor-pointer">
                    Creator
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="display-none" />
                  <Label htmlFor="display-none" className="font-normal cursor-pointer">
                    None
                  </Label>
                </div>
              </RadioGroup>
            </TabsContent>

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
                    {[10, 20, 40, 80].map((option) => (
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
                    onClick={() => onColumnVisibilityChange(DEFAULT_ASSET_TABLE_COLUMN_VISIBILITY)}
                  >
                    Restore Default
                  </button>
                </div>
                <div className="space-y-2">
                  {ASSET_TABLE_COLUMNS.map((col) => (
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
                <Label className="text-[13px] text-muted-foreground">Available Filters</Label>
                <button
                  type="button"
                  className="text-[13px] text-primary hover:underline"
                  onClick={() => onFilterVisibilityChange(DEFAULT_ASSET_FILTER_VISIBILITY)}
                >
                  Restore Default
                </button>
              </div>
              <div className="space-y-2">
                {ASSET_FILTERS.map((filter) => (
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
