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
import { CampaignsFilterBar, CampaignsFilterBarHandle } from "./CampaignsFilterBar";
import { CampaignsTable } from "./CampaignsTable";
import { RequestsFilterBar, RequestsFilterBarHandle } from "./RequestsFilterBar";
import { RequestsTable } from "./RequestsTable";
import {
  CampaignsSettingsDrawer,
  useCampaignsPerPage,
  useCampaignsColumnVisibility,
  useCampaignsFilterVisibility,
} from "./CampaignsSettingsDrawer";
import {
  RequestsSettingsDrawer,
  useRequestsPerPage,
  useRequestsColumnVisibility,
  useRequestsFilterVisibility,
} from "./RequestsSettingsDrawer";
import { FiltersSheet, FilterSection } from "./FiltersSheet";
import { mockCampaigns, mockRequests, getUniqueCampaignCreators, getUniqueRequestCreators } from "@/lib/mockCampaignData";

interface FilterValue {
  value: string;
  label: string;
}

interface RequestsScreenProps {
  isMobile?: boolean;
}

export function RequestsScreen({ isMobile = false }: RequestsScreenProps) {
  // Active tab — controlled so the header CTA can swap its label
  const [activeTab, setActiveTab] = useState<"campaigns" | "requests">("campaigns");

  // Search state
  const [campaignsSearchQuery, setCampaignsSearchQuery] = useState("");
  const [requestsSearchQuery, setRequestsSearchQuery] = useState("");

  // Settings drawer state
  const [campaignsSettingsOpen, setCampaignsSettingsOpen] = useState(false);
  const [requestsSettingsOpen, setRequestsSettingsOpen] = useState(false);

  // Campaigns settings hooks
  const [campaignsPerPage, setCampaignsPerPage] = useCampaignsPerPage(40);
  const [campaignsColumnVisibility, setCampaignsColumnVisibility] = useCampaignsColumnVisibility();
  const [campaignsFilterVisibility, setCampaignsFilterVisibility] = useCampaignsFilterVisibility();

  // Requests settings hooks
  const [requestsPerPage, setRequestsPerPage] = useRequestsPerPage(40);
  const [requestsColumnVisibility, setRequestsColumnVisibility] = useRequestsColumnVisibility();
  const [requestsFilterVisibility, setRequestsFilterVisibility] = useRequestsFilterVisibility();

  // Active filters state
  const [campaignsActiveFilters, setCampaignsActiveFilters] = useState<Record<string, FilterValue[]>>({});
  const [requestsActiveFilters, setRequestsActiveFilters] = useState<Record<string, FilterValue[]>>({});

  // Toggle pill states
  const [campaignsArchivedActive, setCampaignsArchivedActive] = useState(false);
  const [requestsFlaggedActive, setRequestsFlaggedActive] = useState(false);
  const [requestsArchivedActive, setRequestsArchivedActive] = useState(false);

  // FiltersSheet state (for narrow widths)
  const [campaignsFiltersSheetOpen, setCampaignsFiltersSheetOpen] = useState(false);
  const [requestsFiltersSheetOpen, setRequestsFiltersSheetOpen] = useState(false);

  // Refs for filter bars
  const campaignsFilterBarRef = useRef<CampaignsFilterBarHandle>(null);
  const requestsFilterBarRef = useRef<RequestsFilterBarHandle>(null);

  // Build chips for Campaigns tab
  const campaignsChips: { label: string; value: string; filterId: string; icon: React.ReactNode }[] = [];
  Object.entries(campaignsActiveFilters).forEach(([filterId, values]) => {
    values.forEach((v) => {
      let icon = <i className="bi bi-tag text-sm" />;
      if (filterId === "creator") icon = <i className="bi bi-person text-sm" />;
      if (filterId === "date") icon = <i className="bi bi-calendar text-sm" />;
      campaignsChips.push({ label: v.label, value: v.value, filterId, icon });
    });
  });

  // Build chips for Requests tab
  const requestsChips: { label: string; value: string; filterId: string; icon: React.ReactNode }[] = [];
  Object.entries(requestsActiveFilters).forEach(([filterId, values]) => {
    values.forEach((v) => {
      let icon = <i className="bi bi-tag text-sm" />;
      if (filterId === "campaign") icon = <i className="bi bi-layers text-sm" />;
      if (filterId === "requestType") icon = <i className="bi bi-card-checklist text-sm" />;
      if (filterId === "status") icon = <i className="bi bi-hourglass-split text-sm" />;
      if (filterId === "creator") icon = <i className="bi bi-person text-sm" />;
      if (filterId === "date") icon = <i className="bi bi-calendar text-sm" />;
      if (filterId === "assignee") icon = <i className="bi bi-person-check text-sm" />;
      if (filterId === "recipient") icon = <i className="bi bi-send text-sm" />;
      requestsChips.push({ label: v.label, value: v.value, filterId, icon });
    });
  });

  const handleRemoveCampaignsChip = (chip: typeof campaignsChips[0]) => {
    campaignsFilterBarRef.current?.removeValue(chip.filterId, chip.value);
  };

  const handleClearAllCampaignsChips = () => {
    campaignsFilterBarRef.current?.clearAll();
  };

  const handleRemoveRequestsChip = (chip: typeof requestsChips[0]) => {
    requestsFilterBarRef.current?.removeValue(chip.filterId, chip.value);
  };

  const handleClearAllRequestsChips = () => {
    requestsFilterBarRef.current?.clearAll();
  };

  return (
    <div className={`flex-1 flex flex-col pb-12 content-container ${isMobile ? "pt-[58px]" : ""}`}>
      {/* Spacer for consistent header position - matches LibraryScreen */}
      {!isMobile && <div className="mb-2 h-[44px] flex-shrink-0" />}
      {/* Header */}
      <div className="px-4 md:px-8 xl:px-16 pb-4 flex items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold text-foreground">Requests</h1>
        <Button onClick={() => {}}>
          <i className="bi bi-plus-circle text-base" />
          {activeTab === "campaigns" ? "New Campaign" : "New Request"}
        </Button>
      </div>

      {/* Primary Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "campaigns" | "requests")} className="flex flex-col px-4 md:px-8 xl:px-16">
        <div className="border-b">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
          </TabsList>
        </div>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="py-6 flex flex-col gap-4 data-[state=inactive]:hidden">
          {/* Search Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={campaignsSearchQuery}
                onChange={(e) => setCampaignsSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-8 text-[15px] border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {campaignsSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCampaignsSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <i className="bi bi-x-lg text-sm" />
                </button>
              )}
            </div>

            {/* Utility cluster - pushed right */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Settings Button */}
              <Tooltip delayDuration={700}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-md border-gray-300 bg-white text-[#6e84a3]"
                    onClick={() => setCampaignsSettingsOpen(true)}
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
            <CampaignsFilterBar
              ref={campaignsFilterBarRef}
              isArchivedActive={campaignsArchivedActive}
              onArchivedToggle={setCampaignsArchivedActive}
              onActiveFiltersChange={setCampaignsActiveFilters}
              onOpenFiltersSheet={() => setCampaignsFiltersSheetOpen(true)}
            />
          </div>

          {/* Active Filter Chips */}
          <div className="min-h-[24px]">
            {campaignsChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {campaignsChips.map((chip, i) => (
                  <Badge
                    key={`${chip.filterId}-${chip.value}-${i}`}
                    colorStyle="primary"
                    theme="soft"
                    shape="rounded"
                    className="gap-1.5 pr-1.5 cursor-pointer transition-colors hover:bg-primary/30 text-[13px] normal-case tracking-normal font-normal"
                    onClick={() => handleRemoveCampaignsChip(chip)}
                  >
                    {chip.icon}
                    {chip.label}
                    <i className="bi bi-x text-sm ml-0.5" />
                  </Badge>
                ))}
                <button
                  onClick={handleClearAllCampaignsChips}
                  className="text-[13px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="min-h-[400px]">
            <CampaignsTable
              campaigns={mockCampaigns}
              searchQuery={campaignsSearchQuery}
              perPage={campaignsPerPage}
              columnVisibility={campaignsColumnVisibility}
            />
          </div>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="py-6 flex flex-col gap-4 data-[state=inactive]:hidden">
          {/* Search Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={requestsSearchQuery}
                onChange={(e) => setRequestsSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-8 text-[15px] border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {requestsSearchQuery && (
                <button
                  type="button"
                  onClick={() => setRequestsSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <i className="bi bi-x-lg text-sm" />
                </button>
              )}
            </div>

            {/* Utility cluster - pushed right */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Settings Button */}
              <Tooltip delayDuration={700}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-md border-gray-300 bg-white text-[#6e84a3]"
                    onClick={() => setRequestsSettingsOpen(true)}
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
            <RequestsFilterBar
              ref={requestsFilterBarRef}
              isFlaggedActive={requestsFlaggedActive}
              onFlaggedToggle={setRequestsFlaggedActive}
              isArchivedActive={requestsArchivedActive}
              onArchivedToggle={setRequestsArchivedActive}
              onActiveFiltersChange={setRequestsActiveFilters}
              onOpenFiltersSheet={() => setRequestsFiltersSheetOpen(true)}
            />
          </div>

          {/* Active Filter Chips */}
          <div className="min-h-[24px]">
            {requestsChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {requestsChips.map((chip, i) => (
                  <Badge
                    key={`${chip.filterId}-${chip.value}-${i}`}
                    colorStyle="primary"
                    theme="soft"
                    shape="rounded"
                    className="gap-1.5 pr-1.5 cursor-pointer transition-colors hover:bg-primary/30 text-[13px] normal-case tracking-normal font-normal"
                    onClick={() => handleRemoveRequestsChip(chip)}
                  >
                    {chip.icon}
                    {chip.label}
                    <i className="bi bi-x text-sm ml-0.5" />
                  </Badge>
                ))}
                <button
                  onClick={handleClearAllRequestsChips}
                  className="text-[13px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="min-h-[400px]">
            <RequestsTable
              requests={mockRequests}
              searchQuery={requestsSearchQuery}
              perPage={requestsPerPage}
              columnVisibility={requestsColumnVisibility}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Settings Drawers */}
      <CampaignsSettingsDrawer
        open={campaignsSettingsOpen}
        onOpenChange={setCampaignsSettingsOpen}
        perPage={campaignsPerPage}
        onPerPageChange={setCampaignsPerPage}
        columnVisibility={campaignsColumnVisibility}
        onColumnVisibilityChange={setCampaignsColumnVisibility}
        filterVisibility={campaignsFilterVisibility}
        onFilterVisibilityChange={setCampaignsFilterVisibility}
      />
      <RequestsSettingsDrawer
        open={requestsSettingsOpen}
        onOpenChange={setRequestsSettingsOpen}
        perPage={requestsPerPage}
        onPerPageChange={setRequestsPerPage}
        columnVisibility={requestsColumnVisibility}
        onColumnVisibilityChange={setRequestsColumnVisibility}
        filterVisibility={requestsFilterVisibility}
        onFilterVisibilityChange={setRequestsFilterVisibility}
      />

      {/* FiltersSheet for Campaigns (mobile/narrow widths) */}
      <FiltersSheet
        open={campaignsFiltersSheetOpen}
        onOpenChange={setCampaignsFiltersSheetOpen}
        value={{ archived: campaignsArchivedActive }}
        onApply={(draft) => {
          setCampaignsArchivedActive(draft.archived as boolean);
        }}
        title="Campaign Filters"
      >
        <FilterSection label="Creator" icon="bi-person">
          <div className="space-y-2">
            {getUniqueCampaignCreators().map((creator) => (
              <label key={creator.id} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={campaignsActiveFilters.creator?.some(f => f.value === creator.id)}
                  onCheckedChange={(checked) => {
                    // This is a simplified version - in production you'd use draft state
                    if (checked) {
                      setCampaignsActiveFilters(prev => ({
                        ...prev,
                        creator: [...(prev.creator || []), { value: creator.id, label: creator.name }]
                      }));
                    } else {
                      setCampaignsActiveFilters(prev => ({
                        ...prev,
                        creator: (prev.creator || []).filter(f => f.value !== creator.id)
                      }));
                    }
                  }}
                />
                <span className="text-sm">{creator.name}</span>
              </label>
            ))}
          </div>
        </FilterSection>
        <FilterSection label="Archived" icon="bi-archive">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={campaignsArchivedActive}
              onCheckedChange={(checked) => setCampaignsArchivedActive(checked as boolean)}
            />
            <span className="text-sm">Show only archived campaigns</span>
          </label>
        </FilterSection>
      </FiltersSheet>

      {/* FiltersSheet for Requests (mobile/narrow widths) */}
      <FiltersSheet
        open={requestsFiltersSheetOpen}
        onOpenChange={setRequestsFiltersSheetOpen}
        value={{ flagged: requestsFlaggedActive, archived: requestsArchivedActive }}
        onApply={(draft) => {
          setRequestsFlaggedActive(draft.flagged as boolean);
          setRequestsArchivedActive(draft.archived as boolean);
        }}
        title="Request Filters"
      >
        <FilterSection label="Creator" icon="bi-person">
          <div className="space-y-2">
            {getUniqueRequestCreators().map((creator) => (
              <label key={creator.id} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={requestsActiveFilters.creator?.some(f => f.value === creator.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setRequestsActiveFilters(prev => ({
                        ...prev,
                        creator: [...(prev.creator || []), { value: creator.id, label: creator.name }]
                      }));
                    } else {
                      setRequestsActiveFilters(prev => ({
                        ...prev,
                        creator: (prev.creator || []).filter(f => f.value !== creator.id)
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
            <Checkbox
              checked={requestsFlaggedActive}
              onCheckedChange={(checked) => setRequestsFlaggedActive(checked as boolean)}
            />
            <span className="text-sm">Show only flagged requests</span>
          </label>
        </FilterSection>
        <FilterSection label="Archived" icon="bi-archive">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={requestsArchivedActive}
              onCheckedChange={(checked) => setRequestsArchivedActive(checked as boolean)}
            />
            <span className="text-sm">Show only archived requests</span>
          </label>
        </FilterSection>
      </FiltersSheet>
    </div>
  );
}
