import { useState, useEffect, useRef } from "react";
import { ChevronDown, X, Heart, Settings, Image as ImageIcon, Video, Info, type LucideIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// Popover removed — custom date uses a plain positioned div
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { mockLibraryAssets } from "@/lib/mockLibraryData";
interface FilterOption {
  label: string;
  value: string;
  count?: number;
  icon?: LucideIcon;
}
interface FilterConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  options: FilterOption[];
  multiSelect?: boolean;
}

const CREATOR_MAP: Record<string, string> = { john: "John Smith", jane: "Jane Doe", alex: "Alex Johnson" };

const filters: FilterConfig[] = [{
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
  id: "source",
  label: "Source",
  icon: null,
  multiSelect: true,
  options: [
    { label: "Posted Content", value: "posted-content", count: 12 },
    { label: "Imported Content", value: "imported-content", count: 8 },
    { label: "Published Content", value: "published-content", count: 15 },
    { label: "Uploaded Content", value: "uploaded-content", count: 22 },
    { label: "Engage Content", value: "engage-content", count: 5 },
    { label: "Requested Content", value: "requested-content", count: 3 },
  ],
}, {
  id: "tags",
  label: "Tags",
  icon: null,
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
  id: "date-range",
  label: "Capture Date",
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
  id: "view",
  label: "View",
  icon: null,
  multiSelect: true,
  options: [
    { label: "All", value: "all", count: 65 },
    { label: "Viewed", value: "viewed", count: 42 },
    { label: "Not Viewed", value: "not-viewed", count: 23 },
  ],
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
  onFavoritesToggle?: (active: boolean) => void;
  compactMode?: boolean;
  handleRef?: React.MutableRefObject<FilterBarHandle | null>;
}
export function FilterBar({
  onFilterChange,
  onCustomDateChange,
  hideFilters = [],
  onFavoritesToggle,
  compactMode = false,
  handleRef,
}: FilterBarProps) {
  // Filter out hidden filters
  const visibleFilters = filters.filter(f => !hideFilters.includes(f.id));
  const [activeFilters, setActiveFilters] = useState<Record<string, {
    value: string;
    label: string;
  }[]>>({});
  const [isFavoritesActive, setIsFavoritesActive] = useState(false);
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
                <Button variant="outline" size="sm" className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-primary/10 border-primary text-primary">
                  <span>{filter.label}</span>
                  <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">{selected.length}</span>
                  <ChevronDown className="w-4 h-4 opacity-50" />
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
                </div>) : <Button variant="outline" size="sm" className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]" ref={isDateFilter ? dateFilterRef : undefined}>
                  <span>{filter.label}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white z-50 min-w-[200px]" onCloseAutoFocus={e => e.preventDefault()}>
              <div className="max-h-[280px] overflow-y-auto">
                {filter.options.map(option => {
                  return isMulti ? (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={selected.some(s => s.value === option.value)}
                      onCheckedChange={checked => handleMultiSelect(filter.id, option.value, option.label, checked)}
                      className="flex items-center gap-2"
                      onSelect={e => e.preventDefault()}
                    >
                      {option.icon && <option.icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                      <span className="flex-1">{option.label}</span>
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

      {/* Favorites Toggle */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "h-10 w-10 flex-shrink-0 rounded-md border-gray-300 bg-white text-[#6e84a3]",
          isFavoritesActive && "bg-primary/10 border-primary text-primary"
        )}
        onClick={() => {
          const next = !isFavoritesActive;
          setIsFavoritesActive(next);
          onFavoritesToggle?.(next);
        }}
      >
        <Heart className={cn("h-4 w-4", isFavoritesActive && "fill-current")} />
      </Button>

      {/* Settings Button */}
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 flex-shrink-0 rounded-md border-gray-300 bg-white text-[#6e84a3]"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>;
}