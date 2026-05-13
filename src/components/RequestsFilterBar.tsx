import { useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { getUniqueRequestCreators } from "@/lib/mockCampaignData";

interface FilterValue {
  value: string;
  label: string;
}

interface RequestsFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterChange?: (filterId: string, values: string[]) => void;
}

const dateOptions = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "week" },
  { label: "Last 30 Days", value: "month" },
  { label: "Last 90 Days", value: "quarter" },
  { label: "Last Year", value: "year" },
  { label: "Custom", value: "custom" },
];

export function RequestsFilterBar({
  searchQuery,
  onSearchChange,
  onFilterChange,
}: RequestsFilterBarProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, FilterValue[]>>({});
  const [creatorSearchQuery, setCreatorSearchQuery] = useState("");

  const creators = getUniqueRequestCreators();

  const handleMultiSelect = (
    filterId: string,
    value: string,
    label: string,
    checked: boolean
  ) => {
    setActiveFilters((prev) => {
      const current = prev[filterId] || [];
      let updated: FilterValue[];
      if (checked) {
        updated = [...current, { value, label }];
      } else {
        updated = current.filter((item) => item.value !== value);
      }
      const newFilters = { ...prev };
      if (updated.length === 0) {
        delete newFilters[filterId];
      } else {
        newFilters[filterId] = updated;
      }
      onFilterChange?.(filterId, updated.map((i) => i.value));
      return newFilters;
    });
  };

  const handleSingleSelect = (filterId: string, value: string, label: string) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      newFilters[filterId] = [{ value, label }];
      onFilterChange?.(filterId, [value]);
      return newFilters;
    });
  };

  const handleRemoveFilter = (filterId: string, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[filterId] || [];
      const updated = current.filter((item) => item.value !== value);
      const newFilters = { ...prev };
      if (updated.length === 0) {
        delete newFilters[filterId];
      } else {
        newFilters[filterId] = updated;
      }
      onFilterChange?.(filterId, updated.map((i) => i.value));
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    onSearchChange("");
  };

  const creatorSelected = activeFilters["creator"] || [];
  const dateSelected = activeFilters["date"] || [];

  // Collect all active filter badges
  const allActiveBadges: { filterId: string; value: string; label: string }[] = [];

  if (searchQuery) {
    allActiveBadges.push({ filterId: "search", value: searchQuery, label: searchQuery });
  }

  Object.entries(activeFilters).forEach(([filterId, values]) => {
    values.forEach((v) => {
      allActiveBadges.push({ filterId, value: v.value, label: v.label });
    });
  });

  const filteredCreators = creators.filter((c) =>
    c.name.toLowerCase().includes(creatorSearchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Search Input */}
      <div className="relative">
        <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 rounded-full"
        />
      </div>

      {/* Filter Dropdowns Row */}
      <div className="flex items-center gap-1">
        {/* Creator Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]"
            >
              <span>Creator</span>
              {creatorSelected.length > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                  {creatorSelected.length}
                </span>
              )}
              <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="bg-popover z-50 min-w-[200px]"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <div className="px-2 py-2 border-b">
              <div className="relative">
                <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                <input
                  type="text"
                  placeholder="Search creators..."
                  value={creatorSearchQuery}
                  onChange={(e) => setCreatorSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full h-8 pl-8 pr-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              {filteredCreators.map((creator) => (
                <DropdownMenuCheckboxItem
                  key={creator.id}
                  checked={creatorSelected.some((s) => s.value === creator.id)}
                  onCheckedChange={(checked) =>
                    handleMultiSelect("creator", creator.id, creator.name, checked as boolean)
                  }
                >
                  {creator.name}
                </DropdownMenuCheckboxItem>
              ))}
              {filteredCreators.length === 0 && (
                <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                  No results found
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Created Date Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]"
            >
              <span>Created Date</span>
              {dateSelected.length > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                  {dateSelected.length}
                </span>
              )}
              <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="bg-popover z-50 min-w-[200px]"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <div className="max-h-[280px] overflow-y-auto">
              {dateOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={dateSelected.some((s) => s.value === option.value)}
                  onCheckedChange={() =>
                    handleSingleSelect("date", option.value, option.label)
                  }
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings/More Button */}
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-10 p-0 rounded-md bg-white border-gray-300 text-[#6e84a3]"
        >
          <i className="bi bi-sliders2 text-lg" />
        </Button>
      </div>

      {/* Active Filter Badges */}
      {allActiveBadges.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {allActiveBadges.map((badge) => (
            <Badge
              key={`${badge.filterId}-${badge.value}`}
              colorStyle="secondary"
              theme="subtle"
              shape="rounded"
              onRemove={() => {
                if (badge.filterId === "search") {
                  onSearchChange("");
                } else {
                  handleRemoveFilter(badge.filterId, badge.value);
                }
              }}
            >
              {badge.label}
            </Badge>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-sm text-primary hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
