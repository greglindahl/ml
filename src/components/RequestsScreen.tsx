import { useState, useRef } from "react";
import { SettingsButton } from "@/components/ListFilters";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SectionTabs } from "@/components/SectionTabs";
import { useScreenSlug, validTab } from "@/hooks/useScreenSlug";
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
import { RequestsListPanel } from "./RequestsListPanel";
import { CampaignDetailView } from "./CampaignDetailView";
import {
  CampaignsSettingsDrawer,
  useCampaignsPerPage,
  useCampaignsColumnVisibility,
  useCampaignsFilterVisibility,
} from "./CampaignsSettingsDrawer";
import { FiltersSheet, FilterSection } from "./FiltersSheet";
import { mockCampaigns, mockRequests, getUniqueCampaignCreators } from "@/lib/mockCampaignData";

interface FilterValue {
  value: string;
  label: string;
}

interface RequestsScreenProps {
  isMobile?: boolean;
  /** ?screen=requests&tab=... deep link */
  initialTab?: string;
}

export function RequestsScreen({ isMobile = false, initialTab }: RequestsScreenProps) {
  // Active tab — controlled so the header CTA can swap its label
  const [activeTab, setActiveTab] = useState<"campaigns" | "requests">(validTab(initialTab, ["requests", "campaigns"] as const) ?? "requests");
  useScreenSlug("requests", activeTab);

  // A campaign's own page. The list stays mounted (hidden) underneath, so going
  // back keeps its search and filters: same place, different view.
  const [openCampaignId, setOpenCampaignId] = useState<string | null>(null);
  const openCampaign = mockCampaigns.find((c) => c.id === openCampaignId) ?? null;

  // Search state
  const [campaignsSearchQuery, setCampaignsSearchQuery] = useState("");

  // Settings drawer state
  const [campaignsSettingsOpen, setCampaignsSettingsOpen] = useState(false);

  // Campaigns settings hooks
  const [campaignsPerPage, setCampaignsPerPage] = useCampaignsPerPage(40);
  const [campaignsColumnVisibility, setCampaignsColumnVisibility] = useCampaignsColumnVisibility();
  const [campaignsFilterVisibility, setCampaignsFilterVisibility] = useCampaignsFilterVisibility();

  // Active filters state
  const [campaignsActiveFilters, setCampaignsActiveFilters] = useState<Record<string, FilterValue[]>>({});

  // Toggle pill states
  const [campaignsArchivedActive, setCampaignsArchivedActive] = useState(false);

  // FiltersSheet state (for narrow widths)
  const [campaignsFiltersSheetOpen, setCampaignsFiltersSheetOpen] = useState(false);

  // Refs for filter bars
  const campaignsFilterBarRef = useRef<CampaignsFilterBarHandle>(null);

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


  const handleRemoveCampaignsChip = (chip: typeof campaignsChips[0]) => {
    campaignsFilterBarRef.current?.removeValue(chip.filterId, chip.value);
  };

  const handleClearAllCampaignsChips = () => {
    campaignsFilterBarRef.current?.clearAll();
  };


  return (
    <>
    {openCampaign && (
      <CampaignDetailView key={openCampaign.id} campaign={openCampaign} isMobile={isMobile} onBack={() => setOpenCampaignId(null)} />
    )}
    <div className={`flex-1 flex flex-col pb-12 content-container ${isMobile ? "pt-[72px]" : ""} ${openCampaign ? "hidden" : ""}`}>
      {/* Spacer for consistent header position - matches LibraryScreen */}
      {!isMobile && <div className="mb-2 h-[44px] flex-shrink-0" />}
      {/* Header */}
      <div className="px-6 md:px-9 pb-4 flex items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold text-foreground">Requests</h1>
        <Button onClick={() => {}}>
          <i className="bi bi-plus-circle text-base" />
          {activeTab === "campaigns" ? "New Campaign" : "New Request"}
        </Button>
      </div>

      {/* Primary Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "campaigns" | "requests")} className="flex flex-col px-6 md:px-9">
        <SectionTabs
          tabs={[
            { value: "requests", label: "Requests" },
            { value: "campaigns", label: "Campaigns" },
          ]}
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "campaigns" | "requests")}
          isMobile={isMobile}
        />

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
              <SettingsButton onClick={() => setCampaignsSettingsOpen(true)} />
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
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="min-h-[400px]">
            <CampaignsTable
              campaigns={mockCampaigns}
              onOpenCampaign={setOpenCampaignId}
              searchQuery={campaignsSearchQuery}
              perPage={campaignsPerPage}
              columnVisibility={campaignsColumnVisibility}
            />
          </div>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="py-6 flex flex-col gap-4 data-[state=inactive]:hidden">
          <RequestsListPanel requests={mockRequests} />
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
    </div>
    </>
  );
}
