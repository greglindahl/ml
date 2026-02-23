import { useState, useEffect, useRef } from "react";
import { ChevronDown, Calendar as CalendarIcon, X, Search, ChevronRight, Folder, Images, Palette, Image as ImageIcon, Video, RectangleHorizontal, Square, RectangleVertical, Proportions, Info, type LucideIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
// Popover removed — custom date uses a plain positioned div
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { folders, FolderItem } from "@/lib/mockFolderData";
import { AI_GENERATED_TAGS, mockLibraryAssets } from "@/lib/mockLibraryData";
interface FilterOption {
  label: string;
  value: string;
  depth?: number;
  type?: "folder" | "gallery";
  group?: string;
  count?: number;
  icon?: LucideIcon;
}
interface FilterConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  options: FilterOption[];
  multiSelect?: boolean;
  isTreeStructure?: boolean;
  hasGroups?: boolean; // Whether options are grouped
}

// Helper to flatten folder tree into options with depth (folders only, no galleries)
function flattenFolderTree(items: FolderItem[], depth = 0): FilterOption[] {
  const result: FilterOption[] = [];
  items.forEach(item => {
    if (item.id !== "all" && item.type === "folder") {
      // Skip "All Files" and galleries
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

const filters: FilterConfig[] = [{
  id: "people",
  label: "People",
  icon: null,
  multiSelect: true,
  options: computeTagMatchCounts(PEOPLE_NAMES),
}, {
  id: "scene",
  label: "Scene",
  icon: null,
  multiSelect: true,
  options: computeTagMatchCounts(Object.keys(SCENE_VALUES), SCENE_VALUES),
}, {
  id: "brand",
  label: "Brand",
  icon: null,
  multiSelect: true,
  options: computeTagMatchCounts(Object.keys(BRAND_VALUES), BRAND_VALUES),
}, {
  id: "tags",
  label: "Tags",
  icon: null,
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
  id: "creator",
  label: "Creator",
  icon: null,
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
  icon: null,
  multiSelect: true,
  options: (() => {
    const counts: Record<string, number> = {};
    mockLibraryAssets.forEach(asset => {
      counts[asset.type] = (counts[asset.type] || 0) + 1;
    });
    const typeIcons: Record<string, LucideIcon> = { image: ImageIcon, video: Video };
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({ label: type.charAt(0).toUpperCase() + type.slice(1), value: type, count, icon: typeIcons[type] }));
  })(),
}, {
  id: "folders",
  label: "Folders",
  icon: null,
  multiSelect: true,
  isTreeStructure: true,
  options: folderOptions
}, {
  id: "date-range",
  label: "Date",
  icon: null,
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
  id: "aspect-ratio",
  label: "Ratio",
  icon: null,
  multiSelect: true,
  options: (() => {
    const counts: Record<string, number> = {};
    mockLibraryAssets.forEach(asset => {
      counts[asset.aspectRatio] = (counts[asset.aspectRatio] || 0) + 1;
    });
    const ratioIcons: Record<string, LucideIcon> = { "16:9": RectangleHorizontal, "1:1": Square, "9:16": RectangleVertical, "4:3": Proportions };
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([ratio, count]) => ({ label: ratio, value: ratio, count, icon: ratioIcons[ratio] }));
  })(),
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
  onBrandedToggle?: (active: boolean) => void;
  disabledValues?: { value: string; category: string }[];
  onRemoveDisabledValue?: (value: string, category: string) => void;
  compactMode?: boolean;
  handleRef?: React.MutableRefObject<FilterBarHandle | null>;
}
export function FilterBar({
  onFilterChange,
  onCustomDateChange,
  hideFilters = [],
  onBrandedToggle,
  disabledValues = [],
  onRemoveDisabledValue,
  compactMode = false,
  handleRef,
}: FilterBarProps) {
  // Filter out hidden filters
  const visibleFilters = filters.filter(f => !hideFilters.includes(f.id));
  const [activeFilters, setActiveFilters] = useState<Record<string, {
    value: string;
    label: string;
  }[]>>({});
  const [isBrandedActive, setIsBrandedActive] = useState(false);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({
    from: undefined,
    to: undefined
  });
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(undefined);
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const dateFilterRef = useRef<HTMLButtonElement>(null);
  const handleMultiSelect = (filterId: string, value: string, label: string, checked: boolean) => {
    setActiveFilters(prev => {
      const current = prev[filterId] || [];
      let updated: {
        value: string;
        label: string;
      }[];
      if (checked) {
        updated = [...current, {
          value,
          label
        }];
      } else {
        updated = current.filter(item => item.value !== value);
      }
      const newFilters = {
        ...prev
      };
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
      const newFilters = {
        ...prev
      };
      if (value === "all") {
        delete newFilters[filterId];
        onFilterChange?.(filterId, []);
      } else {
        newFilters[filterId] = [{
          value,
          label
        }];
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
        "date-range": [{
          value: "custom",
          label
        }]
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
      setCustomDateRange({
        from: undefined,
        to: undefined
      });
    }
    setActiveFilters(prev => {
      const current = prev[filterId] || [];
      const updated = current.filter(item => item.value !== value);
      const newFilters = {
        ...prev
      };
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
      setCustomDateRange({
        from: undefined,
        to: undefined
      });
    }
    setActiveFilters(prev => {
      const newFilters = {
        ...prev
      };
      delete newFilters[filterId];
      onFilterChange?.(filterId, []);
      return newFilters;
    });
  };
  const clearAllFilters = () => {
    Object.keys(activeFilters).forEach(filterId => {
      onFilterChange?.(filterId, []);
    });
    setActiveFilters({});
    setCustomDateRange({
      from: undefined,
      to: undefined
    });
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

  const activeFilterCount = Object.keys(activeFilters).length;
  return <div className="flex flex-wrap items-center gap-1.5">
      {visibleFilters.map(filter => {
      const selected = activeFilters[filter.id] || [];
      const isActive = selected.length > 0;
      const isMulti = filter.multiSelect;
      const isDateFilter = filter.id === "date-range";
      const dropdownMenu = <DropdownMenu key={filter.id}>
            <DropdownMenuTrigger asChild>
              {isActive ? (compactMode ? (
                <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-primary/10 border-primary text-primary">
                  <span>{filter.label} ({selected.length})</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              ) : <div className="inline-flex items-center gap-1 h-8 px-1.5 border border-input rounded-md bg-white min-w-[120px] max-w-[280px]">
                  <div className="flex flex-wrap gap-1 flex-1">
                    {selected.map(item => <span key={item.value} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
                        <button type="button" onPointerDown={e => e.stopPropagation()} onClick={e => {
                  e.stopPropagation();
                  handleRemoveValue(filter.id, item.value);
                }} className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${filter.label} filter: ${item.label}`}>
                          <X className="w-3 h-3" />
                        </button>
                        {item.label}
                      </span>)}
                  </div>
                  <div className="flex items-center gap-1 ml-auto pl-1">
                    <button type="button" onPointerDown={e => e.stopPropagation()} onClick={e => {
                e.stopPropagation();
                clearFilter(filter.id);
              }} className="text-muted-foreground hover:text-foreground" aria-label={`Clear ${filter.label} filter`}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>) : <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-white" ref={isDateFilter ? dateFilterRef : undefined}>
                  <span>{filter.label}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white z-50 min-w-[200px]" onCloseAutoFocus={e => e.preventDefault()}>
              <div className="max-h-[280px] overflow-y-auto">
                {/* Sub-header for People, Scene, Brand filters */}
                {(filter.id === "people" || filter.id === "scene" || filter.id === "brand") && <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-muted/30">
                    <i className="bi bi-stars text-primary/70" />
                    AI-Identified
                  </div>}
                {/* Grouped options for filters with hasGroups */}
                {filter.hasGroups ? (() => {
              const filteredOptions = filter.options;

              // Group options by their group property
              const groups = filteredOptions.reduce((acc, option) => {
                const group = option.group || "Other";
                if (!acc[group]) acc[group] = [];
                acc[group].push(option);
                return acc;
              }, {} as Record<string, FilterOption[]>);
              const groupOrder = ["Sports", "Teams", "Categories", "Shot Types", "Other"];
              const sortedGroups = Object.entries(groups).sort(([a], [b]) => groupOrder.indexOf(a) - groupOrder.indexOf(b));
              if (filteredOptions.length === 0) {
                return <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                          No results found
                        </div>;
              }
              return sortedGroups.map(([groupName, options]) => <div key={groupName}>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1 first:mt-0">
                          {groupName}
                        </div>
                        {options.map(option => {
                  const isAiGenerated = AI_GENERATED_TAGS.has(option.value) || AI_GENERATED_TAGS.has(option.label);
                  const showSparkle = isAiGenerated && option.group !== "Sports";
                  return <DropdownMenuCheckboxItem key={option.value} checked={selected.some(s => s.value === option.value)} onCheckedChange={checked => handleMultiSelect(filter.id, option.value, option.label, checked)} className="flex items-center justify-between gap-2">
                              <span>{option.label}</span>
                              {showSparkle && <i className="bi bi-stars text-primary/70 text-xs" />}
                            </DropdownMenuCheckboxItem>;
                })}
                      </div>);
            })() : <>
                    {filter.options.map(option => {
                const isTreeItem = filter.isTreeStructure && option.depth !== undefined;
                const indent = isTreeItem ? option.depth! * 12 : 0;
                const Icon = option.type === "gallery" ? Images : Folder;
                const categoryMap: Record<string, string> = { people: "People", scene: "Scene", brand: "Brand", tags: "Tag" };
                const isDisabledBySearch = disabledValues.some(
                  dv => dv.value.toLowerCase() === option.value.toLowerCase() && dv.category.toLowerCase() === (categoryMap[filter.id] || "").toLowerCase()
                );
return isMulti ? <DropdownMenuCheckboxItem key={option.value} checked={selected.some(s => s.value === option.value) || isDisabledBySearch} onCheckedChange={checked => {
                  if (isDisabledBySearch) {
                    onRemoveDisabledValue?.(option.value, categoryMap[filter.id] || "");
                  } else {
                    handleMultiSelect(filter.id, option.value, option.label, checked);
                  }
                }} style={{
                  paddingLeft: isTreeItem ? `${8 + indent}px` : undefined
                }} className="flex items-center gap-2" onSelect={e => e.preventDefault()}>
                            {isTreeItem && <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                            {option.icon && !isTreeItem && <option.icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                            <span className={cn("flex-1", option.depth === 0 ? "font-medium" : "")}>{option.label}</span>
                            {option.count !== undefined && <span className="text-xs text-muted-foreground ml-auto">{option.count}</span>}
                          </DropdownMenuCheckboxItem> : <DropdownMenuCheckboxItem key={option.value} checked={selected.some(s => s.value === option.value)} onCheckedChange={() => handleSingleSelect(filter.id, option.value, option.label)}>
                            {option.label}
                          </DropdownMenuCheckboxItem>;
              })}
                    {filter.options.filter(option => option.label.toLowerCase().includes((searchQueries[filter.id] || "").toLowerCase())).length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                        No results found
                      </div>}
                  </>}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>;

      if (isDateFilter) {
        return <div key={filter.id} className="relative">
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
                    <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
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
        </div>;
      }

      return dropdownMenu;
    })}


      {/* More Dropdown with Source & Status flyouts */}
      {(() => {
        const sourceOptions = [
          { label: "Posted Content", value: "posted-content", count: 12 },
          { label: "Imported Content", value: "imported-content", count: 8 },
          { label: "Published Content", value: "published-content", count: 15 },
          { label: "Uploaded Content", value: "uploaded-content", count: 22 },
          { label: "Engage Content", value: "engage-content", count: 5 },
          { label: "Requested Content", value: "requested-content", count: 3 },
        ];
        const statusOptions = [
          { label: "Pending", value: "pending", count: 14 },
          { label: "Approved", value: "approved", count: 38 },
          { label: "Rejected", value: "rejected", count: 7 },
        ];
        const orgStatusOptions = [
          { label: "All", value: "all", count: 65 },
          { label: "Organized", value: "organized", count: 42 },
          { label: "Unorganized", value: "unorganized", count: 23 },
        ];
        const sourceSelected = activeFilters["source"] || [];
        const statusSelected = activeFilters["status"] || [];
        const orgStatusSelected = activeFilters["organization-status"] || [];
        const moreCount = sourceSelected.length + statusSelected.length + orgStatusSelected.length;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-8 gap-1.5 px-2.5 text-xs font-medium bg-white", moreCount > 0 && "bg-primary/10 border-primary text-primary")}>
                <span>More</span>
                {moreCount > 0 && <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">{moreCount}</span>}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white z-50 min-w-[180px]">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-sm">Source</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-white z-50 min-w-[200px]">
                  {sourceOptions.map(opt => (
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
                  {statusOptions.map(opt => (
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
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-sm">Status</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-white z-50 min-w-[180px]">
                  {orgStatusOptions.map(opt => (
                    <DropdownMenuCheckboxItem
                      key={opt.value}
                      checked={orgStatusSelected.some(s => s.value === opt.value)}
                      onCheckedChange={(checked) => handleMultiSelect("organization-status", opt.value, opt.label, !!checked)}
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
        );
      })()}

      {/* Branded Toggle */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "h-8 w-8 flex-shrink-0",
          isBrandedActive && "bg-primary/10 border-primary text-primary"
        )}
        onClick={() => {
          const next = !isBrandedActive;
          setIsBrandedActive(next);
          onBrandedToggle?.(next);
        }}
      >
        <Palette className={cn("h-4 w-4", isBrandedActive && "fill-current")} />
      </Button>


      {/* Clear All */}
      {activeFilterCount > 0 && <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
          Clear all
        </Button>}
    </div>;
}