import { useState, useEffect, useRef } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { folders, FolderItem } from "@/lib/mockFolderData";
import { mockLibraryAssets } from "@/lib/mockLibraryData";
import { TogglePill } from "@/components/TogglePill";

interface FilterOption {
  label: string;
  value: string;
  depth?: number;
  type?: "folder" | "gallery";
  group?: string;
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
  hasGroups?: boolean;
}

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
const CREATOR_MAP: Record<string, string> = { john: "John Smith", jane: "Jane Doe", alex: "Alex Johnson" };

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

// Main filters array (without People, Scene, Brand - those are in AI Tags now)
const filters: FilterConfig[] = [{
  id: "tags",
  label: "Tags",
  icon: <i className="bi bi-tag" />,
  multiSelect: true,
  hasGroups: false,
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
  options: [{
    label: "Last 7 days",
    value: "week"
  }, {
    label: "Last 14 days",
    value: "two-weeks"
  }, {
    label: "Last 30 days",
    value: "month"
  }, {
    label: "Month to Date",
    value: "mtd"
  }, {
    label: "Last 90 days",
    value: "quarter"
  }, {
    label: "Last 12 months",
    value: "year"
  }, {
    label: "Custom",
    value: "custom"
  }]
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

export interface FilterBarHandle {
  removeValue: (filterId: string, value: string) => void;
  clearAll: () => void;
}

interface FilterBarProps {
  onFilterChange?: (filterId: string, values: string[]) => void;
  onCustomDateChange?: (range: CustomDateRange) => void;
  hideFilters?: string[];
  // Toggle pill states
  isUnsortedActive?: boolean;
  onUnsortedToggle?: (active: boolean) => void;
  isUnviewedActive?: boolean;
  onUnviewedToggle?: (active: boolean) => void;
  isBrandingActive?: boolean;
  onBrandingToggle?: (active: boolean) => void;
  disabledValues?: { value: string; category: string }[];
  onRemoveDisabledValue?: (value: string, category: string) => void;
  compactMode?: boolean;
  handleRef?: React.MutableRefObject<FilterBarHandle | null>;
}

export function FilterBar({
  onFilterChange,
  onCustomDateChange,
  hideFilters = [],
  isUnsortedActive = false,
  onUnsortedToggle,
  isUnviewedActive = false,
  onUnviewedToggle,
  isBrandingActive = false,
  onBrandingToggle,
  disabledValues = [],
  onRemoveDisabledValue,
  compactMode = false,
  handleRef,
}: FilterBarProps) {
  const visibleFilters = filters.filter(f => !hideFilters.includes(f.id));
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: string; label: string }[]>>({});
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({ from: undefined, to: undefined });
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(undefined);
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const dateFilterRef = useRef<HTMLButtonElement>(null);

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

  const handleRemoveValue = (filterId: string, value: string) => {
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
  };

  const clearFilter = (filterId: string) => {
    if (filterId === "date-range") {
      setCustomDateRange({ from: undefined, to: undefined });
    }
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[filterId];
      onFilterChange?.(filterId, []);
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters(prev => {
      Object.keys(prev).forEach(filterId => {
        onFilterChange?.(filterId, []);
      });
      return {};
    });
    setCustomDateRange({ from: undefined, to: undefined });
  };

  // Expose imperative handle for parent chip removal
  useEffect(() => {
    if (handleRef) {
      handleRef.current = {
        removeValue: handleRemoveValue,
        clearAll: clearAllFilters,
      };
    }
  });

  // AI Tags selections
  const peopleSelected = activeFilters["people"] || [];
  const sceneSelected = activeFilters["scene"] || [];
  const brandSelected = activeFilters["brand"] || [];
  const aiTagsCount = peopleSelected.length + sceneSelected.length + brandSelected.length;

  // More dropdown selections
  const sourceSelected = activeFilters["source"] || [];
  const statusSelected = activeFilters["status"] || [];
  const moreCount = sourceSelected.length + statusSelected.length;

  return (
    <div className="filter-bar-container cq-filterbar-hide-label flex flex-wrap items-center gap-1.5">
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
            <DropdownMenuSubTrigger className="text-sm">
              <i className="bi bi-person mr-2" />
              People
              {peopleSelected.length > 0 && (
                <span className="ml-auto text-xs text-primary">{peopleSelected.length}</span>
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-white z-50 min-w-[200px]">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-muted/30">
                <i className="bi bi-stars text-primary/70" />
                AI-Identified
              </div>
              {peopleOptions.map(opt => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={peopleSelected.some(s => s.value === opt.value)}
                  onCheckedChange={(checked) => handleMultiSelect("people", opt.value, opt.label, !!checked)}
                  onSelect={e => e.preventDefault()}
                >
                  <span className="flex-1">{opt.label}</span>
                  {opt.count !== undefined && (
                    <span className="text-xs text-muted-foreground ml-auto">{opt.count}</span>
                  )}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-sm">
              <i className="bi bi-camera-reels mr-2" />
              Scene
              {sceneSelected.length > 0 && (
                <span className="ml-auto text-xs text-primary">{sceneSelected.length}</span>
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-white z-50 min-w-[200px]">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-muted/30">
                <i className="bi bi-stars text-primary/70" />
                AI-Identified
              </div>
              {sceneOptions.map(opt => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={sceneSelected.some(s => s.value === opt.value)}
                  onCheckedChange={(checked) => handleMultiSelect("scene", opt.value, opt.label, !!checked)}
                  onSelect={e => e.preventDefault()}
                >
                  <span className="flex-1">{opt.label}</span>
                  {opt.count !== undefined && (
                    <span className="text-xs text-muted-foreground ml-auto">{opt.count}</span>
                  )}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-sm">
              <i className="bi bi-badge-tm mr-2" />
              Brand
              {brandSelected.length > 0 && (
                <span className="ml-auto text-xs text-primary">{brandSelected.length}</span>
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-white z-50 min-w-[200px]">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-muted/30">
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
                    <span className="text-xs text-muted-foreground ml-auto">{opt.count}</span>
                  )}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Standard Filter Dropdowns */}
      {visibleFilters.map(filter => {
        const selected = activeFilters[filter.id] || [];
        const categoryMap: Record<string, string> = { tags: "Tag" };
        const disabledForFilter = disabledValues.filter(
          dv => dv.category.toLowerCase() === (categoryMap[filter.id] || "").toLowerCase()
        );
        const totalActiveCount = selected.length + disabledForFilter.length;
        const isActive = totalActiveCount > 0;
        const isMulti = filter.multiSelect;
        const isDateFilter = filter.id === "date-range";

        const dropdownMenu = (
          <DropdownMenu key={filter.id}>
            <DropdownMenuTrigger asChild>
              {isActive ? (
                compactMode ? (
                  <Button variant="outline" size="sm" className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-primary/10 border-primary text-primary">
                    <span>{filter.label}</span>
                    <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">{totalActiveCount}</span>
                    <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none opacity-50" />
                  </Button>
                ) : (
                  <div className="inline-flex items-center gap-1 h-8 px-1.5 border border-input rounded-md bg-white min-w-[120px] max-w-[280px]">
                    <div className="flex flex-wrap gap-1 flex-1">
                      {selected.map(item => (
                        <span key={item.value} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
                          <button
                            type="button"
                            onPointerDown={e => e.stopPropagation()}
                            onClick={e => {
                              e.stopPropagation();
                              handleRemoveValue(filter.id, item.value);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={`Remove ${filter.label} filter: ${item.label}`}
                          >
                            <i className="bi bi-x text-xs" />
                          </button>
                          {item.label}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 ml-auto pl-1">
                      <button
                        type="button"
                        onPointerDown={e => e.stopPropagation()}
                        onClick={e => {
                          e.stopPropagation();
                          clearFilter(filter.id);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`Clear ${filter.label} filter`}
                      >
                        <i className="bi bi-x text-sm" />
                      </button>
                      <i className="bi bi-chevron-down text-sm text-muted-foreground" />
                    </div>
                  </div>
                )
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]"
                  ref={isDateFilter ? dateFilterRef : undefined}
                >
                  {filter.icon}<span className="filter-label">{filter.label}</span>
                  <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white z-50 min-w-[200px]" onCloseAutoFocus={e => e.preventDefault()}>
              <div className="max-h-[280px] overflow-y-auto">
                {filter.options.map(option => {
                  const isTreeItem = filter.isTreeStructure && option.depth !== undefined;
                  const indent = isTreeItem ? option.depth! * 12 : 0;
                  const treeIconClass = option.type === "gallery" ? "bi-images" : "bi-folder";
                  const isDisabledBySearch = disabledValues.some(
                    dv => dv.value.toLowerCase() === option.value.toLowerCase() && dv.category.toLowerCase() === (categoryMap[filter.id] || "").toLowerCase()
                  );

                  return isMulti ? (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={selected.some(s => s.value === option.value) || isDisabledBySearch}
                      onCheckedChange={checked => {
                        if (isDisabledBySearch) {
                          onRemoveDisabledValue?.(option.value, categoryMap[filter.id] || "");
                        } else {
                          handleMultiSelect(filter.id, option.value, option.label, checked);
                        }
                      }}
                      style={{ paddingLeft: isTreeItem ? `${8 + indent}px` : undefined }}
                      className="flex items-center gap-2"
                      onSelect={e => e.preventDefault()}
                    >
                      {isTreeItem && <i className={`bi ${treeIconClass} text-sm text-muted-foreground flex-shrink-0`} />}
                      {option.iconClass && !isTreeItem && <i className={`bi ${option.iconClass} text-sm text-muted-foreground flex-shrink-0`} />}
                      <span className={cn("flex-1", option.depth === 0 ? "font-medium" : "")}>{option.label}</span>
                      {option.count !== undefined && <span className="text-xs text-muted-foreground ml-auto">{option.count}</span>}
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

      {/* More Dropdown with Source & Approval Status flyouts */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
              moreCount > 0 && "bg-primary/10 border-primary text-primary"
            )}
          >
            <i className="bi bi-three-dots w-4 h-4 inline-flex items-center justify-center leading-none" />
            <span className="filter-label">More</span>
            {moreCount > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                {moreCount}
              </span>
            )}
            <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-white z-50 min-w-[180px]">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-sm">Source</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-white z-50 min-w-[200px]">
              {[
                { label: "Posted Content", value: "posted-content", count: 12 },
                { label: "Imported Content", value: "imported-content", count: 8 },
                { label: "Published Content", value: "published-content", count: 15 },
                { label: "Uploaded Content", value: "uploaded-content", count: 22 },
                { label: "Engage Content", value: "engage-content", count: 5 },
                { label: "Requested Content", value: "requested-content", count: 3 },
              ].map(opt => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={sourceSelected.some(s => s.value === opt.value)}
                  onCheckedChange={(checked) => handleMultiSelect("source", opt.value, opt.label, !!checked)}
                  onSelect={e => e.preventDefault()}
                >
                  <span className="flex-1">{opt.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{opt.count}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-sm">Approval Status</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-white z-50 min-w-[180px]">
              {[
                { label: "Pending", value: "pending", count: 14 },
                { label: "Approved", value: "approved", count: 38 },
                { label: "Rejected", value: "rejected", count: 7 },
              ].map(opt => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={statusSelected.some(s => s.value === opt.value)}
                  onCheckedChange={(checked) => handleMultiSelect("status", opt.value, opt.label, !!checked)}
                  onSelect={e => e.preventDefault()}
                >
                  <span className="flex-1">{opt.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{opt.count}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Toggle Pills */}
      <TogglePill
        label="Unsorted"
        iconClass="bi-folder-x"
        isActive={isUnsortedActive}
        onClick={() => onUnsortedToggle?.(!isUnsortedActive)}
      />
      <TogglePill
        label="Unviewed Only"
        iconClass="bi-eye-slash"
        isActive={isUnviewedActive}
        onClick={() => onUnviewedToggle?.(!isUnviewedActive)}
      />
      <TogglePill
        label="Branding"
        iconClass="bi-palette"
        isActive={isBrandingActive}
        onClick={() => onBrandingToggle?.(!isBrandingActive)}
      />
    </div>
  );
}
