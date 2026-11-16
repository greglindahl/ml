import { useState, useImperativeHandle, forwardRef } from "react";
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
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TogglePill } from "./TogglePill";
import { mockCampaigns, getUniqueRequestCreators } from "@/lib/mockCampaignData";
import { cn } from "@/lib/utils";

interface FilterValue {
  value: string;
  label: string;
}

export interface RequestsFilterBarHandle {
  removeValue: (filterId: string, value: string) => void;
  clearAll: () => void;
}

interface RequestsFilterBarProps {
  isFlaggedActive?: boolean;
  onFlaggedToggle?: (active: boolean) => void;
  isArchivedActive?: boolean;
  onArchivedToggle?: (active: boolean) => void;
  onOpenFiltersSheet?: () => void;
  onActiveFiltersChange?: (filters: Record<string, FilterValue[]>) => void;
  /** Inside a campaign every request already belongs to it, so the Campaign filter goes. */
  hideCampaignFilter?: boolean;
}

const dateOptions = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "week" },
  { label: "Last 30 Days", value: "month" },
  { label: "Last 90 Days", value: "quarter" },
  { label: "Last Year", value: "year" },
  { label: "Custom", value: "custom" },
];

const statusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Delivered", value: "delivered" },
  { label: "Completed", value: "completed" },
  { label: "Expired", value: "expired" },
];

const requestTypeOptions = [
  { label: "Post to social", value: "post-to-social" },
  { label: "Create content and post to social", value: "create-and-post-to-social" },
  { label: "Create content", value: "create-content" },
  { label: "Review content", value: "review-content" },
];

// Mock groups for the Assigned/Recipient Group filters
const mockGroups = [
  { id: "marketing", name: "Marketing Team" },
  { id: "social", name: "Social Media Team" },
  { id: "creative", name: "Creative Team" },
  { id: "operations", name: "Operations Team" },
];

/**
 * Prod filters assignees and recipients as four separate params
 * (assigneeUserIds / assigneeGroupIds / recipientUserIds / recipientGroupIds),
 * so they're four facets here too. A combined Users + Groups facet needs a
 * backend change first.
 */
export const STAKEHOLDER_FACETS = [
  { id: "assignedUser", label: "Assigned User", icon: "bi-person-check", kind: "user", placeholder: "Search users..." },
  { id: "assignedGroup", label: "Assigned Group", icon: "bi-people", kind: "group", placeholder: "Search groups..." },
  { id: "recipientUser", label: "Recipient User", icon: "bi-send", kind: "user", placeholder: "Search users..." },
  { id: "recipientGroup", label: "Recipient Group", icon: "bi-send-check", kind: "group", placeholder: "Search groups..." },
] as const;

/** Filters that sit behind the More dropdown instead of in the row. */
export const MORE_FILTER_IDS: string[] = ["campaign", "creator", "assignedGroup", "recipientGroup"];

