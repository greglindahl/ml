import { useRef, useState } from "react";
import { SettingsButton } from "@/components/ListFilters";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RequestsFilterBar, RequestsFilterBarHandle } from "./RequestsFilterBar";
import { RequestsTable } from "./RequestsTable";
import {
  RequestsSettingsDrawer,
  useRequestsPerPage,
  useRequestsColumnVisibility,
  useRequestsFilterVisibility,
} from "./RequestsSettingsDrawer";
import { FiltersSheet, FilterSection } from "./FiltersSheet";
import { getUniqueRequestCreators, type Request } from "@/lib/mockCampaignData";

interface FilterValue {
  value: string;
  label: string;
}

/**
 * The Requests list: search + settings, filter row, applied chips, table, View
 * Settings drawer and the narrow-width filters sheet. Shared by Requests › Requests
 * and a campaign's own Requests tab, which drops the Campaign filter and column.
 */
export function RequestsListPanel({ requests, withinCampaign = false }: { requests: Request[]; withinCampaign?: boolean }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [perPage, setPerPage] = useRequestsPerPage(40);
  const [columnVisibility, setColumnVisibility] = useRequestsColumnVisibility();
  const [filterVisibility, setFilterVisibility] = useRequestsFilterVisibility();
  const [activeFilters, setActiveFilters] = useState<Record<string, FilterValue[]>>({});
  const [flaggedActive, setFlaggedActive] = useState(false);
  const [archivedActive, setArchivedActive] = useState(false);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const filterBarRef = useRef<RequestsFilterBarHandle>(null);

  const chips: { label: string; value: string; filterId: string; icon: React.ReactNode }[] = [];
  Object.entries(activeFilters).forEach(([filterId, values]) => {
    values.forEach((v) => {
      let icon = <i className="bi bi-tag text-sm" />;
      if (filterId === "campaign") icon = <i className="bi bi-layers text-sm" />;
      if (filterId === "requestType") icon = <i className="bi bi-card-checklist text-sm" />;
      if (filterId === "status") icon = <i className="bi bi-hourglass-split text-sm" />;
      if (filterId === "creator") icon = <i className="bi bi-person text-sm" />;
      if (filterId === "date") icon = <i className="bi bi-calendar text-sm" />;
      if (filterId === "assignee") icon = <i className="bi bi-person-check text-sm" />;
      if (filterId === "recipient") icon = <i className="bi bi-send text-sm" />;
      chips.push({ label: v.label, value: v.value, filterId, icon });
    });
  });

  return (
    <>
      {/* Search Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-8 text-[15px] border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <i className="bi bi-x-lg text-sm" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <SettingsButton onClick={() => setSettingsOpen(true)} />
        </div>
      </div>

      {/* Filter Row */}
      <div>
        <RequestsFilterBar
          ref={filterBarRef}
          isFlaggedActive={flaggedActive}
          onFlaggedToggle={setFlaggedActive}
          isArchivedActive={archivedActive}
          onArchivedToggle={setArchivedActive}
          onActiveFiltersChange={setActiveFilters}
          onOpenFiltersSheet={() => setFiltersSheetOpen(true)}
          hideCampaignFilter={withinCampaign}
        />
      </div>

      {/* Active Filter Chips */}
      <div className="min-h-[24px]">
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {chips.map((chip, i) => (
              <Badge
                key={`${chip.filterId}-${chip.value}-${i}`}
                colorStyle="primary"
                theme="soft"
                shape="rounded"
                className="gap-1.5 pr-1.5 cursor-pointer transition-colors hover:bg-primary/30 text-[13px] normal-case tracking-normal font-normal"
                onClick={() => filterBarRef.current?.removeValue(chip.filterId, chip.value)}
              >
                {chip.icon}
                {chip.label}
                <i className="bi bi-x text-sm ml-0.5" />
              </Badge>
            ))}
            <button
              onClick={() => filterBarRef.current?.clearAll()}
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="min-h-[400px]">
        <RequestsTable
          requests={requests}
          searchQuery={searchQuery}
          perPage={perPage}
          columnVisibility={withinCampaign ? { ...columnVisibility, campaign: false } : columnVisibility}
        />
      </div>

      <RequestsSettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        perPage={perPage}
        onPerPageChange={setPerPage}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        filterVisibility={filterVisibility}
        onFilterVisibilityChange={setFilterVisibility}
      />

      {/* FiltersSheet (mobile/narrow widths) */}
      <FiltersSheet
        open={filtersSheetOpen}
        onOpenChange={setFiltersSheetOpen}
        value={{ flagged: flaggedActive, archived: archivedActive }}
        onApply={(draft) => {
          setFlaggedActive(draft.flagged as boolean);
          setArchivedActive(draft.archived as boolean);
        }}
        title="Request Filters"
      >
        <FilterSection label="Creator" icon="bi-person">
          <div className="space-y-2">
            {getUniqueRequestCreators().map((creator) => (
              <label key={creator.id} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={activeFilters.creator?.some((f) => f.value === creator.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setActiveFilters((prev) => ({
                        ...prev,
                        creator: [...(prev.creator || []), { value: creator.id, label: creator.name }],
                      }));
                    } else {
                      setActiveFilters((prev) => ({
                        ...prev,
                        creator: (prev.creator || []).filter((f) => f.value !== creator.id),
                      }));
                    }
                  }}
                />
                <span className="text-sm">{creator.name}</span>
              </label>
            ))}
          </div>
        </FilterSection>
        <FilterSection label="Flagged" icon="bi-flag">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={flaggedActive} onCheckedChange={(checked) => setFlaggedActive(checked as boolean)} />
            <span className="text-sm">Show only flagged requests</span>
          </label>
        </FilterSection>
        <FilterSection label="Archived" icon="bi-archive">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={archivedActive} onCheckedChange={(checked) => setArchivedActive(checked as boolean)} />
            <span className="text-sm">Show only archived requests</span>
          </label>
        </FilterSection>
      </FiltersSheet>
    </>
  );
}
