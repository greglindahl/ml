import { useState, useEffect } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { mockLibraryAssets } from "@/lib/mockLibraryData";
import { TogglePill } from "./TogglePill";

interface FilterOption {
  label: string;
  value: string;
  count?: number;
  iconClass?: string;
}

interface FilterConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  options: FilterOption[];
  multiSelect?: boolean;
}

const CREATOR_MAP: Record<string, string> = { john: "John Smith", jane: "Jane Doe", alex: "Alex Johnson" };

// Hardcoded recent tags for prototype
const RECENT_TAGS = ["Lebron James", "Dunk", "Nike", "Celebration", "Kevin Durant"];

const filters: FilterConfig[] = [{
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
  id: "date-range",
  label: "Capture Date",
  icon: <i className="bi bi-calendar" />,
  options: [
    { label: "Last 7 days", value: "week" },
    { label: "Last 14 days", value: "two-weeks" },
    { label: "Last 30 days", value: "month" },
    { label: "Month to Date", value: "mtd" },
    { label: "Last 90 days", value: "quarter" },
    { label: "Last 12 months", value: "year" },
  ],
}];

// Options for the More dropdown sub-flyouts
const sourceOptions: FilterOption[] = [
  { label: "Posted Content", value: "posted-content", count: 12 },
  { label: "Imported Content", value: "imported-content", count: 8 },
  { label: "Published Content", value: "published-content", count: 15 },
  { label: "Uploaded Content", value: "uploaded-content", count: 22 },
  { label: "Engage Content", value: "engage-content", count: 5 },
  { label: "Requested Content", value: "requested-content", count: 3 },
];

const approvalStatusOptions: FilterOption[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

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
  onFavoritesToggle?: (active: boolean) => void;
  onActiveFiltersChange?: (chips: ActiveFilterChip[]) => void;
  handleRef?: React.MutableRefObject<GalleryDetailsFilterBarHandle | null>;
  // Toggle pill states
  isUnviewedActive?: boolean;
  onUnviewedToggle?: (active: boolean) => void;
  onOpenFiltersSheet?: () => void;
}

