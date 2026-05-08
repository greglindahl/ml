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
  options: FilterOption[];
  multiSelect?: boolean;
}

const galleryFilters: FilterConfig[] = [
{
  id: "gallery-options",
  label: "Gallery Options",
  multiSelect: true,
  options: [
  { label: "View Only", value: "view-only" },
  { label: "Allow Upload", value: "allow-upload" },
  { label: "Public", value: "public" }]

},
{
  id: "creator",
  label: "Creator",
  multiSelect: true,
  options: [
  { label: "John Smith", value: "john" },
  { label: "Jane Doe", value: "jane" },
  { label: "Alex Johnson", value: "alex" }]

},
{
  id: "groups",
  label: "Groups",
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
}

export function GalleryFilterBar({
  isArchivedActive = false,
  onArchivedToggle,
}: GalleryFilterBarProps = {}) {
  const [activeFilters, setActiveFilters] = useState<
    Record<string, {value: string;label: string;}[]>>(
    {});

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

  return (
    <div className="flex flex-wrap items-center gap-1.5">
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
                    <i className="bi bi-chevron-down w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div> :

              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]">

                  <span>{filter.label}</span>
                  <i className="bi bi-chevron-down w-4 h-4" />
                </Button>
              }
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="bg-popover z-50 min-w-[200px]"
              onCloseAutoFocus={(e) => e.preventDefault()}>
              
              <div className="max-h-[280px] overflow-y-auto">
                {filter.options.map((option) =>
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
              </div>
            </DropdownMenuContent>
          </DropdownMenu>);

      })}

      {/* Archived pill */}
      <TogglePill
        label="Archived"
        iconClass="bi-archive"
        isActive={isArchivedActive}
        onClick={() => onArchivedToggle?.(!isArchivedActive)}
      />
    </div>);

}