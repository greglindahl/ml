import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignsFilterBar } from "./CampaignsFilterBar";
import { CampaignsTable } from "./CampaignsTable";
import { RequestsFilterBar } from "./RequestsFilterBar";
import { RequestsTable } from "./RequestsTable";
import { mockCampaigns, mockRequests } from "@/lib/mockCampaignData";

interface RequestsScreenProps {
  isMobile?: boolean;
}

export function RequestsScreen({ isMobile = false }: RequestsScreenProps) {
  const [campaignsSearchQuery, setCampaignsSearchQuery] = useState("");
  const [requestsSearchQuery, setRequestsSearchQuery] = useState("");

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
            searchQuery={campaignsSearchQuery}
            onSearchChange={setCampaignsSearchQuery}
          />
          <CampaignsTable
            campaigns={mockCampaigns}
            searchQuery={campaignsSearchQuery}
          />
        </TabsContent>

        <TabsContent value="requests" className="flex-1 py-6 mt-0 flex flex-col gap-6">
          <RequestsFilterBar
            searchQuery={requestsSearchQuery}
            onSearchChange={setRequestsSearchQuery}
          />
          <RequestsTable
            requests={mockRequests}
            searchQuery={requestsSearchQuery}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