export function GalleryDetailsFilterBar({
  onFilterChange,
  onFavoritesToggle,
  onActiveFiltersChange,
  handleRef,
  isUnviewedActive = false,
  onUnviewedToggle,
  onOpenFiltersSheet,
}: GalleryDetailsFilterBarProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: string; label: string }[]>>({});
  const [isFavoritesActive, setIsFavoritesActive] = useState(false);
  // State for More dropdown sub-flyouts (source and approval-status)
  const [sourceSelections, setSourceSelections] = useState<{ value: string; label: string }[]>([]);
  const [approvalStatusSelections, setApprovalStatusSelections] = useState<{ value: string; label: string }[]>([]);
  // Search state for standard filter dropdowns
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  // Search state for sub-flyouts (More)
  const [subSearchQueries, setSubSearchQueries] = useState<Record<string, string>>({});

  // Calculate total active filter count for collapsed button
  const standardFiltersCount = Object.values(activeFilters).reduce((sum, arr) => sum + arr.length, 0);
  const totalActiveCount = standardFiltersCount + sourceSelections.length + approvalStatusSelections.length;

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

  return (
    <div className="filter-bar-container cq-filterbar-hide-label flex flex-wrap items-center gap-1.5">
      {/* Collapsed Filters Button (visible at narrow widths) */}
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

      {/* Expanded Filters (visible at wide widths) */}
      <div className="filters-expanded contents">
      {filters.map(filter => {
        const selected = activeFilters[filter.id] || [];
        const isActive = selected.length > 0;
        const isMulti = filter.multiSelect;

        return (
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
              {/* Search input for filters with many options (tags, creator) */}
              {(filter.id === "tags" || filter.id === "creator") && (
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
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/30">
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
                                <span className="text-xs text-muted-foreground ml-auto">{option.count}</span>
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
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground bg-muted/30">
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
                                <span className="text-xs text-muted-foreground ml-auto">{option.count}</span>
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
                        if (filter.id !== "creator") return true;
                        const query = (searchQueries[filter.id] ?? "").toLowerCase();
                        return option.label.toLowerCase().includes(query);
                      })
                      .map(option => (
                        isMulti ? (
                          <DropdownMenuCheckboxItem
                            key={option.value}
                            checked={selected.some(s => s.value === option.value)}
                            onCheckedChange={checked => handleMultiSelect(filter.id, option.value, option.label, checked)}
                            className="flex items-center gap-2"
                            onSelect={e => e.preventDefault()}
                          >
                            {option.iconClass && <i className={`bi ${option.iconClass} text-sm text-muted-foreground flex-shrink-0`} />}
                            <span className="flex-1">{option.label}</span>
                            {option.count !== undefined && (
                              <span className="text-xs text-muted-foreground ml-auto">{option.count}</span>
                            )}
                          </DropdownMenuCheckboxItem>
                        ) : (
                          <DropdownMenuCheckboxItem
                            key={option.value}
                            checked={selected.some(s => s.value === option.value)}
                            onCheckedChange={() => handleSingleSelect(filter.id, option.value, option.label)}
                          >
                            {option.label}
                          </DropdownMenuCheckboxItem>
                        )
                      ))}
                    {/* No results message for creator */}
                    {filter.id === "creator" &&
                      filter.options.filter(opt => opt.label.toLowerCase().includes((searchQueries[filter.id] ?? "").toLowerCase())).length === 0 && (
                        <div className="px-2 py-3 text-xs text-muted-foreground text-center">No results found</div>
                      )}
                  </>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}

      {/* More dropdown with sub-flyouts */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
              (sourceSelections.length > 0 || approvalStatusSelections.length > 0) && "bg-primary/10 border-primary text-primary"
            )}
          >
            <span>More</span>
            {(sourceSelections.length > 0 || approvalStatusSelections.length > 0) && (
              <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                {sourceSelections.length + approvalStatusSelections.length}
              </span>
            )}
            <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-white z-50 min-w-[200px]">
          {/* Source sub-flyout */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <i className="bi bi-box-arrow-in-right text-sm text-muted-foreground" />
              <span>Source</span>
              {sourceSelections.length > 0 && (
                <span className="ml-auto inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                  {sourceSelections.length}
                </span>
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="bg-white z-50 min-w-[200px]">
                <div className="px-2 py-2 border-b">
                  <div className="relative">
                    <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                    <input
                      type="text"
                      placeholder="Search source..."
                      value={subSearchQueries["source"] ?? ""}
                      onChange={e => setSubSearchQueries(prev => ({ ...prev, source: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                      onKeyDown={e => e.stopPropagation()}
                      className="w-full h-8 pl-8 pr-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {sourceOptions
                    .filter(opt => opt.label.toLowerCase().includes((subSearchQueries["source"] ?? "").toLowerCase()))
                    .map(option => (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={sourceSelections.some(s => s.value === option.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSourceSelections(prev => [...prev, { value: option.value, label: option.label }]);
                          } else {
                            setSourceSelections(prev => prev.filter(s => s.value !== option.value));
                          }
                          onFilterChange?.("source", checked
                            ? [...sourceSelections.map(s => s.value), option.value]
                            : sourceSelections.filter(s => s.value !== option.value).map(s => s.value)
                          );
                        }}
                        onSelect={e => e.preventDefault()}
                      >
                        <span className="flex-1">{option.label}</span>
                        {option.count !== undefined && (
                          <span className="text-xs text-muted-foreground ml-auto">{option.count}</span>
                        )}
                      </DropdownMenuCheckboxItem>
                    ))}
                  {sourceOptions.filter(opt => opt.label.toLowerCase().includes((subSearchQueries["source"] ?? "").toLowerCase())).length === 0 && (
                    <div className="px-2 py-3 text-xs text-muted-foreground text-center">No results found</div>
                  )}
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          {/* Approval Status sub-flyout */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <i className="bi bi-check-circle text-sm text-muted-foreground" />
              <span>Approval Status</span>
              {approvalStatusSelections.length > 0 && (
                <span className="ml-auto inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                  {approvalStatusSelections.length}
                </span>
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="bg-white z-50 min-w-[200px]">
                <div className="px-2 py-2 border-b">
                  <div className="relative">
                    <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                    <input
                      type="text"
                      placeholder="Search status..."
                      value={subSearchQueries["approval-status"] ?? ""}
                      onChange={e => setSubSearchQueries(prev => ({ ...prev, "approval-status": e.target.value }))}
                      onClick={e => e.stopPropagation()}
                      onKeyDown={e => e.stopPropagation()}
                      className="w-full h-8 pl-8 pr-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {approvalStatusOptions
                    .filter(opt => opt.label.toLowerCase().includes((subSearchQueries["approval-status"] ?? "").toLowerCase()))
                    .map(option => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={approvalStatusSelections.some(s => s.value === option.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setApprovalStatusSelections(prev => [...prev, { value: option.value, label: option.label }]);
                        } else {
                          setApprovalStatusSelections(prev => prev.filter(s => s.value !== option.value));
                        }
                        onFilterChange?.("approval-status", checked
                          ? [...approvalStatusSelections.map(s => s.value), option.value]
                          : approvalStatusSelections.filter(s => s.value !== option.value).map(s => s.value)
                        );
                      }}
                      onSelect={e => e.preventDefault()}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {approvalStatusOptions.filter(opt => opt.label.toLowerCase().includes((subSearchQueries["approval-status"] ?? "").toLowerCase())).length === 0 && (
                    <div className="px-2 py-3 text-xs text-muted-foreground text-center">No results found</div>
                  )}
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>{/* End filters-expanded */}

      {/* Unviewed Only pill */}
      <TogglePill
        label="Unviewed Only"
        iconClass="bi-eye-slash"
        isActive={isUnviewedActive}
        onClick={() => onUnviewedToggle?.(!isUnviewedActive)}
      />

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
        <i className={cn("bi h-4 w-4", isFavoritesActive ? "bi-heart-fill" : "bi-heart")} />
      </Button>
    </div>
  );
}
