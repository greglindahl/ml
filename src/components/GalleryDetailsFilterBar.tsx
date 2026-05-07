import { useState } from "react";
import { ChevronDown, Heart, Settings, Image as ImageIcon, Video, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
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
    const typeIcons: Record<string, LucideIcon> = { image: ImageIcon, video: Video };
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({ label: type.charAt(0).toUpperCase() + type.slice(1), value: type, count, icon: typeIcons[type] }));
  })(),
}, {
  id: "source",
  label: "Source",
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
}, {
  id: "view",
  label: "View",
  multiSelect: true,
  options: [
    { label: "All", value: "all", count: 65 },
    { label: "Viewed", value: "viewed", count: 42 },
    { label: "Not Viewed", value: "not-viewed", count: 23 },
  ],
}];

interface GalleryDetailsFilterBarProps {
  onFilterChange?: (filterId: string, values: string[]) => void;
  onFavoritesToggle?: (active: boolean) => void;
}

export function GalleryDetailsFilterBar({
  onFilterChange,
  onFavoritesToggle,
}: GalleryDetailsFilterBarProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: string; label: string }[]>>({});
  const [isFavoritesActive, setIsFavoritesActive] = useState(false);

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
                <ChevronDown className="w-4 h-4" />
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
                      {option.icon && <option.icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
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
    </div>
  );
}
