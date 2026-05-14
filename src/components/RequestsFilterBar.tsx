import { useState, useImperativeHandle, forwardRef } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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

// Mock groups for Assignee/Recipient filters
const mockGroups = [
  { id: "marketing", name: "Marketing Team" },
  { id: "social", name: "Social Media Team" },
  { id: "creative", name: "Creative Team" },
  { id: "operations", name: "Operations Team" },
];

export const RequestsFilterBar = forwardRef<RequestsFilterBarHandle, RequestsFilterBarProps>(
  function RequestsFilterBar(
    {
      isFlaggedActive = false,
      onFlaggedToggle,
      isArchivedActive = false,
      onArchivedToggle,
      onOpenFiltersSheet,
      onActiveFiltersChange,
    },
    ref
  ) {
    const [activeFilters, setActiveFilters] = useState<Record<string, FilterValue[]>>({});
    const [campaignSearchQuery, setCampaignSearchQuery] = useState("");
    const [creatorSearchQuery, setCreatorSearchQuery] = useState("");
    const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
    const [recipientSearchQuery, setRecipientSearchQuery] = useState("");

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

    const campaignSelected = activeFilters["campaign"] || [];
    const requestTypeSelected = activeFilters["requestType"] || [];
    const statusSelected = activeFilters["status"] || [];
    const creatorSelected = activeFilters["creator"] || [];
    const dateSelected = activeFilters["date"] || [];
    const assigneeSelected = activeFilters["assignee"] || [];
    const recipientSelected = activeFilters["recipient"] || [];

    // Calculate total active filter count for collapsed button
    const totalActiveCount = Object.values(activeFilters).reduce((sum, arr) => sum + arr.length, 0);

    const filteredCampaigns = campaigns.filter((c) =>
      c.name.toLowerCase().includes(campaignSearchQuery.toLowerCase())
    );

    const filteredCreators = creators.filter((c) =>
      c.name.toLowerCase().includes(creatorSearchQuery.toLowerCase())
    );

    const filteredAssigneeUsers = creators.filter((c) =>
      c.name.toLowerCase().includes(assigneeSearchQuery.toLowerCase())
    );

    const filteredAssigneeGroups = mockGroups.filter((g) =>
      g.name.toLowerCase().includes(assigneeSearchQuery.toLowerCase())
    );

    const filteredRecipientUsers = creators.filter((c) =>
      c.name.toLowerCase().includes(recipientSearchQuery.toLowerCase())
    );

    const filteredRecipientGroups = mockGroups.filter((g) =>
      g.name.toLowerCase().includes(recipientSearchQuery.toLowerCase())
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
          {/* Campaigns Dropdown */}
          <DropdownMenu>
            <Tooltip delayDuration={700}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                      campaignSelected.length > 0 && "bg-primary/10 border-primary text-primary"
                    )}
                  >
                    <i className="bi bi-layers w-4 h-4 inline-flex items-center justify-center leading-none" />
                    <span className="filter-label">Campaign</span>
                    {campaignSelected.length > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                        {campaignSelected.length}
                      </span>
                    )}
                    <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Campaign</TooltipContent>
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
                    placeholder="Search campaigns..."
                    value={campaignSearchQuery}
                    onChange={(e) => setCampaignSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full h-8 pl-8 pr-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                {filteredCampaigns.map((campaign) => (
                  <DropdownMenuCheckboxItem
                    key={campaign.id}
                    checked={campaignSelected.some((s) => s.value === campaign.id)}
                    onCheckedChange={(checked) =>
                      handleMultiSelect("campaign", campaign.id, campaign.name, checked as boolean)
                    }
                  >
                    {campaign.name}
                  </DropdownMenuCheckboxItem>
                ))}
                {filteredCampaigns.length === 0 && (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                    No results found
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

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

          {/* Assignee Dropdown (Users + Groups dual-section) */}
          <DropdownMenu>
            <Tooltip delayDuration={700}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                      assigneeSelected.length > 0 && "bg-primary/10 border-primary text-primary"
                    )}
                  >
                    <i className="bi bi-person-check w-4 h-4 inline-flex items-center justify-center leading-none" />
                    <span className="filter-label">Assignee</span>
                    {assigneeSelected.length > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                        {assigneeSelected.length}
                      </span>
                    )}
                    <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Assignee</TooltipContent>
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
                    placeholder="Search assignees..."
                    value={assigneeSearchQuery}
                    onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full h-8 pl-8 pr-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                {filteredAssigneeUsers.length > 0 && (
                  <>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Users</DropdownMenuLabel>
                    {filteredAssigneeUsers.map((user) => (
                      <DropdownMenuCheckboxItem
                        key={`user-${user.id}`}
                        checked={assigneeSelected.some((s) => s.value === `user-${user.id}`)}
                        onCheckedChange={(checked) =>
                          handleMultiSelect("assignee", `user-${user.id}`, user.name, checked as boolean)
                        }
                      >
                        {user.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </>
                )}
                {filteredAssigneeGroups.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Groups</DropdownMenuLabel>
                    {filteredAssigneeGroups.map((group) => (
                      <DropdownMenuCheckboxItem
                        key={`group-${group.id}`}
                        checked={assigneeSelected.some((s) => s.value === `group-${group.id}`)}
                        onCheckedChange={(checked) =>
                          handleMultiSelect("assignee", `group-${group.id}`, group.name, checked as boolean)
                        }
                      >
                        {group.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </>
                )}
                {filteredAssigneeUsers.length === 0 && filteredAssigneeGroups.length === 0 && (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                    No results found
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Recipient Dropdown (Users + Groups dual-section) */}
          <DropdownMenu>
            <Tooltip delayDuration={700}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                      recipientSelected.length > 0 && "bg-primary/10 border-primary text-primary"
                    )}
                  >
                    <i className="bi bi-send w-4 h-4 inline-flex items-center justify-center leading-none" />
                    <span className="filter-label">Recipient</span>
                    {recipientSelected.length > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                        {recipientSelected.length}
                      </span>
                    )}
                    <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Recipient</TooltipContent>
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
                    placeholder="Search recipients..."
                    value={recipientSearchQuery}
                    onChange={(e) => setRecipientSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full h-8 pl-8 pr-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                {filteredRecipientUsers.length > 0 && (
                  <>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Users</DropdownMenuLabel>
                    {filteredRecipientUsers.map((user) => (
                      <DropdownMenuCheckboxItem
                        key={`user-${user.id}`}
                        checked={recipientSelected.some((s) => s.value === `user-${user.id}`)}
                        onCheckedChange={(checked) =>
                          handleMultiSelect("recipient", `user-${user.id}`, user.name, checked as boolean)
                        }
                      >
                        {user.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </>
                )}
                {filteredRecipientGroups.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Groups</DropdownMenuLabel>
                    {filteredRecipientGroups.map((group) => (
                      <DropdownMenuCheckboxItem
                        key={`group-${group.id}`}
                        checked={recipientSelected.some((s) => s.value === `group-${group.id}`)}
                        onCheckedChange={(checked) =>
                          handleMultiSelect("recipient", `group-${group.id}`, group.name, checked as boolean)
                        }
                      >
                        {group.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </>
                )}
                {filteredRecipientUsers.length === 0 && filteredRecipientGroups.length === 0 && (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                    No results found
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

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