/** ML-style More dropdown (as on Manage Users): one search-and-check flyout per filter. */
function MoreFilters({
  items,
  activeFilters,
  onToggle,
}: {
  items: { id: string; label: string; placeholder: string; options: { id: string; name: string }[] }[];
  activeFilters: Record<string, FilterValue[]>;
  onToggle: (filterId: string, value: string, label: string, checked: boolean) => void;
}) {
  const [queries, setQueries] = useState<Record<string, string>>({});
  const selectedCount = items.reduce((sum, i) => sum + (activeFilters[i.id]?.length ?? 0), 0);
  return (
    <DropdownMenu>
      <Tooltip delayDuration={700}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                selectedCount > 0 && "bg-primary/10 border-primary text-primary"
              )}
            >
              <i className="bi bi-three-dots w-4 h-4 inline-flex items-center justify-center leading-none" />
              <span className="filter-label">More</span>
              {selectedCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                  {selectedCount}
                </span>
              )}
              <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">More filters</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="bg-popover z-50 min-w-[200px]" onCloseAutoFocus={(e) => e.preventDefault()}>
        {items.map((item) => {
          const selected = activeFilters[item.id] || [];
          const query = queries[item.id] ?? "";
          const visible = item.options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()));
          return (
            <DropdownMenuSub key={item.id}>
              <DropdownMenuSubTrigger>
                {item.label}
                {selected.length > 0 && <span className="ml-auto text-[13px] text-primary">{selected.length}</span>}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-white z-50 min-w-[200px]">
                <div className="px-2 py-2 border-b">
                  <div className="relative">
                    <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                    <input
                      type="text"
                      placeholder={item.placeholder}
                      value={query}
                      onChange={(e) => setQueries((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="w-full h-8 pl-8 pr-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {visible.map((o) => (
                    <DropdownMenuCheckboxItem
                      key={o.id}
                      checked={selected.some((s) => s.value === o.id)}
                      onCheckedChange={(checked) => onToggle(item.id, o.id, o.name, checked as boolean)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {o.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {visible.length === 0 && <div className="px-2 py-3 text-xs text-muted-foreground text-center">No results found</div>}
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StakeholderFacet({
  label,
  icon,
  placeholder,
  options,
  selected,
  onToggle,
}: {
  label: string;
  icon: string;
  placeholder: string;
  options: { id: string; name: string }[];
  selected: FilterValue[];
  onToggle: (value: string, name: string, checked: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const visible = options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <DropdownMenu>
      <Tooltip delayDuration={700}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                selected.length > 0 && "bg-primary/10 border-primary text-primary"
              )}
            >
              <i className={cn("bi w-4 h-4 inline-flex items-center justify-center leading-none", icon)} />
              <span className="filter-label">{label}</span>
              {selected.length > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                  {selected.length}
                </span>
              )}
              <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="bg-popover z-50 min-w-[200px]" onCloseAutoFocus={(e) => e.preventDefault()}>
        <div className="px-2 py-2 border-b">
          <div className="relative">
            <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
            <input
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full h-8 pl-8 pr-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="max-h-[280px] overflow-y-auto">
          {visible.map((o) => (
            <DropdownMenuCheckboxItem
              key={o.id}
              checked={selected.some((s) => s.value === o.id)}
              onCheckedChange={(checked) => onToggle(o.id, o.name, checked as boolean)}
              onSelect={(e) => e.preventDefault()}
            >
              {o.name}
            </DropdownMenuCheckboxItem>
          ))}
          {visible.length === 0 && <div className="px-2 py-3 text-xs text-muted-foreground text-center">No results found</div>}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const RequestsFilterBar = forwardRef<RequestsFilterBarHandle, RequestsFilterBarProps>(
  function RequestsFilterBar(
    {
      isFlaggedActive = false,
      onFlaggedToggle,
      isArchivedActive = false,
      onArchivedToggle,
      onOpenFiltersSheet,
      onActiveFiltersChange,
      hideCampaignFilter = false,
    },
    ref
  ) {
    const [activeFilters, setActiveFilters] = useState<Record<string, FilterValue[]>>({});

    const creators = getUniqueRequestCreators();
    const campaigns = mockCampaigns;

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

    const requestTypeSelected = activeFilters["requestType"] || [];
    const statusSelected = activeFilters["status"] || [];
    const dateSelected = activeFilters["date"] || [];

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
          {/* Request Type Dropdown (single select) */}
          <DropdownMenu>
            <Tooltip delayDuration={700}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                      requestTypeSelected.length > 0 && "bg-primary/10 border-primary text-primary"
                    )}
                  >
                    <i className="bi bi-card-checklist w-4 h-4 inline-flex items-center justify-center leading-none" />
                    <span className="filter-label">Request Type</span>
                    {requestTypeSelected.length > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                        {requestTypeSelected.length}
                      </span>
                    )}
                    <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Request Type</TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              align="start"
              className="bg-popover z-50 min-w-[200px]"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <div className="max-h-[280px] overflow-y-auto">
                {requestTypeOptions.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={requestTypeSelected.some((s) => s.value === option.value)}
                    onCheckedChange={() =>
                      handleSingleSelect("requestType", option.value, option.label)
                    }
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Dropdown (multi select) */}
          <DropdownMenu>
            <Tooltip delayDuration={700}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                      statusSelected.length > 0 && "bg-primary/10 border-primary text-primary"
                    )}
                  >
                    <i className="bi bi-hourglass-split w-4 h-4 inline-flex items-center justify-center leading-none" />
                    <span className="filter-label">Status</span>
                    {statusSelected.length > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                        {statusSelected.length}
                      </span>
                    )}
                    <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Status</TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              align="start"
              className="bg-popover z-50 min-w-[200px]"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <div className="max-h-[280px] overflow-y-auto">
                {statusOptions.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={statusSelected.some((s) => s.value === option.value)}
                    onCheckedChange={(checked) =>
                      handleMultiSelect("status", option.value, option.label, checked as boolean)
                    }
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
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

          {/* Assigned User, Recipient User. Their group twins live in More. */}
          {STAKEHOLDER_FACETS.filter((f) => !MORE_FILTER_IDS.includes(f.id)).map((f) => (
            <StakeholderFacet
              key={f.id}
              label={f.label}
              icon={f.icon}
              placeholder={f.placeholder}
              options={f.kind === "user" ? creators : mockGroups}
              selected={activeFilters[f.id] || []}
              onToggle={(value, name, checked) => handleMultiSelect(f.id, value, name, checked)}
            />
          ))}

          {/* More: the least-used filters (Mixpanel, last 12 months, customers only:
              Campaign 1 user, Creator 1, Assigned Group 0, Recipient Group 0) */}
          <MoreFilters
            items={[
              ...(hideCampaignFilter
                ? []
                : [{ id: "campaign", label: "Campaign", placeholder: "Search campaigns...", options: campaigns }]),
              { id: "creator", label: "Creator", placeholder: "Search creators...", options: creators },
              ...STAKEHOLDER_FACETS.filter((f) => MORE_FILTER_IDS.includes(f.id)).map((f) => ({
                id: f.id,
                label: f.label,
                placeholder: f.placeholder,
                options: f.kind === "user" ? creators : mockGroups,
              })),
            ]}
            activeFilters={activeFilters}
            onToggle={handleMultiSelect}
          />


          {/* Flagged pill */}
          <TogglePill
            label="Flagged"
            iconClass="bi-flag-fill"
            tooltip="Show only flagged requests"
            isActive={isFlaggedActive}
            onClick={() => onFlaggedToggle?.(!isFlaggedActive)}
          />

          {/* Archived pill */}
          <TogglePill
            label="Archived"
            iconClass="bi-archive"
            tooltip="Show only archived requests"
            isActive={isArchivedActive}
            onClick={() => onArchivedToggle?.(!isArchivedActive)}
          />
        </div>
      </div>
    );
  }
);
