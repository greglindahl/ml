import { useState, useRef } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { UsersFilterBar, UsersFilterBarHandle } from "./UsersFilterBar";
import { UsersTable } from "./UsersTable";
import {
  UsersSettingsDrawer,
  useUsersPerPage,
  useUsersColumnVisibility,
  useUsersFilterVisibility,
} from "./UsersSettingsDrawer";
import { GroupsTable } from "./GroupsTable";
import {
  GroupsSettingsDrawer,
  useGroupsPerPage,
  useGroupsColumnVisibility,
} from "./GroupsSettingsDrawer";
import { InviteCodesTable } from "./InviteCodesTable";
import {
  InviteCodesSettingsDrawer,
  useInviteCodesPerPage,
  useInviteCodesColumnVisibility,
} from "./InviteCodesSettingsDrawer";
import { FiltersSheet, FilterSection } from "./FiltersSheet";
import {
  mockUsers,
  getUniqueUserRoles,
  getUniqueUserGroups,
  getUniqueInviteCodes,
  getUniqueOrganizationRoles,
  getUniqueOrgDepartments,
} from "@/lib/mockUserData";
import { mockGroups } from "@/lib/mockGroupData";
import { mockInviteCodes } from "@/lib/mockInviteCodeData";

type NetworkTab = "groups" | "invite-codes" | "manage-users";

interface FilterValue {
  value: string;
  label: string;
}

// Option lists for the mobile FiltersSheet — kept in sync with UsersFilterBar
const SHEET_DATE_OPTIONS: FilterValue[] = [
  { label: "Last 7 days", value: "last-7-days" },
  { label: "Last 14 days", value: "last-14-days" },
  { label: "Last 30 days", value: "last-30-days" },
  { label: "Month to Date", value: "month-to-date" },
  { label: "Last 90 days", value: "last-90-days" },
  { label: "Last 12 months", value: "last-12-months" },
  { label: "Custom", value: "custom" },
];

const SHEET_AI_ASSIST_OPTIONS: FilterValue[] = [
  { label: "Opted-in", value: "Opted-in" },
  { label: "Opted-out", value: "Opted-out" },
  { label: "No Action", value: "No Action" },
];

const SHEET_DURATION_OPTIONS: FilterValue[] = [
  { label: "1 year", value: "1 year" },
  { label: "2 years", value: "2 years" },
  { label: "3 years", value: "3 years" },
  { label: "4 years", value: "4 years" },
  { label: "5 years", value: "5 years" },
  { label: "6 years", value: "6 years" },
];

// Full-width form-field-style dropdown used inside FilterSection rows in the mobile sheet
interface MobileFilterDropdownProps {
  filterId: string;
  placeholder: string;
  options: FilterValue[];
  isMulti?: boolean;
  hasSearch?: boolean;
  activeFilters: Record<string, FilterValue[]>;
  setActiveFilters: React.Dispatch<React.SetStateAction<Record<string, FilterValue[]>>>;
}

