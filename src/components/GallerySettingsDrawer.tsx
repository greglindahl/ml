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

export type GallerySettingsTab = "table" | "filters";

// Column definitions for Table View - matches Figma design
export const GALLERY_TABLE_COLUMNS = [
  { key: "thumbnail", label: "Gallery Thumbnail" },
  { key: "name", label: "Gallery Name" },
  { key: "description", label: "Description" },
  { key: "options", label: "Options" },
  { key: "creator", label: "Creator" },
  { key: "created", label: "Created" },
  { key: "lastAdded", label: "Last Added" },
  { key: "sharing", label: "Sharing" },
  { key: "downloads", label: "Downloads" },
  { key: "totalAssets", label: "Total Assets" },
  { key: "images", label: "Images" },
  { key: "videos", label: "Videos" },
  { key: "favorites", label: "Favorites" },
] as const;

export type GalleryTableColumnKey = typeof GALLERY_TABLE_COLUMNS[number]["key"];
export type GalleryTableColumnVisibility = Record<GalleryTableColumnKey, boolean>;

export const DEFAULT_GALLERY_TABLE_COLUMN_VISIBILITY: GalleryTableColumnVisibility = {
  thumbnail: true,
  name: true,
  description: false,
  options: false,
  creator: true,
  created: true,
  lastAdded: true,
  sharing: true,
  downloads: true,
  totalAssets: true,
  images: false,
  videos: false,
  favorites: false,
};

// Filter definitions for Filters tab - matches Figma design
export const GALLERY_FILTERS = [
  { key: "galleryOptions", label: "Gallery Options" },
  { key: "creator", label: "Creator" },
  { key: "groups", label: "Groups" },
  { key: "createdDate", label: "Created Date" },
  { key: "assetsLastAddedDate", label: "Assets Last Added Date" },
  { key: "archived", label: "Archived" },
] as const;

export type GalleryFilterKey = typeof GALLERY_FILTERS[number]["key"];
export type GalleryFilterVisibility = Record<GalleryFilterKey, boolean>;

export const DEFAULT_GALLERY_FILTER_VISIBILITY: GalleryFilterVisibility = {
  galleryOptions: true,
  creator: true,
  groups: true,
  createdDate: true,
  assetsLastAddedDate: false,
  archived: false,
};

// Storage keys
const PER_PAGE_KEY = "tablePerPage.galleries";
const COLUMN_VISIBILITY_KEY = "tableColumns.galleries.v2";
const FILTER_VISIBILITY_KEY = "filterVisibility.galleries";

// Hooks
export function useGalleryPerPage(defaultValue = 40) {
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

export function useGalleryColumnVisibility() {
  const [columnVisibility, setColumnVisibility] = useState<GalleryTableColumnVisibility>(() => {
    if (typeof window === "undefined") return DEFAULT_GALLERY_TABLE_COLUMN_VISIBILITY;
    const stored = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_GALLERY_TABLE_COLUMN_VISIBILITY, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_GALLERY_TABLE_COLUMN_VISIBILITY;
      }
    }
    return DEFAULT_GALLERY_TABLE_COLUMN_VISIBILITY;
  });

  useEffect(() => {
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  return [columnVisibility, setColumnVisibility] as const;
}

export function useGalleryFilterVisibility() {
  const [filterVisibility, setFilterVisibility] = useState<GalleryFilterVisibility>(() => {
    if (typeof window === "undefined") return DEFAULT_GALLERY_FILTER_VISIBILITY;
    const stored = localStorage.getItem(FILTER_VISIBILITY_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_GALLERY_FILTER_VISIBILITY, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_GALLERY_FILTER_VISIBILITY;
      }
    }
    return DEFAULT_GALLERY_FILTER_VISIBILITY;
  });

  useEffect(() => {
    localStorage.setItem(FILTER_VISIBILITY_KEY, JSON.stringify(filterVisibility));
  }, [filterVisibility]);

  return [filterVisibility, setFilterVisibility] as const;
}

interface GallerySettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perPage: number;
  onPerPageChange: (value: number) => void;
  columnVisibility: GalleryTableColumnVisibility;
  onColumnVisibilityChange: (value: GalleryTableColumnVisibility) => void;
  filterVisibility: GalleryFilterVisibility;
  onFilterVisibilityChange: (value: GalleryFilterVisibility) => void;
  defaultTab?: GallerySettingsTab;
}

export function GallerySettingsDrawer({
  open,
  onOpenChange,
  perPage,
  onPerPageChange,
  columnVisibility,
  onColumnVisibilityChange,
  filterVisibility,
  onFilterVisibilityChange,
  defaultTab = "table",
}: GallerySettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<GallerySettingsTab>(defaultTab);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[320px] sm:w-[360px]">
        <SheetHeader>
          <SheetTitle>View Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as GallerySettingsTab)}>
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
                    onClick={() => onColumnVisibilityChange(DEFAULT_GALLERY_TABLE_COLUMN_VISIBILITY)}
                  >
                    Restore Default
                  </button>
                </div>
                <div className="space-y-2">
                  {GALLERY_TABLE_COLUMNS.map((col) => (
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
                  onClick={() => onFilterVisibilityChange(DEFAULT_GALLERY_FILTER_VISIBILITY)}
                >
                  Restore Default
                </button>
              </div>
              <div className="space-y-2">
                {GALLERY_FILTERS.map((filter) => (
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
