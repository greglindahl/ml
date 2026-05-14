import { useState, useRef } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UsersFilterBar, UsersFilterBarHandle } from "./UsersFilterBar";
import { UsersTable } from "./UsersTable";
import {
  UsersSettingsDrawer,
  useUsersPerPage,
  useUsersColumnVisibility,
  useUsersFilterVisibility,
} from "./UsersSettingsDrawer";
import { FiltersSheet, FilterSection } from "./FiltersSheet";
import {
  mockUsers,
  getUniqueUserRoles,
  getUniqueUserGroups,
} from "@/lib/mockUserData";

interface FilterValue {
  value: string;
  label: string;
}

interface AdminScreenProps {
  isMobile?: boolean;
}

export function AdminScreen({ isMobile = false }: AdminScreenProps) {
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
      if (filterId === "roles") icon = <i className="bi bi-shield text-sm" />;
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
    <div className={`flex-1 flex flex-col pb-12 content-container ${isMobile ? "pt-[58px]" : "pt-20"}`}>
      {/* Header */}
      <div className="px-4 md:px-8 xl:px-16 py-4">
        <h1 className="text-[26px] font-semibold text-foreground">Network</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="manage-users" className="flex flex-col px-4 md:px-8 xl:px-16">
        <div className="border-b">
          <TabsList>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="invite-codes">Invite Codes</TabsTrigger>
            <TabsTrigger value="manage-users">Manage Users</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="groups" className="flex-1 py-6 mt-0 data-[state=inactive]:hidden">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Groups content placeholder</p>
          </div>
        </TabsContent>

        <TabsContent value="invite-codes" className="flex-1 py-6 mt-0 data-[state=inactive]:hidden">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Invite Codes content placeholder</p>
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

      {/* Settings Drawer */}
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

      {/* FiltersSheet for narrow widths */}
      <FiltersSheet
        open={usersFiltersSheetOpen}
        onOpenChange={setUsersFiltersSheetOpen}
        value={{ notifications: usersNotificationsActive }}
        onApply={(draft) => {
          setUsersNotificationsActive(draft.notifications as boolean);
        }}
        title="User Filters"
      >
        <FilterSection label="Roles" icon="bi-shield">
          <div className="space-y-2">
            {getUniqueUserRoles().map((role) => (
              <label key={role} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={usersActiveFilters.roles?.some((f) => f.value === role)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setUsersActiveFilters((prev) => ({
                        ...prev,
                        roles: [{ value: role, label: role }],
                      }));
                    } else {
                      setUsersActiveFilters((prev) => {
                        const next = { ...prev };
                        delete next.roles;
                        return next;
                      });
                    }
                  }}
                />
                <span className="text-sm">{role}</span>
              </label>
            ))}
          </div>
        </FilterSection>
        <FilterSection label="Groups" icon="bi-people">
          <div className="space-y-2">
            {getUniqueUserGroups().map((group) => (
              <label key={group.id} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={usersActiveFilters.groups?.some((f) => f.value === group.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setUsersActiveFilters((prev) => ({
                        ...prev,
                        groups: [
                          ...(prev.groups || []),
                          { value: group.id, label: group.name },
                        ],
                      }));
                    } else {
                      setUsersActiveFilters((prev) => ({
                        ...prev,
                        groups: (prev.groups || []).filter((f) => f.value !== group.id),
                      }));
                    }
                  }}
                />
                <span className="text-sm">{group.name}</span>
              </label>
            ))}
          </div>
        </FilterSection>
        <FilterSection label="Notifications" icon="bi-bell">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={usersNotificationsActive}
              onCheckedChange={(checked) => setUsersNotificationsActive(checked as boolean)}
            />
            <span className="text-sm">Show only users with notifications enabled</span>
          </label>
        </FilterSection>
      </FiltersSheet>
    </div>
  );
}
