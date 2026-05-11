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
  options: FilterOption[];
  multiSelect?: boolean;
}

const CREATOR_MAP: Record<string, string> = { john: "John Smith", jane: "Jane Doe", alex: "Alex Johnson" };

const filters: FilterConfig[] = [{
  id: "content-type",
  label: "Type",
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
}

export function GalleryDetailsFilterBar({
  onFilterChange,
  onFavoritesToggle,
  onActiveFiltersChange,
  handleRef,
  isUnviewedActive = false,
  onUnviewedToggle,
}: GalleryDetailsFilterBarProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: string; label: string }[]>>({});
  const [isFavoritesActive, setIsFavoritesActive] = useState(false);
  // State for More dropdown sub-flyouts (source and approval-status)
  const [sourceSelections, setSourceSelections] = useState<{ value: string; label: string }[]>([]);
  const [approvalStatusSelections, setApprovalStatusSelections] = useState<{ value: string; label: string }[]>([]);

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
    <div className="flex flex-wrap items-center gap-1.5">
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
                <span>{filter.label}</span>
                {isActive && (
                  <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                    {selected.length}
                  </span>
                )}
                <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white z-50 min-w-[200px]">
              <div className="max-h-[280px] overflow-y-auto">
                {filter.options.map(option => (
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
                <div className="max-h-[280px] overflow-y-auto">
                  {sourceOptions.map(option => (
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
                <div className="max-h-[280px] overflow-y-auto">
                  {approvalStatusOptions.map(option => (
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
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

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
