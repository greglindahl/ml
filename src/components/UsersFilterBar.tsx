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
import {
  getUniqueUserRoles,
  getUniqueUserGroups,
  getUniqueInviteCodes,
  getUniqueOrganizationRoles,
  getUniqueOrgDepartments,
} from "@/lib/mockUserData";
import { cn } from "@/lib/utils";

interface FilterValue {
  value: string;
  label: string;
}

export interface UsersFilterBarHandle {
  removeValue: (filterId: string, value: string) => void;
  clearAll: () => void;
}

interface UsersFilterBarProps {
  isNotificationsActive?: boolean;
  onNotificationsToggle?: (active: boolean) => void;
  onOpenFiltersSheet?: () => void;
  onActiveFiltersChange?: (filters: Record<string, FilterValue[]>) => void;
}

// Date-preset options — from production Last Login filter screenshot.
// Reused for Last Login + Join Date.
const dateOptions = [
  { label: "Last 7 days", value: "last-7-days" },
  { label: "Last 14 days", value: "last-14-days" },
  { label: "Last 30 days", value: "last-30-days" },
  { label: "Month to Date", value: "month-to-date" },
  { label: "Last 90 days", value: "last-90-days" },
  { label: "Last 12 months", value: "last-12-months" },
  { label: "Custom", value: "custom" },
];

const aiAssistOptions = [
  { label: "Opted-in", value: "Opted-in" },
  { label: "Opted-out", value: "Opted-out" },
  { label: "No Action", value: "No Action" },
];

const durationOptions = [
  { label: "1 year", value: "1 year" },
  { label: "2 years", value: "2 years" },
  { label: "3 years", value: "3 years" },
  { label: "4 years", value: "4 years" },
  { label: "5 years", value: "5 years" },
  { label: "6 years", value: "6 years" },
];

