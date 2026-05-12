import { useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { TogglePill } from "./TogglePill";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  options: FilterOption[];
  multiSelect?: boolean;
}

const galleryFilters: FilterConfig[] = [
{
  id: "gallery-options",
  label: "Gallery Options",
  icon: <i className="bi bi-collection" />,
  multiSelect: true,
  options: [
  { label: "View Only", value: "view-only" },
  { label: "Allow Upload", value: "allow-upload" },
  { label: "Public", value: "public" }]

},
{
  id: "creator",
  label: "Creator",
  icon: <i className="bi bi-person" />,
  multiSelect: true,
  options: [
  { label: "John Smith", value: "john" },
  { label: "Jane Doe", value: "jane" },
  { label: "Alex Johnson", value: "alex" }]

},
{
  id: "groups",
  label: "Groups",
  icon: <i className="bi bi-people" />,
  multiSelect: true,
  options: [
  { label: "Marketing", value: "marketing" },
  { label: "Social Media", value: "social-media" },
  { label: "Creative", value: "creative" },
  { label: "Operations", value: "operations" }]

},
{
  id: "created-date",
  label: "Created Date",
  icon: <i className="bi bi-calendar" />,
  options: [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "week" },
  { label: "Last 30 Days", value: "month" },
  { label: "Last 90 Days", value: "quarter" },
  { label: "Last Year", value: "year" },
  { label: "Custom", value: "custom" }]

},
{
  id: "assets-last-added",
  label: "Assets Last Added Date",
  icon: <i className="bi bi-calendar" />,
  options: [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "week" },
  { label: "Last 30 Days", value: "month" },
  { label: "Last 90 Days", value: "quarter" },
  { label: "Last Year", value: "year" },
  { label: "Custom", value: "custom" }]

}];


interface GalleryFilterBarProps {
  isArchivedActive?: boolean;
  onArchivedToggle?: (active: boolean) => void;
  onOpenFiltersSheet?: () => void;
}

export function GalleryFilterBar({
  isArchivedActive = false,
  onArchivedToggle,
  onOpenFiltersSheet,
}: GalleryFilterBarProps = {}) {
  const [activeFilters, setActiveFilters] = useState<
    Record<string, {value: string;label: string;}[]>>(
    {});
  // Search state for filter dropdowns
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  const handleMultiSelect = (
  filterId: string,
  value: string,
  label: string,
  checked: boolean) =>
  {
    setActiveFilters((prev) => {
      const current = prev[filterId] || [];
      let updated: {value: string;label: string;}[];
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
      return newFilters;
    });
  };

  const handleSingleSelect = (filterId: string, value: string, label: string) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      newFilters[filterId] = [{ value, label }];
      return newFilters;
    });
  };

  const handleRemoveValue = (filterId: string, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[filterId] || [];
      const updated = current.filter((item) => item.value !== value);
      const newFilters = { ...prev };
      if (updated.length === 0) {
        delete newFilters[filterId];
      } else {
        newFilters[filterId] = updated;
      }
      return newFilters;
    });
  };

  const clearFilter = (filterId: string) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[filterId];
      return newFilters;
    });
  };

  // Calculate total active filter count for collapsed button
  const totalActiveCount = Object.values(activeFilters).reduce((sum, arr) => sum + arr.length, 0);

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
      {galleryFilters.map((filter) => {
        const selected = activeFilters[filter.id] || [];
        const isActive = selected.length > 0;
        const isMulti = filter.multiSelect;

        return (
          <DropdownMenu key={filter.id}>
            <DropdownMenuTrigger asChild>
              {isActive ?
              <div className="inline-flex items-center gap-1 h-8 px-1.5 border border-input rounded-md bg-card min-w-[120px] max-w-[280px]">
                  <div className="flex flex-wrap gap-1 flex-1">
                    {selected.map((item) =>
                  <span
                    key={item.value}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
                    
                        <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveValue(filter.id, item.value);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Remove ${filter.label} filter: ${item.label}`}>
                      
                          <i className="bi bi-x text-xs" />
                        </button>
                        {item.label}
                      </span>
                  )}
                  </div>
                  <div className="flex items-center gap-1 ml-auto pl-1">
                    <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFilter(filter.id);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Clear ${filter.label} filter`}>
                    
                      <i className="bi bi-x text-sm" />
                    </button>
                    <i className="bi bi-chevron-down w-3.5 h-3.5 inline-flex items-center justify-center leading-none text-muted-foreground" />
                  </div>
                </div> :

              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]">

                  {filter.icon}<span className="filter-label">{filter.label}</span>
                  <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                </Button>
              }
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="bg-popover z-50 min-w-[200px]"
              onCloseAutoFocus={(e) => e.preventDefault()}>
              {/* Search input for Creator and Groups filters */}
              {(filter.id === "creator" || filter.id === "groups") && (
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
                {filter.options
                  .filter(option => {
                    if (filter.id !== "creator" && filter.id !== "groups") return true;
                    const query = (searchQueries[filter.id] ?? "").toLowerCase();
                    return option.label.toLowerCase().includes(query);
                  })
                  .map((option) =>
                isMulti ?
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={selected.some((s) => s.value === option.value)}
                  onCheckedChange={(checked) =>
                  handleMultiSelect(
                    filter.id,
                    option.value,
                    option.label,
                    checked as boolean
                  )
                  }>

                        {option.label}
                      </DropdownMenuCheckboxItem> :

                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={selected.some((s) => s.value === option.value)}
                  onCheckedChange={() =>
                  handleSingleSelect(filter.id, option.value, option.label)
                  }>

                        {option.label}
                      </DropdownMenuCheckboxItem>

                )}
                {/* No results message */}
                {(filter.id === "creator" || filter.id === "groups") &&
                  filter.options.filter(opt => opt.label.toLowerCase().includes((searchQueries[filter.id] ?? "").toLowerCase())).length === 0 && (
                    <div className="px-2 py-3 text-xs text-muted-foreground text-center">No results found</div>
                  )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>);

      })}
      </div>{/* End filters-expanded */}

      {/* Archived pill (always visible) */}
      <TogglePill
        label="Archived"
        iconClass="bi-archive"
        isActive={isArchivedActive}
        onClick={() => onArchivedToggle?.(!isArchivedActive)}
      />
    </div>);

}