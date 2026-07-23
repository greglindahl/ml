import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionTabs } from "@/components/SectionTabs";

const STATS_TABS = [
  { value: "overview", label: "Overview" },
  { value: "activity", label: "Activity" },
  { value: "users", label: "Users" },
  { value: "social-shares", label: "Social Shares" },
];

interface StatsScreenProps {
  isMobile?: boolean;
  /** Tab to open on mount (e.g. "activity" when deep-linked from Home). Defaults to "overview". */
  initialTab?: string;
}

export function StatsScreen({ isMobile = false, initialTab }: StatsScreenProps) {
  const [activeTab, setActiveTab] = useState(initialTab ?? "overview");

  return (
    <div className={`flex-1 flex flex-col pb-12 ${isMobile ? "pt-[72px]" : ""}`}>
      {/* Spacer for consistent header position - matches LibraryScreen */}
      {!isMobile && <div className="mb-2 h-[44px] flex-shrink-0" />}
      {/* Header */}
      <div className="px-6 md:px-9 flex items-center min-h-10 mb-6">
        <h1 className="text-[26px] font-semibold text-foreground">Insights</h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col px-6 md:px-9">
        <SectionTabs tabs={STATS_TABS} value={activeTab} onValueChange={setActiveTab} isMobile={isMobile} />

        <TabsContent value="overview" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Overview content placeholder</p>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Activity content placeholder</p>
          </div>
        </TabsContent>

        <TabsContent value="users" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Users content placeholder</p>
          </div>
        </TabsContent>

        <TabsContent value="social-shares" className="flex-1 py-6 mt-0">
          <Tabs defaultValue="verified-shares" className="flex-1 flex flex-col">
            <TabsList className="flex items-center gap-3 bg-transparent p-0 h-auto">
              <TabsTrigger
                value="verified-shares"
                className="flex flex-col justify-center items-center py-2 px-3 text-sm font-normal rounded-md border border-transparent text-[#6E84A3] data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
              >
                Verified Shares
              </TabsTrigger>
              <TabsTrigger
                value="initiated-shares"
                className="flex flex-col justify-center items-center py-2 px-3 text-sm font-normal rounded-md border border-transparent text-[#6E84A3] data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
              >
                Initiated Shares
              </TabsTrigger>
            </TabsList>

            <TabsContent value="verified-shares" className="flex-1 mt-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
                <p>Verified Shares content placeholder</p>
              </div>
            </TabsContent>

            <TabsContent value="initiated-shares" className="flex-1 mt-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
                <p>Initiated Shares content placeholder</p>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