function MobileFilterDropdown({
  filterId,
  placeholder,
  options,
  isMulti = false,
  hasSearch = false,
  activeFilters,
  setActiveFilters,
}: MobileFilterDropdownProps) {
  const [search, setSearch] = useState("");
  const selected = activeFilters[filterId] || [];
  const filtered = hasSearch
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;
  const display =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? selected[0].label
      : `${selected.length} selected`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal h-10">
          <span className={cn(selected.length === 0 && "text-muted-foreground")}>{display}</span>
          <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[var(--radix-dropdown-menu-trigger-width)] bg-white"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {hasSearch && (
          <div className="px-2 py-2 border-b">
            <div className="relative">
              <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full h-8 pl-8 pr-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}
        <div className="max-h-[280px] overflow-y-auto">
          {filtered.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={selected.some((s) => s.value === opt.value)}
              onCheckedChange={(checked) => {
                if (isMulti) {
                  if (checked) {
                    setActiveFilters((prev) => ({
                      ...prev,
                      [filterId]: [...(prev[filterId] || []), opt],
                    }));
                  } else {
                    setActiveFilters((prev) => {
                      const remaining = (prev[filterId] || []).filter((f) => f.value !== opt.value);
                      const next = { ...prev };
                      if (remaining.length === 0) delete next[filterId];
                      else next[filterId] = remaining;
                      return next;
                    });
                  }
                } else {
                  if (checked) {
                    setActiveFilters((prev) => ({ ...prev, [filterId]: [opt] }));
                  } else {
                    setActiveFilters((prev) => {
                      const next = { ...prev };
                      delete next[filterId];
                      return next;
                    });
                  }
                }
              }}
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          ))}
          {filtered.length === 0 && (
            <div className="px-2 py-3 text-xs text-muted-foreground text-center">
              No results found
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AdminScreenProps {
  isMobile?: boolean;
}

export function AdminScreen({ isMobile = false }: AdminScreenProps) {
  // Active tab — controlled so the header CTA can swap its label
  const [activeTab, setActiveTab] = useState<NetworkTab>("groups");

  // Groups tab state
  const [groupsSearchQuery, setGroupsSearchQuery] = useState("");
  const [groupsSettingsOpen, setGroupsSettingsOpen] = useState(false);
  const [groupsPerPage, setGroupsPerPage] = useGroupsPerPage(40);
  const [groupsColumnVisibility, setGroupsColumnVisibility] = useGroupsColumnVisibility();

  // Invite Codes tab state
  const [inviteCodesSearchQuery, setInviteCodesSearchQuery] = useState("");
  const [inviteCodesSettingsOpen, setInviteCodesSettingsOpen] = useState(false);
  const [inviteCodesPerPage, setInviteCodesPerPage] = useInviteCodesPerPage(40);
  const [inviteCodesColumnVisibility, setInviteCodesColumnVisibility] = useInviteCodesColumnVisibility();

  // Manage Users state
  const [usersSearchQuery, setUsersSearchQuery] = useState("");
  const [usersSettingsOpen, setUsersSettingsOpen] = useState(false);
  const [usersPerPage, setUsersPerPage] = useUsersPerPage(40);
  const [usersColumnVisibility, setUsersColumnVisibility] = useUsersColumnVisibility();
  const [usersFilterVisibility, setUsersFilterVisibility] = useUsersFilterVisibility();
  const [usersActiveFilters, setUsersActiveFilters] = useState<Record<string, FilterValue[]>>({});
  const [usersNotificationsActive, setUsersNotificationsActive] = useState(false);
  const [usersFiltersSheetOpen, setUsersFiltersSheetOpen] = useState(false);
  const usersFilterBarRef = useRef<UsersFilterBarHandle>(null);

  // Build active filter chips (lifted to parent, matches RequestsScreen pattern)
  const usersChips: { label: string; value: string; filterId: string; icon: React.ReactNode }[] = [];
  Object.entries(usersActiveFilters).forEach(([filterId, values]) => {
    values.forEach((v) => {
      let icon = <i className="bi bi-tag text-sm" />;
      if (filterId === "roles") icon = <i className="bi bi-person-badge text-sm" />;
      if (filterId === "inviteCodes") icon = <i className="bi bi-ticket text-sm" />;
      if (filterId === "groups") icon = <i className="bi bi-people text-sm" />;
      if (filterId === "aiAssist") icon = <i className="bi bi-stars text-sm" />;
      if (filterId === "lastLogin") icon = <i className="bi bi-clock-history text-sm" />;
      if (filterId === "joinDate") icon = <i className="bi bi-calendar-plus text-sm" />;
      if (filterId === "organizationRole") icon = <i className="bi bi-briefcase text-sm" />;
      if (filterId === "orgDepartment") icon = <i className="bi bi-building text-sm" />;
      if (filterId === "duration") icon = <i className="bi bi-hourglass text-sm" />;
      usersChips.push({ label: v.label, value: v.value, filterId, icon });
    });
  });

  const handleRemoveUsersChip = (chip: typeof usersChips[0]) => {
    usersFilterBarRef.current?.removeValue(chip.filterId, chip.value);
  };

  const handleClearAllUsersChips = () => {
    usersFilterBarRef.current?.clearAll();
  };

  return (
    <div className={`flex-1 flex flex-col pb-12 content-container ${isMobile ? "pt-[58px]" : ""}`}>
      {/* Spacer for consistent header position - matches LibraryScreen */}
      {!isMobile && <div className="mb-2 h-[44px] flex-shrink-0" />}
      {/* Header */}
      <div className="px-4 md:px-8 xl:px-16 pb-4 flex items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold text-foreground">Network</h1>
        {activeTab === "groups" && (
          <Button onClick={() => {}}>
            <i className="bi bi-plus-circle text-base" />
            New Group
          </Button>
        )}
        {activeTab === "invite-codes" && (
          <Button onClick={() => {}}>
            <i className="bi bi-plus-circle text-base" />
            New Invite Code
          </Button>
        )}
        {activeTab === "manage-users" && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => {}}>
              <i className="bi bi-file-earmark-arrow-down text-base" />
              Export All Users
            </Button>
            <Button onClick={() => {}}>
              <i className="bi bi-plus-circle text-base" />
              New User
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as NetworkTab)} className="flex flex-col px-4 md:px-8 xl:px-16">
        <div className="border-b">
          <TabsList>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="invite-codes">Invite Codes</TabsTrigger>
            <TabsTrigger value="manage-users">Manage Users</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="groups" className="py-6 mt-0 flex flex-col gap-4 data-[state=inactive]:hidden">
          {/* Search Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={groupsSearchQuery}
                onChange={(e) => setGroupsSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-8 text-[15px] border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {groupsSearchQuery && (
                <button
                  type="button"
                  onClick={() => setGroupsSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <i className="bi bi-x-lg text-sm" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Tooltip delayDuration={700}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-md border-gray-300 bg-white text-[#6e84a3]"
                    onClick={() => setGroupsSettingsOpen(true)}
                  >
                    <i className="bi bi-gear w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Settings</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="min-h-[24px]" />

          <div className="min-h-[400px]">
            <GroupsTable
              groups={mockGroups}
              searchQuery={groupsSearchQuery}
              perPage={groupsPerPage}
              columnVisibility={groupsColumnVisibility}
            />
          </div>
        </TabsContent>

        <TabsContent value="invite-codes" className="py-6 mt-0 flex flex-col gap-4 data-[state=inactive]:hidden">
          {/* Search Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={inviteCodesSearchQuery}
                onChange={(e) => setInviteCodesSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-8 text-[15px] border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {inviteCodesSearchQuery && (
                <button
                  type="button"
                  onClick={() => setInviteCodesSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <i className="bi bi-x-lg text-sm" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Tooltip delayDuration={700}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-md border-gray-300 bg-white text-[#6e84a3]"
                    onClick={() => setInviteCodesSettingsOpen(true)}
                  >
                    <i className="bi bi-gear w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Settings</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="min-h-[24px]" />

          <div className="min-h-[400px]">
            <InviteCodesTable
              inviteCodes={mockInviteCodes}
              searchQuery={inviteCodesSearchQuery}
              perPage={inviteCodesPerPage}
              columnVisibility={inviteCodesColumnVisibility}
            />
          </div>
        </TabsContent>

        <TabsContent value="manage-users" className="py-6 mt-0 flex flex-col gap-4 data-[state=inactive]:hidden">
          {/* Search Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={usersSearchQuery}
                onChange={(e) => setUsersSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-8 text-[15px] border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {usersSearchQuery && (
                <button
                  type="button"
                  onClick={() => setUsersSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <i className="bi bi-x-lg text-sm" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Tooltip delayDuration={700}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-md border-gray-300 bg-white text-[#6e84a3]"
                    onClick={() => setUsersSettingsOpen(true)}
                  >
                    <i className="bi bi-gear w-4 h-4 inline-flex items-center justify-center leading-none" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Settings</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Filter Row */}
          <div>
            <UsersFilterBar
              ref={usersFilterBarRef}
              isNotificationsActive={usersNotificationsActive}
              onNotificationsToggle={setUsersNotificationsActive}
              onActiveFiltersChange={setUsersActiveFilters}
              onOpenFiltersSheet={() => setUsersFiltersSheetOpen(true)}
            />
          </div>

          {/* Active Filter Chips */}
          <div className="min-h-[24px]">
            {usersChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {usersChips.map((chip, i) => (
                  <Badge
                    key={`${chip.filterId}-${chip.value}-${i}`}
                    colorStyle="primary"
                    theme="soft"
                    shape="rounded"
                    className="gap-1.5 pr-1.5 cursor-pointer transition-colors hover:bg-primary/30 text-[13px] normal-case tracking-normal font-normal"
                    onClick={() => handleRemoveUsersChip(chip)}
                  >
                    {chip.icon}
                    {chip.label}
                    <i className="bi bi-x text-sm ml-0.5" />
                  </Badge>
                ))}
                <button
                  onClick={handleClearAllUsersChips}
                  className="text-[13px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="min-h-[400px]">
            <UsersTable
              users={mockUsers}
              searchQuery={usersSearchQuery}
              perPage={usersPerPage}
              columnVisibility={usersColumnVisibility}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Settings Drawers */}
      <UsersSettingsDrawer
        open={usersSettingsOpen}
        onOpenChange={setUsersSettingsOpen}
        perPage={usersPerPage}
        onPerPageChange={setUsersPerPage}
        columnVisibility={usersColumnVisibility}
        onColumnVisibilityChange={setUsersColumnVisibility}
        filterVisibility={usersFilterVisibility}
        onFilterVisibilityChange={setUsersFilterVisibility}
      />
      <GroupsSettingsDrawer
        open={groupsSettingsOpen}
        onOpenChange={setGroupsSettingsOpen}
        perPage={groupsPerPage}
        onPerPageChange={setGroupsPerPage}
        columnVisibility={groupsColumnVisibility}
        onColumnVisibilityChange={setGroupsColumnVisibility}
      />
      <InviteCodesSettingsDrawer
        open={inviteCodesSettingsOpen}
        onOpenChange={setInviteCodesSettingsOpen}
        perPage={inviteCodesPerPage}
        onPerPageChange={setInviteCodesPerPage}
        columnVisibility={inviteCodesColumnVisibility}
        onColumnVisibilityChange={setInviteCodesColumnVisibility}
      />

      {/* FiltersSheet for narrow widths */}
      <FiltersSheet
        open={usersFiltersSheetOpen}
        onOpenChange={setUsersFiltersSheetOpen}
        value={{}}
        onApply={() => {}}
        title="Filter"
      >
        <FilterSection label="Groups">
          <MobileFilterDropdown
            filterId="groups"
            placeholder="Search"
            options={getUniqueUserGroups().map((g) => ({ value: g.id, label: g.name }))}
            isMulti
            hasSearch
            activeFilters={usersActiveFilters}
            setActiveFilters={setUsersActiveFilters}
          />
        </FilterSection>
        <FilterSection label="Invite Codes">
          <MobileFilterDropdown
            filterId="inviteCodes"
            placeholder="Search"
            options={getUniqueInviteCodes().map((c) => ({ value: c, label: c }))}
            isMulti
            hasSearch
            activeFilters={usersActiveFilters}
            setActiveFilters={setUsersActiveFilters}
          />
        </FilterSection>
        <FilterSection label="Roles">
          <MobileFilterDropdown
            filterId="roles"
            placeholder="All Roles"
            options={getUniqueUserRoles().map((r) => ({ value: r, label: r }))}
            activeFilters={usersActiveFilters}
            setActiveFilters={setUsersActiveFilters}
          />
        </FilterSection>
        <FilterSection label="AI Assist">
          <MobileFilterDropdown
            filterId="aiAssist"
            placeholder="Select"
            options={SHEET_AI_ASSIST_OPTIONS}
            activeFilters={usersActiveFilters}
            setActiveFilters={setUsersActiveFilters}
          />
        </FilterSection>
        <FilterSection label="Last Login">
          <MobileFilterDropdown
            filterId="lastLogin"
            placeholder="Select"
            options={SHEET_DATE_OPTIONS}
            activeFilters={usersActiveFilters}
            setActiveFilters={setUsersActiveFilters}
          />
        </FilterSection>
        <FilterSection label="Join Date">
          <MobileFilterDropdown
            filterId="joinDate"
            placeholder="Select"
            options={SHEET_DATE_OPTIONS}
            activeFilters={usersActiveFilters}
            setActiveFilters={setUsersActiveFilters}
          />
        </FilterSection>
        <FilterSection label="Duration">
          <MobileFilterDropdown
            filterId="duration"
            placeholder="Select"
            options={SHEET_DURATION_OPTIONS}
            activeFilters={usersActiveFilters}
            setActiveFilters={setUsersActiveFilters}
          />
        </FilterSection>
        <FilterSection label="Organization Role">
          <MobileFilterDropdown
            filterId="organizationRole"
            placeholder="Select"
            options={getUniqueOrganizationRoles().map((r) => ({ value: r, label: r }))}
            activeFilters={usersActiveFilters}
            setActiveFilters={setUsersActiveFilters}
          />
        </FilterSection>
        <FilterSection label="Org Department">
          <MobileFilterDropdown
            filterId="orgDepartment"
            placeholder="Select"
            options={getUniqueOrgDepartments().map((d) => ({ value: d, label: d }))}
            activeFilters={usersActiveFilters}
            setActiveFilters={setUsersActiveFilters}
          />
        </FilterSection>
        <FilterSection label="Notifications">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between font-normal h-10">
                <span className={cn(!usersNotificationsActive && "text-muted-foreground")}>
                  {usersNotificationsActive ? "Enabled" : "All"}
                </span>
                <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[var(--radix-dropdown-menu-trigger-width)] bg-white"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuCheckboxItem
                checked={!usersNotificationsActive}
                onCheckedChange={() => setUsersNotificationsActive(false)}
              >
                All
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={usersNotificationsActive}
                onCheckedChange={() => setUsersNotificationsActive(true)}
              >
                Enabled
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </FilterSection>
      </FiltersSheet>
    </div>
  );
}
