import { useState, useEffect } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { mockLibraryAssets } from "@/lib/mockLibraryData";
import { folders, FolderItem } from "@/lib/mockFolderData";
import { TogglePill } from "./TogglePill";

interface FilterOption {
  label: string;
  value: string;
  depth?: number;
  type?: "folder" | "gallery";
  count?: number;
  iconClass?: string;
}

interface FilterConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  options: FilterOption[];
  multiSelect?: boolean;
  isTreeStructure?: boolean;
}

const CREATOR_MAP: Record<string, string> = { john: "John Smith", jane: "Jane Doe", alex: "Alex Johnson" };

// Hardcoded recent tags for prototype
const RECENT_TAGS = ["Lebron James", "Dunk", "Nike", "Celebration", "Kevin Durant"];

// Known filter values to match against asset tags
const PEOPLE_NAMES = ["Lebron James", "Steph Curry", "Kevin Durant", "Giannis Antetokounmpo", "Luka Doncic"];
const SCENE_VALUES: Record<string, string> = {
  "dunk": "Dunk", "celebration": "Celebration", "arrival": "Arrival",
  "interview": "Interview", "warm-up": "Warm-up", "timeout": "Timeout",
  "huddle": "Huddle", "victory": "Victory", "injury": "Injury",
};
const BRAND_VALUES: Record<string, string> = {
  "nike": "Nike", "adidas": "Adidas", "under armour": "Under Armour", "puma": "Puma",
};

function computeTagMatchCounts(values: string[], labelMap?: Record<string, string>): FilterOption[] {
  const counts: Record<string, number> = {};
  values.forEach(v => { counts[v] = 0; });
  mockLibraryAssets.forEach(asset => {
    asset.tags.forEach(tag => {
      const lower = tag.toLowerCase();
      values.forEach(v => {
        if (lower === v.toLowerCase()) counts[v] = (counts[v] || 0) + 1;
      });
    });
  });
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([v, count]) => ({ label: labelMap ? labelMap[v] || v : v, value: v, count }));
}

// AI Tags sub-filter options
const peopleOptions = computeTagMatchCounts(PEOPLE_NAMES);
const sceneOptions = computeTagMatchCounts(Object.keys(SCENE_VALUES), SCENE_VALUES);
const brandOptions = computeTagMatchCounts(Object.keys(BRAND_VALUES), BRAND_VALUES);

// Helper to flatten folder tree into options with depth (folders only, no galleries)
function flattenFolderTree(items: FolderItem[], depth = 0): FilterOption[] {
  const result: FilterOption[] = [];
  items.forEach(item => {
    if (item.id !== "all" && item.type === "folder") {
      result.push({
        label: item.name,
        value: item.id,
        depth,
        type: item.type
      });
      if (item.children) {
        result.push(...flattenFolderTree(item.children, depth + 1));
      }
    }
  });
  return result;
}

const folderOptions = flattenFolderTree(folders);

// Source options
const sourceOptions: FilterOption[] = [
  { label: "Posted Content", value: "posted-content", count: 12 },
  { label: "Imported Content", value: "imported-content", count: 8 },
  { label: "Published Content", value: "published-content", count: 15 },
  { label: "Uploaded Content", value: "uploaded-content", count: 22 },
  { label: "Engage Content", value: "engage-content", count: 5 },
  { label: "Requested Content", value: "requested-content", count: 3 },
];