export const UsersFilterBar = forwardRef<UsersFilterBarHandle, UsersFilterBarProps>(
  function UsersFilterBar(
    {
      isNotificationsActive = false,
      onNotificationsToggle,
      onOpenFiltersSheet,
      onActiveFiltersChange,
    },
    ref
  ) {
    const [activeFilters, setActiveFilters] = useState<Record<string, FilterValue[]>>({});
    const [inviteCodeSearchQuery, setInviteCodeSearchQuery] = useState("");
    const [groupsSearchQuery, setGroupsSearchQuery] = useState("");

    const roles = getUniqueUserRoles();
    const groups = getUniqueUserGroups();
    const inviteCodes = getUniqueInviteCodes();
    const organizationRoles = getUniqueOrganizationRoles();
    const orgDepartments = getUniqueOrgDepartments();

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

    const rolesSelected = activeFilters["roles"] || [];
    const inviteCodesSelected = activeFilters["inviteCodes"] || [];
    const groupsSelected = activeFilters["groups"] || [];
    const aiAssistSelected = activeFilters["aiAssist"] || [];
    const lastLoginSelected = activeFilters["lastLogin"] || [];
    const joinDateSelected = activeFilters["joinDate"] || [];
    const organizationRoleSelected = activeFilters["organizationRole"] || [];
    const orgDepartmentSelected = activeFilters["orgDepartment"] || [];
    const durationSelected = activeFilters["duration"] || [];

    const totalActiveCount = Object.values(activeFilters).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    const filteredInviteCodes = inviteCodes.filter((c) =>
      c.toLowerCase().includes(inviteCodeSearchQuery.toLowerCase())
    );

    const filteredGroups = groups.filter((g) =>
      g.name.toLowerCase().includes(groupsSearchQuery.toLowerCase())
    );

    return (
      <div className="filter-bar-container cq-filterbar-hide-label-wide flex flex-wrap items-center gap-1.5">
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
          {/* 1. Roles (single-select) */}
          <DropdownMenu>
            <Tooltip delayDuration={700}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                      rolesSelected.length > 0 && "bg-primary/10 border-primary text-primary"
                    )}
                  >
                    <i className="bi bi-person-badge w-4 h-4 inline-flex items-center justify-center leading-none" />
                    <span className="filter-label">Roles</span>
                    {rolesSelected.length > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                        {rolesSelected.length}
                      </span>
                    )}
                    <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Roles</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="bg-popover z-50 min-w-[200px]" onCloseAutoFocus={(e) => e.preventDefault()}>
              <div className="max-h-[280px] overflow-y-auto">
                {roles.map((role) => (
                  <DropdownMenuCheckboxItem
                    key={role}
                    checked={rolesSelected.some((s) => s.value === role)}
                    onCheckedChange={() => handleSingleSelect("roles", role, role)}
                  >
                    {role}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 3. Invite Codes (multi + search) */}
          <DropdownMenu>
            <Tooltip delayDuration={700}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                      inviteCodesSelected.length > 0 && "bg-primary/10 border-primary text-primary"
                    )}
                  >
                    <i className="bi bi-ticket w-4 h-4 inline-flex items-center justify-center leading-none" />
                    <span className="filter-label">Invite Codes</span>
                    {inviteCodesSelected.length > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                        {inviteCodesSelected.length}
                      </span>
                    )}
                    <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Invite Codes</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="bg-popover z-50 min-w-[200px]" onCloseAutoFocus={(e) => e.preventDefault()}>
              <div className="px-2 py-2 border-b">
                <div className="relative">
                  <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                  <input
                    type="text"
                    placeholder="Search invite codes..."
                    value={inviteCodeSearchQuery}
                    onChange={(e) => setInviteCodeSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full h-8 pl-8 pr-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                {filteredInviteCodes.map((code) => (
                  <DropdownMenuCheckboxItem
                    key={code}
                    checked={inviteCodesSelected.some((s) => s.value === code)}
                    onCheckedChange={(checked) =>
                      handleMultiSelect("inviteCodes", code, code, checked as boolean)
                    }
                  >
                    {code}
                  </DropdownMenuCheckboxItem>
                ))}
                {filteredInviteCodes.length === 0 && (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                    No results found
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 4. Groups (multi + search) */}
          <DropdownMenu>
            <Tooltip delayDuration={700}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                      groupsSelected.length > 0 && "bg-primary/10 border-primary text-primary"
                    )}
                  >
                    <i className="bi bi-people w-4 h-4 inline-flex items-center justify-center leading-none" />
                    <span className="filter-label">Groups</span>
                    {groupsSelected.length > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                        {groupsSelected.length}
                      </span>
                    )}
                    <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Groups</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="bg-popover z-50 min-w-[200px]" onCloseAutoFocus={(e) => e.preventDefault()}>
              <div className="px-2 py-2 border-b">
                <div className="relative">
                  <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                  <input
                    type="text"
                    placeholder="Search groups..."
                    value={groupsSearchQuery}
                    onChange={(e) => setGroupsSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full h-8 pl-8 pr-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                {filteredGroups.map((group) => (
                  <DropdownMenuCheckboxItem
                    key={group.id}
                    checked={groupsSelected.some((s) => s.value === group.id)}
                    onCheckedChange={(checked) =>
                      handleMultiSelect("groups", group.id, group.name, checked as boolean)
                    }
                  >
                    {group.name}
                  </DropdownMenuCheckboxItem>
                ))}
                {filteredGroups.length === 0 && (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                    No results found
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 5. AI Assist (single-select) */}
          <DropdownMenu>
            <Tooltip delayDuration={700}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                      aiAssistSelected.length > 0 && "bg-primary/10 border-primary text-primary"
                    )}
                  >
                    <i className="bi bi-stars w-4 h-4 inline-flex items-center justify-center leading-none" />
                    <span className="filter-label">AI Assist</span>
                    {aiAssistSelected.length > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                        {aiAssistSelected.length}
                      </span>
                    )}
                    <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">AI Assist</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="bg-popover z-50 min-w-[200px]" onCloseAutoFocus={(e) => e.preventDefault()}>
              <div className="max-h-[280px] overflow-y-auto">
                {aiAssistOptions.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={aiAssistSelected.some((s) => s.value === option.value)}
                    onCheckedChange={() => handleSingleSelect("aiAssist", option.value, option.label)}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 6. Last Login (date-preset) */}
          <DropdownMenu>
            <Tooltip delayDuration={700}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                      lastLoginSelected.length > 0 && "bg-primary/10 border-primary text-primary"
                    )}
                  >
                    <i className="bi bi-clock-history w-4 h-4 inline-flex items-center justify-center leading-none" />
                    <span className="filter-label">Last Login</span>
                    {lastLoginSelected.length > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                        {lastLoginSelected.length}
                      </span>
                    )}
                    <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Last Login</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="bg-popover z-50 min-w-[200px]" onCloseAutoFocus={(e) => e.preventDefault()}>
              <div className="max-h-[280px] overflow-y-auto">
                {dateOptions.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={lastLoginSelected.some((s) => s.value === option.value)}
                    onCheckedChange={() => handleSingleSelect("lastLogin", option.value, option.label)}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 7. Join Date (date-preset) */}
          <DropdownMenu>
            <Tooltip delayDuration={700}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                      joinDateSelected.length > 0 && "bg-primary/10 border-primary text-primary"
                    )}
                  >
                    <i className="bi bi-calendar-plus w-4 h-4 inline-flex items-center justify-center leading-none" />
                    <span className="filter-label">Join Date</span>
                    {joinDateSelected.length > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                        {joinDateSelected.length}
                      </span>
                    )}
                    <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Join Date</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="bg-popover z-50 min-w-[200px]" onCloseAutoFocus={(e) => e.preventDefault()}>
              <div className="max-h-[280px] overflow-y-auto">
                {dateOptions.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={joinDateSelected.some((s) => s.value === option.value)}
                    onCheckedChange={() => handleSingleSelect("joinDate", option.value, option.label)}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 8. Organization Role (single-select) */}
          <DropdownMenu>
            <Tooltip delayDuration={700}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                      organizationRoleSelected.length > 0 && "bg-primary/10 border-primary text-primary"
                    )}
                  >
                    <i className="bi bi-briefcase w-4 h-4 inline-flex items-center justify-center leading-none" />
                    <span className="filter-label">Organization Role</span>
                    {organizationRoleSelected.length > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                        {organizationRoleSelected.length}
                      </span>
                    )}
                    <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Organization Role</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="bg-popover z-50 min-w-[200px]" onCloseAutoFocus={(e) => e.preventDefault()}>
              <div className="max-h-[280px] overflow-y-auto">
                {organizationRoles.map((orgRole) => (
                  <DropdownMenuCheckboxItem
                    key={orgRole}
                    checked={organizationRoleSelected.some((s) => s.value === orgRole)}
                    onCheckedChange={() => handleSingleSelect("organizationRole", orgRole, orgRole)}
                  >
                    {orgRole}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 9. Org Department (single-select) */}
          <DropdownMenu>
            <Tooltip delayDuration={700}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                      orgDepartmentSelected.length > 0 && "bg-primary/10 border-primary text-primary"
                    )}
                  >
                    <i className="bi bi-building w-4 h-4 inline-flex items-center justify-center leading-none" />
                    <span className="filter-label">Org Department</span>
                    {orgDepartmentSelected.length > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                        {orgDepartmentSelected.length}
                      </span>
                    )}
                    <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Org Department</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="bg-popover z-50 min-w-[200px]" onCloseAutoFocus={(e) => e.preventDefault()}>
              <div className="max-h-[280px] overflow-y-auto">
                {orgDepartments.map((dept) => (
                  <DropdownMenuCheckboxItem
                    key={dept}
                    checked={orgDepartmentSelected.some((s) => s.value === dept)}
                    onCheckedChange={() => handleSingleSelect("orgDepartment", dept, dept)}
                  >
                    {dept}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 9. Duration (single-select) */}
          <DropdownMenu>
            <Tooltip delayDuration={700}>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]",
                      durationSelected.length > 0 && "bg-primary/10 border-primary text-primary"
                    )}
                  >
                    <i className="bi bi-hourglass w-4 h-4 inline-flex items-center justify-center leading-none" />
                    <span className="filter-label">Duration</span>
                    {durationSelected.length > 0 && (
                      <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                        {durationSelected.length}
                      </span>
                    )}
                    <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Duration</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="bg-popover z-50 min-w-[200px]" onCloseAutoFocus={(e) => e.preventDefault()}>
              <div className="max-h-[280px] overflow-y-auto">
                {durationOptions.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={durationSelected.some((s) => s.value === option.value)}
                    onCheckedChange={() => handleSingleSelect("duration", option.value, option.label)}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 10. Notifications (binary toggle pill) */}
          <TogglePill
            label="Notifications"
            iconClass="bi-bell"
            tooltip="Show only users with notifications enabled"
            isActive={isNotificationsActive}
            onClick={() => onNotificationsToggle?.(!isNotificationsActive)}
          />
        </div>
      </div>
    );
  }
);
