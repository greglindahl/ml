import { useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SectionTabs } from "@/components/SectionTabs";
import { useScreenSlug, validTab } from "@/hooks/useScreenSlug";
import { toast } from "@/hooks/use-toast";
import { useListControls } from "./ListToolbar";
import { DateRangeSelect, downloadCsv, useInsightsRange } from "./InsightsShared";
import { InsightsActivity } from "./InsightsActivity";
import { InsightsOverview } from "./InsightsOverview";
import { InsightsUsers, USERS_COLUMN_SETTINGS, USERS_FILTER_SETTINGS, usersCsvRows } from "./InsightsUsers";
import { InitiatedSharesTab, VerifiedSharesTab } from "./InsightsShares";
import { formatRange, getOverview, mockSocialShares, type InsightsRange } from "@/lib/mockInsightsData";

// Prod order: Activity first, and /insights lands on it.
const STATS_TABS = [
  { value: "activity", label: "Activity" },
  { value: "overview", label: "Overview" },
  { value: "users", label: "Users" },
  { value: "social-shares", label: "Social Shares" },
] as const;

type StatsTab = (typeof STATS_TABS)[number]["value"];

const SUB_TAB_CLASS =
  "flex flex-col justify-center items-center py-2 px-3 text-sm font-normal rounded-md border border-transparent text-[#6E84A3] data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent";

function overviewCsvRows(range: InsightsRange): (string | number)[][] {
  const d = getOverview(range);
  const row = (section: string, label: string, v: { current: number; previous: number }) => [section, label, v.current, v.previous];
  return [
    ["Section", "Metric", "Current Period", "Previous Period"],
    ["User Summary", "Total Users", d.totalUsers, ""],
    ["User Summary", "New Users", d.newUsers, ""],
    ...d.downloads.map((s) => row("Total Downloads", s.label, s.value)),
    ...d.contentAdded.map((s) => row("Total Content Added", s.label, s.value)),
    ...d.shares.map((s) => row("Shares", s.label, s.value)),
    ...d.galleryDownloads.map((s) => row("Gallery Asset Downloads", s.label, s.value)),
    ...d.galleryTiles.map((t) => row("Galleries", t.label, t.value)),
    ...d.shareRequests.map((t) => row("Share Requests", t.label, t.value)),
    ...d.contentRequests.map((t) => row("Content Requests", t.label, t.value)),
  ];
}

/** Date range + the range it resolves to, printed under the control as in prod. */
function ReportsToolbar({ range, onRangeChange }: { range: InsightsRange; onRangeChange: (r: InsightsRange) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DateRangeSelect value={range} onChange={onRangeChange} />
      <span className="text-[13px] text-muted-foreground">{formatRange(range)}</span>
    </div>
  );
}

interface StatsScreenProps {
  isMobile?: boolean;
  /** Tab to open on mount (e.g. "activity" when deep-linked from Home). Defaults to "activity". */
  initialTab?: string;
}

export function StatsScreen({ isMobile = false, initialTab }: StatsScreenProps) {
  const [activeTab, setActiveTab] = useState<StatsTab>(validTab(initialTab, STATS_TABS.map((t) => t.value)) ?? "activity");
  useScreenSlug("stats", activeTab);

  // Overview and Users share one date range (prod's reports layout), remembered across visits.
  const [range, setRange] = useInsightsRange();
  // Lifted so Export as CSV can honor the Users table's filters and visible column groups.
  const usersControls = useListControls("insights.users", { columns: USERS_COLUMN_SETTINGS, filters: USERS_FILTER_SETTINGS });
  const [shares, setShares] = useState(mockSocialShares);
  const [sharesTab, setSharesTab] = useState<"verified-shares" | "initiated-shares">("verified-shares");

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (activeTab === "overview") {
      downloadCsv(`insights-overview-${range}-${stamp}.csv`, overviewCsvRows(range));
      toast({ title: "Overview exported" });
    } else if (activeTab === "users") {
      downloadCsv(`insights-users-${range}-${stamp}.csv`, usersCsvRows(range, usersControls));
      toast({ title: "Users exported" });
    } else {
      // Prod generates share exports in the background and emails them.
      toast({ title: "Export started", description: "We’ll send you an email with the CSV when it’s ready." });
    }
  };

  return (
    <div className={`flex-1 flex flex-col pb-12 content-container ${isMobile ? "pt-[72px]" : ""}`}>
      {/* Spacer for consistent header position - matches LibraryScreen */}
      {!isMobile && <div className="mb-2 h-[44px] flex-shrink-0" />}
      {/* Header */}
      <div className="px-6 md:px-9 pb-4 flex items-center justify-between gap-3 min-h-[56px]">
        {/* min-h = 40px CTA + pb-4, so tabs without a CTA don't shift the title. */}
        <h1 className="text-[26px] font-semibold text-foreground">Insights</h1>
        {activeTab !== "activity" && (
          <Button variant="outline" onClick={exportCsv} aria-label="Export as CSV">
            <i className="bi bi-download text-base" />
            <span className="max-sm:hidden">Export as CSV</span>
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StatsTab)} className="flex flex-col px-6 md:px-9">
        <SectionTabs tabs={[...STATS_TABS]} value={activeTab} onValueChange={(v) => setActiveTab(v as StatsTab)} isMobile={isMobile} />

        <TabsContent value="activity" className="py-6 mt-0 flex flex-col gap-4 data-[state=inactive]:hidden">
          <InsightsActivity />
        </TabsContent>

        <TabsContent value="overview" className="py-6 mt-0 flex flex-col gap-4 data-[state=inactive]:hidden">
          <ReportsToolbar range={range} onRangeChange={setRange} />
          <InsightsOverview range={range} />
        </TabsContent>

        <TabsContent value="users" className="py-6 mt-0 flex flex-col gap-4 data-[state=inactive]:hidden">
          <ReportsToolbar range={range} onRangeChange={setRange} />
          <InsightsUsers range={range} controls={usersControls} />
        </TabsContent>

        <TabsContent value="social-shares" className="py-6 mt-0 data-[state=inactive]:hidden">
          <Tabs value={sharesTab} onValueChange={(v) => setSharesTab(v as typeof sharesTab)} className="flex flex-col">
            <TabsList className="flex items-center justify-start gap-3 bg-transparent p-0 h-auto">
              <TabsTrigger value="verified-shares" className={SUB_TAB_CLASS}>Verified Shares</TabsTrigger>
              <TabsTrigger value="initiated-shares" className={SUB_TAB_CLASS}>Initiated Shares</TabsTrigger>
            </TabsList>

            <TabsContent value="verified-shares" className="mt-4 flex flex-col gap-4 data-[state=inactive]:hidden">
              <VerifiedSharesTab shares={shares} />
            </TabsContent>
            <TabsContent value="initiated-shares" className="mt-4 flex flex-col gap-4 data-[state=inactive]:hidden">
              <InitiatedSharesTab shares={shares} onChange={setShares} />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