const filters: FilterConfig[] = [{
  id: "tags",
  label: "Tags",
  icon: <i className="bi bi-tag" />,
  multiSelect: true,
  options: (() => {
    const tagCounts: Record<string, number> = {};
    mockLibraryAssets.forEach(asset => {
      asset.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([tag, count]) => ({
        label: tag,
        value: tag,
        count,
      }));
  })(),
}, {
  id: "date-range",
  label: "Date",
  icon: <i className="bi bi-calendar" />,
  options: [
    { label: "Last 7 days", value: "week" },
    { label: "Last 14 days", value: "two-weeks" },
    { label: "Last 30 days", value: "month" },
    { label: "Month to Date", value: "mtd" },
    { label: "Last 90 days", value: "quarter" },
    { label: "Last 12 months", value: "year" },
    { label: "Custom", value: "custom" },
  ],
}, {
  id: "creator",
  label: "Creator",
  icon: <i className="bi bi-person" />,
  multiSelect: true,
  options: (() => {
    const counts: Record<string, number> = {};
    mockLibraryAssets.forEach(asset => {
      counts[asset.creatorId] = (counts[asset.creatorId] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, c]) => c > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([id, count]) => ({ label: CREATOR_MAP[id] || id, value: id, count }));
  })(),
}, {
  id: "content-type",
  label: "Type",
  icon: <i className="bi bi-image" />,
  multiSelect: true,
  options: (() => {
    const counts: Record<string, number> = {};
    mockLibraryAssets.forEach(asset => {
      counts[asset.type] = (counts[asset.type] || 0) + 1;
    });
    const typeIcons: Record<string, string> = { image: "bi-image", video: "bi-camera-video" };
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({ label: type.charAt(0).toUpperCase() + type.slice(1), value: type, count, iconClass: typeIcons[type] }));
  })(),
}, {
  id: "aspect-ratio",
  label: "Ratio",
  icon: <i className="bi bi-crop" />,
  multiSelect: true,
  options: (() => {
    const counts: Record<string, number> = {};
    mockLibraryAssets.forEach(asset => {
      counts[asset.aspectRatio] = (counts[asset.aspectRatio] || 0) + 1;
    });
    const ratioIcons: Record<string, string> = { "16:9": "bi-aspect-ratio", "1:1": "bi-square", "9:16": "bi-aspect-ratio", "4:3": "bi-aspect-ratio-fill" };
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([ratio, count]) => ({ label: ratio, value: ratio, count, iconClass: ratioIcons[ratio] }));
  })(),
}, {
  id: "folders",
  label: "Folders",
  icon: <i className="bi bi-folder" />,
  multiSelect: true,
  isTreeStructure: true,
  options: folderOptions
}];

export interface CustomDateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface GalleryDetailsFilterBarHandle {
  removeValue: (filterId: string, value: string) => void;
  clearAll: () => void;
}

export interface ActiveFilterChip {
  filterId: string;
  filterLabel: string;
  value: string;
  label: string;
}

interface GalleryDetailsFilterBarProps {
  onFilterChange?: (filterId: string, values: string[]) => void;
  onCustomDateChange?: (range: CustomDateRange) => void;
  onFavoritesToggle?: (active: boolean) => void;
  onActiveFiltersChange?: (chips: ActiveFilterChip[]) => void;
  handleRef?: React.MutableRefObject<GalleryDetailsFilterBarHandle | null>;
  // Toggle pill states
  isUnviewedActive?: boolean;
  onUnviewedToggle?: (active: boolean) => void;
  isBrandingActive?: boolean;
  onBrandingToggle?: (active: boolean) => void;
  isFavoritesActive?: boolean;
  onOpenFiltersSheet?: () => void;
}

