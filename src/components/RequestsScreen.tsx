import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignsFilterBar } from "./CampaignsFilterBar";
import { CampaignsTable } from "./CampaignsTable";
import { mockCampaigns } from "@/lib/mockCampaignData";

interface RequestsScreenProps {
  isMobile?: boolean;
}

export function RequestsScreen({ isMobile = false }: RequestsScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className={`flex-1 flex flex-col pb-12 ${isMobile ? "pt-[58px]" : "pt-20"}`}>
      {/* Header */}
      <div className="px-4 md:px-8 xl:px-16 py-4">
        <h1 className="text-[26px] font-semibold text-foreground">Requests</h1>
      </div>

      {/* Primary Tabs */}
      <Tabs defaultValue="campaigns" className="flex-1 flex flex-col px-4 md:px-8 xl:px-16">
        <div className="border-b">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="campaigns" className="flex-1 py-6 mt-0 flex flex-col gap-6">
          <CampaignsFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <CampaignsTable
            campaigns={mockCampaigns}
            searchQuery={searchQuery}
          />
        </TabsContent>

        <TabsContent value="requests" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Requests content placeholder</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
