import { useState, useImperativeHandle, forwardRef } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TogglePill } from "./TogglePill";
import { getUniqueCampaignCreators } from "@/lib/mockCampaignData";
import { cn } from "@/lib/utils";

interface FilterValue {
  value: string;
  label: string;
}

export interface CampaignsFilterBarHandle {
  removeValue: (filterId: string, value: string) => void;
  clearAll: () => void;
}

interface CampaignsFilterBarProps {
  isArchivedActive?: boolean;
  onArchivedToggle?: (active: boolean) => void;
  onOpenFiltersSheet?: () => void;
  onActiveFiltersChange?: (filters: Record<string, FilterValue[]>) => void;
}

const dateOptions = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "week" },
  { label: "Last 30 Days", value: "month" },
  { label: "Last 90 Days", value: "quarter" },
  { label: "Last Year", value: "year" },
  { label: "Custom", value: "custom" },
];

export const CampaignsFilterBar = forwardRef<CampaignsFilterBarHandle, CampaignsFilterBarProps>(
  function CampaignsFilterBar(
    {
      isArchivedActive = false,
      onArchivedToggle,
      onOpenFiltersSheet,
      onActiveFiltersChange,
    },
    ref
  ) {
    const [activeFilters, setActiveFilters] = useState<Record<string, FilterValue[]>>({});
    const [creatorSearchQuery, setCreatorSearchQuery] = useState("");

    const creators = getUniqueCampaignCreators();

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      removeValue: (filterId: string, value: string) => {
        handleRemoveValue(filterId, value);
      },
      clearAll: () => {
        setActiveFilters({});
        onActiveFiltersChange?.({});
      },
    }));

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
        onActiveFiltersChange?.(newFilters);
        return newFilters;
      });
    };

    const handleSingleSelect = (filterId: string, value: string, label: string) => {
      setActiveFilters((prev) => {
        const newFilters = { ...prev };
        newFilters[filterId] = [{ value, label }];
        onActiveFiltersChange?.(newFilters);
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
        onActiveFiltersChange?.(newFilters);
        return newFilters;
      });
    };

    const clearFilter = (filterId: string) => {
      setActiveFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters[filterId];
        onActiveFiltersChange?.(newFilters);
        return newFilters;
      });
    };

    const creatorSelected = activeFilters["creator"] || [];
    const dateSelected = activeFilters["date"] || [];

    // Calculate total active filter count for collapsed button
    const totalActiveCount = Object.values(activeFilters).reduce((sum, arr) => sum + arr.length, 0);

    const filteredCreators = creators.filter((c) =>
      c.name.toLowerCase().includes(creatorSearchQuery.toLowerCase())
    );

    return (
      <div className="filter-bar-container cq-filterbar-hide-label flex flex-wrap items-center gap-1.5">
        {/* Collapsed Filters Button (visible at narrow widths) */}
        <Button
          variant="outline"
          size="sm"
          className="filters-collapsed-button h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]"
          onClick={onOpenFiltersSheet}
        >
          <i className="bi bi-filter w-4 h-4 inline-flex items-center justify-center leading-none" />
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
          {/* Creator Dropdown */}
          <DropdownMenu>
            <Tooltip delayDuration={700}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                      creatorSelected.length > 0 && "bg-primary/10 border-primary text-primary"
                    )}
                  >
                    <i className="bi bi-person w-4 h-4 inline-flex items-center justify-center leading-none" />
                    <span className="filter-label">Creator</span>
                    {creatorSelected.length > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                        {creatorSelected.length}
                      </span>
                    )}
                    <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Creator</TooltipContent>
            </Tooltip>
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
            <Tooltip delayDuration={700}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                      dateSelected.length > 0 && "bg-primary/10 border-primary text-primary"
                    )}
                  >
                    <i className="bi bi-calendar w-4 h-4 inline-flex items-center justify-center leading-none" />
                    <span className="filter-label">Created Date</span>
                    {dateSelected.length > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                        {dateSelected.length}
                      </span>
                    )}
                    <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Created Date</TooltipContent>
            </Tooltip>
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

          {/* Archived pill */}
          <TogglePill
            label="Archived"
            iconClass="bi-archive"
            tooltip="Show only archived campaigns"
            isActive={isArchivedActive}
            onClick={() => onArchivedToggle?.(!isArchivedActive)}
          />
        </div>
      </div>
    );
  }
);