export function GalleryDetailsFilterBar({
  onFilterChange,
  onCustomDateChange,
  onFavoritesToggle,
  onActiveFiltersChange,
  handleRef,
  isUnviewedActive = false,
  onUnviewedToggle,
  isBrandingActive = false,
  onBrandingToggle,
  isFavoritesActive = false,
  onOpenFiltersSheet,
}: GalleryDetailsFilterBarProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: string; label: string }[]>>({});
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({ from: undefined, to: undefined });
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(undefined);
  const [customDateOpen, setCustomDateOpen] = useState(false);
  // Search state for standard filter dropdowns
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  // Search state for sub-flyouts (AI Tags)
  const [subSearchQueries, setSubSearchQueries] = useState<Record<string, string>>({});

  // AI Tags selections
  const peopleSelected = activeFilters["people"] || [];
  const sceneSelected = activeFilters["scene"] || [];
  const brandSelected = activeFilters["brand"] || [];
  const aiTagsCount = peopleSelected.length + sceneSelected.length + brandSelected.length;

  // Source dropdown selections
  const sourceSelected = activeFilters["source"] || [];
  const sourceCount = sourceSelected.length;

  // Calculate total active filter count for collapsed button
  const standardFiltersCount = Object.values(activeFilters).reduce((sum, arr) => sum + arr.length, 0);
  const totalActiveCount = standardFiltersCount + aiTagsCount + sourceCount;

  // Build chips and notify parent when filters change
  useEffect(() => {
    const chips: ActiveFilterChip[] = [];
    Object.entries(activeFilters).forEach(([filterId, items]) => {
      const filterConfig = filters.find(f => f.id === filterId);
      items.forEach(item => {
        chips.push({
          filterId,
          filterLabel: filterConfig?.label || filterId,
          value: item.value,
          label: item.label,
        });
      });
    });
    onActiveFiltersChange?.(chips);
  }, [activeFilters, onActiveFiltersChange]);

  // Expose imperative handle
  useEffect(() => {
    if (handleRef) {
      handleRef.current = {
        removeValue: (filterId: string, value: string) => {
          if (filterId === "date-range" && value === "custom") {
            setCustomDateRange({ from: undefined, to: undefined });
          }
          setActiveFilters(prev => {
            const current = prev[filterId] || [];
            const updated = current.filter(item => item.value !== value);
            const newFilters = { ...prev };
            if (updated.length === 0) {
              delete newFilters[filterId];
            } else {
              newFilters[filterId] = updated;
            }
            onFilterChange?.(filterId, updated.map(i => i.value));
            return newFilters;
          });
        },
        clearAll: () => {
          setActiveFilters(prev => {
            Object.keys(prev).forEach(filterId => {
              onFilterChange?.(filterId, []);
            });
            return {};
          });
          setCustomDateRange({ from: undefined, to: undefined });
        },
      };
    }
  });

  const handleMultiSelect = (filterId: string, value: string, label: string, checked: boolean) => {
    setActiveFilters(prev => {
      const current = prev[filterId] || [];
      let updated: { value: string; label: string }[];
      if (checked) {
        updated = [...current, { value, label }];
      } else {
        updated = current.filter(item => item.value !== value);
      }
      const newFilters = { ...prev };
      if (updated.length === 0) {
        delete newFilters[filterId];
      } else {
        newFilters[filterId] = updated;
      }
      onFilterChange?.(filterId, updated.map(i => i.value));
      return newFilters;
    });
  };

  const handleSingleSelect = (filterId: string, value: string, label: string) => {
    if (filterId === "date-range" && value === "custom") {
      setTempDateRange(customDateRange.from ? { from: customDateRange.from, to: customDateRange.to } : undefined);
      setCustomDateOpen(true);
      return;
    }
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      if (value === "all") {
        delete newFilters[filterId];
        onFilterChange?.(filterId, []);
      } else {
        newFilters[filterId] = [{ value, label }];
        onFilterChange?.(filterId, [value]);
      }
      return newFilters;
    });
  };

  const handleCustomDateApply = () => {
    if (tempDateRange?.from) {
      const from = tempDateRange.from;
      const to = tempDateRange.to || tempDateRange.from;
      const label = `${format(from, "MMM d, yyyy")} - ${format(to, "MMM d, yyyy")}`;
      setCustomDateRange({ from, to });
      setActiveFilters(prev => ({
        ...prev,
        "date-range": [{ value: "custom", label }]
      }));
      onFilterChange?.("date-range", ["custom"]);
      onCustomDateChange?.({ from, to });
      setCustomDateOpen(false);
    }
  };

  const handleCustomDateClear = () => {
    setTempDateRange(undefined);
    setCustomDateRange({ from: undefined, to: undefined });
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters["date-range"];
      onFilterChange?.("date-range", []);
      return newFilters;
    });
    setCustomDateOpen(false);
  };

  return (
    <div className="filter-bar-container cq-filterbar-hide-label flex flex-wrap items-center gap-1.5">
      {/* Collapsed Filters Button (visible at narrow widths) */}
      <Tooltip delayDuration={700}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="filters-collapsed-button h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]"
            onClick={onOpenFiltersSheet}
          >
            <i className="bi bi-funnel w-4 h-4 inline-flex items-center justify-center leading-none" />
            <span>Filters</span>
            {totalActiveCount > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                {totalActiveCount}
              </span>
            )}
            <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Filters</TooltipContent>
      </Tooltip>

      {/* Expanded Filters (visible at wide widths) */}
      <div className="filters-expanded contents">
      {/* AI Tags Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
              aiTagsCount > 0 && "bg-primary/10 border-primary text-primary"
            )}
          >
            <i className="bi bi-stars w-4 h-4 inline-flex items-center justify-center leading-none" />
            <span className="filter-label">AI Tags</span>
            {aiTagsCount > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                {aiTagsCount}
              </span>
            )}
            <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-white z-50 min-w-[180px]">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <i className="bi bi-person mr-2" />
              People
              {peopleSelected.length > 0 && (
                <span className="ml-auto text-[13px] text-primary">{peopleSelected.length}</span>
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-white z-50 min-w-[200px]">
              <div className="px-2 py-2 border-b">
                <div className="relative">
                  <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                  <input
                    type="text"
                    placeholder="Search people..."
                    value={subSearchQueries["people"] ?? ""}
                    onChange={e => setSubSearchQueries(prev => ({ ...prev, people: e.target.value }))}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => e.stopPropagation()}
                    className="w-full h-8 pl-8 pr-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="px-2 py-1.5 text-[13px] font-medium text-muted-foreground flex items-center gap-1.5 bg-white">
                <i className="bi bi-stars text-primary/70" />
                AI-Identified
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                {peopleOptions
                  .filter(opt => opt.label.toLowerCase().includes((subSearchQueries["people"] ?? "").toLowerCase()))
                  .map(opt => (
                    <DropdownMenuCheckboxItem
                      key={opt.value}
                      checked={peopleSelected.some(s => s.value === opt.value)}
                      onCheckedChange={(checked) => handleMultiSelect("people", opt.value, opt.label, !!checked)}
                      onSelect={e => e.preventDefault()}
                    >
                      <span className="flex-1">{opt.label}</span>
                      {opt.count !== undefined && (
                        <span className="text-[13px] text-muted-foreground ml-auto">{opt.count}</span>
                      )}
                    </DropdownMenuCheckboxItem>
                  ))}
                {peopleOptions.filter(opt => opt.label.toLowerCase().includes((subSearchQueries["people"] ?? "").toLowerCase())).length === 0 && (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">No results found</div>
                )}
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <i className="bi bi-camera-reels mr-2" />
              Scene
              {sceneSelected.length > 0 && (
                <span className="ml-auto text-[13px] text-primary">{sceneSelected.length}</span>
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-white z-50 min-w-[200px]">
              <div className="px-2 py-2 border-b">
                <div className="relative">
                  <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                  <input
                    type="text"
                    placeholder="Search scenes..."
                    value={subSearchQueries["scene"] ?? ""}
                    onChange={e => setSubSearchQueries(prev => ({ ...prev, scene: e.target.value }))}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => e.stopPropagation()}
                    className="w-full h-8 pl-8 pr-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="px-2 py-1.5 text-[13px] font-medium text-muted-foreground flex items-center gap-1.5 bg-white">
                <i className="bi bi-stars text-primary/70" />
                AI-Identified
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                {sceneOptions
                  .filter(opt => opt.label.toLowerCase().includes((subSearchQueries["scene"] ?? "").toLowerCase()))
                  .map(opt => (
                    <DropdownMenuCheckboxItem
                      key={opt.value}
                      checked={sceneSelected.some(s => s.value === opt.value)}
                      onCheckedChange={(checked) => handleMultiSelect("scene", opt.value, opt.label, !!checked)}
                      onSelect={e => e.preventDefault()}
                    >
                      <span className="flex-1">{opt.label}</span>
                      {opt.count !== undefined && (
                        <span className="text-[13px] text-muted-foreground ml-auto">{opt.count}</span>
                      )}
                    </DropdownMenuCheckboxItem>
                  ))}
                {sceneOptions.filter(opt => opt.label.toLowerCase().includes((subSearchQueries["scene"] ?? "").toLowerCase())).length === 0 && (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">No results found</div>
                )}
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <i className="bi bi-badge-tm mr-2" />
              Brand
              {brandSelected.length > 0 && (
                <span className="ml-auto text-[13px] text-primary">{brandSelected.length}</span>
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-white z-50 min-w-[200px]">
              <div className="px-2 py-1.5 text-[13px] font-medium text-muted-foreground flex items-center gap-1.5 bg-white">
                <i className="bi bi-stars text-primary/70" />
                AI-Identified
              </div>
              {brandOptions.map(opt => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={brandSelected.some(s => s.value === opt.value)}
                  onCheckedChange={(checked) => handleMultiSelect("brand", opt.value, opt.label, !!checked)}
                  onSelect={e => e.preventDefault()}
                >
                  <span className="flex-1">{opt.label}</span>
                  {opt.count !== undefined && (
                    <span className="text-[13px] text-muted-foreground ml-auto">{opt.count}</span>
                  )}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Standard Filter Dropdowns */}
      {filters.map(filter => {
        const selected = activeFilters[filter.id] || [];
        const isActive = selected.length > 0;
        const isMulti = filter.multiSelect;
        const isDateFilter = filter.id === "date-range";

        const dropdownMenu = (
          <DropdownMenu key={filter.id}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                  isActive && "bg-primary/10 border-primary text-primary"
                )}
              >
                {filter.icon}<span className="filter-label">{filter.label}</span>
                {isActive && (
                  <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                    {selected.length}
                  </span>
                )}
                <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white z-50 min-w-[200px]" onCloseAutoFocus={e => e.preventDefault()}>
              {/* Search input for filters with many options (tags, folders, creator) */}
              {(filter.id === "tags" || filter.id === "folders" || filter.id === "creator") && (
                <div className="px-2 py-2 border-b">
                  <div className="relative">
                    <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                    <input
                      type="text"
                      placeholder={`Search ${filter.label.toLowerCase()}...`}
                      value={searchQueries[filter.id] ?? ""}
                      onChange={e => setSearchQueries(prev => ({ ...prev, [filter.id]: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                      onKeyDown={e => e.stopPropagation()}
                      className="w-full h-8 pl-8 pr-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
              <div className="max-h-[280px] overflow-y-auto">
                {/* Tags dropdown with Recent/All sections */}
                {filter.id === "tags" ? (
                  <>
                    {/* Recent Tags Section */}
                    {(() => {
                      const query = (searchQueries["tags"] ?? "").toLowerCase();
                      const filteredRecentTags = filter.options.filter(
                        opt => RECENT_TAGS.includes(opt.label) && opt.label.toLowerCase().includes(query)
                      );
                      if (filteredRecentTags.length === 0) return null;
                      return (
                        <>
                          <div className="px-2 py-1.5 text-[13px] font-medium text-muted-foreground bg-white">
                            Recent Tags
                          </div>
                          {filteredRecentTags.map(option => (
                            <DropdownMenuCheckboxItem
                              key={`recent-${option.value}`}
                              checked={selected.some(s => s.value === option.value)}
                              onCheckedChange={checked => handleMultiSelect("tags", option.value, option.label, checked)}
                              className="flex items-center gap-2"
                              onSelect={e => e.preventDefault()}
                            >
                              <span className="flex-1">{option.label}</span>
                              {option.count !== undefined && (
                                <span className="text-[13px] text-muted-foreground ml-auto">{option.count}</span>
                              )}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </>
                      );
                    })()}
                    {/* All Tags Section */}
                    {(() => {
                      const query = (searchQueries["tags"] ?? "").toLowerCase();
                      const filteredAllTags = filter.options.filter(
                        opt => opt.label.toLowerCase().includes(query)
                      );
                      if (filteredAllTags.length === 0) return null;
                      return (
                        <>
                          <div className="px-2 py-1.5 text-[13px] font-medium text-muted-foreground bg-white">
                            All Tags
                          </div>
                          {filteredAllTags.map(option => (
                            <DropdownMenuCheckboxItem
                              key={option.value}
                              checked={selected.some(s => s.value === option.value)}
                              onCheckedChange={checked => handleMultiSelect("tags", option.value, option.label, checked)}
                              className="flex items-center gap-2"
                              onSelect={e => e.preventDefault()}
                            >
                              <span className="flex-1">{option.label}</span>
                              {option.count !== undefined && (
                                <span className="text-[13px] text-muted-foreground ml-auto">{option.count}</span>
                              )}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </>
                      );
                    })()}
                    {/* No results message for tags */}
                    {filter.options.filter(opt => opt.label.toLowerCase().includes((searchQueries["tags"] ?? "").toLowerCase())).length === 0 && (
                      <div className="px-2 py-3 text-xs text-muted-foreground text-center">No results found</div>
                    )}
                  </>
                ) : (
                  /* Standard rendering for other filters */
                  <>
                    {filter.options
                      .filter(option => {
                        if (filter.id !== "folders" && filter.id !== "creator") return true;
                        const query = (searchQueries[filter.id] ?? "").toLowerCase();
                        return option.label.toLowerCase().includes(query);
                      })
                      .map(option => {
                        const isTreeItem = filter.isTreeStructure && option.depth !== undefined;
                        const indent = isTreeItem ? option.depth! * 12 : 0;
                        const treeIconClass = option.type === "gallery" ? "bi-images" : "bi-folder";

                        return isMulti ? (
                          <DropdownMenuCheckboxItem
                            key={option.value}
                            checked={selected.some(s => s.value === option.value)}
                            onCheckedChange={checked => handleMultiSelect(filter.id, option.value, option.label, checked)}
                            style={{ paddingLeft: isTreeItem ? `${8 + indent}px` : undefined }}
                            className="flex items-center gap-2"
                            onSelect={e => e.preventDefault()}
                          >
                            {isTreeItem && <i className={`bi ${treeIconClass} text-sm text-muted-foreground flex-shrink-0`} />}
                            {option.iconClass && !isTreeItem && <i className={`bi ${option.iconClass} text-sm text-muted-foreground flex-shrink-0`} />}
                            <span className={cn("flex-1", option.depth === 0 ? "font-medium" : "")}>{option.label}</span>
                            {option.count !== undefined && <span className="text-[13px] text-muted-foreground ml-auto">{option.count}</span>}
                          </DropdownMenuCheckboxItem>
                        ) : (
                          <DropdownMenuCheckboxItem
                            key={option.value}
                            checked={selected.some(s => s.value === option.value)}
                            onCheckedChange={() => handleSingleSelect(filter.id, option.value, option.label)}
                          >
                            {option.label}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    {/* No results message for folders and creator */}
                    {(filter.id === "folders" || filter.id === "creator") &&
                      filter.options.filter(opt => opt.label.toLowerCase().includes((searchQueries[filter.id] ?? "").toLowerCase())).length === 0 && (
                        <div className="px-2 py-3 text-xs text-muted-foreground text-center">No results found</div>
                      )}
                  </>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        );

        if (isDateFilter) {
          return (
            <div key={filter.id} className="relative">
              {dropdownMenu}
              {customDateOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCustomDateOpen(false)} />
                  <div className="absolute top-full left-0 mt-1 z-50 w-auto p-0 bg-white rounded-lg shadow-lg border animate-in fade-in-0 zoom-in-95">
                    <div className="p-4 pb-0">
                      <Calendar
                        mode="range"
                        selected={tempDateRange}
                        onSelect={setTempDateRange}
                        disabled={date => date > new Date()}
                        showOutsideDays
                        className="pointer-events-auto"
                        classNames={{
                          months: "flex flex-col",
                          month: "space-y-3",
                          caption: "flex justify-center pt-1 relative items-center",
                          caption_label: "text-sm font-semibold",
                          nav: "space-x-1 flex items-center",
                          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse",
                          head_row: "flex",
                          head_cell: "text-muted-foreground rounded-md w-10 font-normal text-xs",
                          row: "flex w-full mt-1",
                          cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-md inline-flex items-center justify-center",
                          day_range_end: "day-range-end",
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          day_today: "ring-1 ring-primary text-primary font-semibold",
                          day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                          day_disabled: "text-muted-foreground opacity-50",
                          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                          day_hidden: "invisible",
                        }}
                      />
                      <div className="text-center mt-3">
                        <span className="text-xs text-primary font-medium">Choose a Date Range</span>
                      </div>
                      <div className="flex items-start gap-1.5 mt-3 px-1">
                        <i className="bi bi-info-circle text-sm text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground">
                          For optimal performance, limit your search selection to 12 months.
                        </span>
                      </div>
                    </div>
                    <Separator className="mt-4" />
                    <div className="flex items-center justify-between p-3">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={handleCustomDateClear}>
                        Clear
                      </Button>
                      <Button size="sm" className="text-xs px-6" onClick={handleCustomDateApply} disabled={!tempDateRange?.from}>
                        Save
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        }

        return dropdownMenu;
      })}

      {/* Source Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
              sourceCount > 0 && "bg-primary/10 border-primary text-primary"
            )}
          >
            <i className="bi bi-cloud-arrow-down w-4 h-4 inline-flex items-center justify-center leading-none" />
            <span className="filter-label">Source</span>
            {sourceCount > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                {sourceCount}
              </span>
            )}
            <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-white z-50 min-w-[200px]" onCloseAutoFocus={e => e.preventDefault()}>
          <div className="px-2 py-2 border-b">
            <div className="relative">
              <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
              <input
                type="text"
                placeholder="Search source..."
                value={searchQueries["source"] ?? ""}
                onChange={e => setSearchQueries(prev => ({ ...prev, source: e.target.value }))}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => e.stopPropagation()}
                className="w-full h-8 pl-8 pr-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            {sourceOptions
              .filter(opt => opt.label.toLowerCase().includes((searchQueries["source"] ?? "").toLowerCase()))
              .map(opt => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={sourceSelected.some(s => s.value === opt.value)}
                  onCheckedChange={(checked) => handleMultiSelect("source", opt.value, opt.label, !!checked)}
                  onSelect={e => e.preventDefault()}
                >
                  <span className="flex-1">{opt.label}</span>
                  <span className="text-[13px] text-muted-foreground ml-auto">{opt.count}</span>
                </DropdownMenuCheckboxItem>
              ))}
            {sourceOptions.filter(opt => opt.label.toLowerCase().includes((searchQueries["source"] ?? "").toLowerCase())).length === 0 && (
              <div className="px-2 py-3 text-xs text-muted-foreground text-center">No results found</div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>{/* End filters-expanded */}

      {/* Toggle Pills */}
      <TogglePill
        label="Unviewed Only"
        iconClass="bi-eye-slash"
        tooltip="Show only assets you haven't viewed yet"
        isActive={isUnviewedActive}
        onClick={() => onUnviewedToggle?.(!isUnviewedActive)}
      />
      <TogglePill
        label="Branding"
        iconClass="bi-palette"
        tooltip="Show only branded assets"
        isActive={isBrandingActive}
        onClick={() => onBrandingToggle?.(!isBrandingActive)}
      />
      <TogglePill
        label="Favorites"
        iconClass={isFavoritesActive ? "bi-heart-fill" : "bi-heart"}
        tooltip="Show only favorited assets"
        isActive={isFavoritesActive}
        onClick={() => onFavoritesToggle?.(!isFavoritesActive)}
      />
    </div>
  );
}
