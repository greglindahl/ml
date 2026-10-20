import { useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SectionTabs } from "@/components/SectionTabs";
import { RequestsListPanel } from "./RequestsListPanel";
import { formatCampaignDate, mockRequests, type Campaign, type CampaignUser } from "@/lib/mockCampaignData";

/**
 * A campaign's own page (prod: requests/campaigns/view/:id). Requests tab first
 * and default: the ML 2.0 Requests list scoped to this campaign, minus the
 * Campaign filter. Details tab: timeframe, info, participants, attachments.
 */

type CampaignTab = "requests" | "details";

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border rounded-lg bg-white flex flex-col min-w-0" aria-label={title}>
      <header className="px-6 py-4 border-b">
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
      </header>
      <div className="px-6 py-4 flex-1">{children}</div>
    </section>
  );
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mt-1">{children}</p>
);

function PeopleList({ label, people }: { label: string; people: CampaignUser[] }) {
  return (
    <div className="py-3 first:pt-0">
      <FieldLabel>{label}</FieldLabel>
      <p className="text-[14px] text-foreground mt-2">{people.length > 0 ? people.map((p) => p.name).join(", ") : "--"}</p>
    </div>
  );
}

export function CampaignDetailView({
  campaign,
  isMobile = false,
  onBack,
}: {
  campaign: Campaign;
  isMobile?: boolean;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<CampaignTab>("requests");
  const requests = mockRequests.filter((r) => r.campaignId === campaign.id);

  return (
    <div className={`flex-1 flex flex-col pb-12 content-container ${isMobile ? "pt-[72px]" : ""}`}>
      {/* Breadcrumb in the header spacer, same spot as Library's */}
      {!isMobile ? (
        <nav className="mb-2 h-[44px] flex-shrink-0 flex items-end px-6 md:px-9 text-[13px]" aria-label="Breadcrumb">
          <button type="button" onClick={onBack} className="text-primary hover:underline">
            Campaigns
          </button>
          <i className="bi bi-chevron-right text-[10px] text-muted-foreground mx-2" aria-hidden="true" />
          <span className="text-muted-foreground truncate">{campaign.name}</span>
        </nav>
      ) : (
        <button type="button" onClick={onBack} className="px-6 pb-2 text-[13px] text-primary text-left">
          <i className="bi bi-chevron-left mr-1" aria-hidden="true" />
          Campaigns
        </button>
      )}

      {/* Header */}
      <div className="px-6 md:px-9 pb-4 flex items-center justify-between gap-3 min-h-[56px]">
        <h1 className="text-[26px] font-semibold text-foreground truncate">{campaign.name}</h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button onClick={() => {}}>
            <i className="bi bi-plus-circle text-base" />
            New Request
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10" aria-label="Campaign actions">
                <i className="bi bi-three-dots-vertical" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {}}>
                <i className="bi bi-pencil-square w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" /> Edit Campaign
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CampaignTab)} className="flex flex-col px-6 md:px-9">
        <SectionTabs
          tabs={[
            { value: "requests", label: "Requests" },
            { value: "details", label: "Details" },
          ]}
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as CampaignTab)}
          isMobile={isMobile}
        />

        <TabsContent value="requests" className="py-6 flex flex-col gap-4 data-[state=inactive]:hidden">
          <RequestsListPanel requests={requests} withinCampaign />
        </TabsContent>

        <TabsContent value="details" className="py-6 flex flex-col gap-6 data-[state=inactive]:hidden">
          <section className="border rounded-lg bg-white px-6 py-5" aria-label="Timeframe">
            <FieldLabel>Timeframe</FieldLabel>
            <p className="text-[14px] text-foreground mt-2">
              {formatCampaignDate(campaign.createdDate)} – {formatCampaignDate(campaign.statusDate)}
            </p>
          </section>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <DetailCard title="Info">
              <div className="divide-y">
                <div className="pb-3">
                  <p className="text-[14px] text-foreground">{campaign.creator.name}</p>
                  <FieldLabel>Creator</FieldLabel>
                </div>
                <div className="py-3">
                  <p className="text-[14px] text-foreground">{formatCampaignDate(campaign.createdDate)}</p>
                  <FieldLabel>Created Date</FieldLabel>
                </div>
                <div className="pt-3">
                  <p className="text-[14px] text-foreground">{formatCampaignDate(campaign.lastModifiedDate ?? campaign.createdDate)}</p>
                  <FieldLabel>Last Modified</FieldLabel>
                </div>
              </div>
            </DetailCard>

            <DetailCard title="Participants">
              <PeopleList label="Recipients" people={campaign.recipients} />
              <PeopleList label="Collaborators" people={campaign.assignees} />
            </DetailCard>

            <DetailCard title="Attachments">
              <div className="flex justify-center pt-2">
                <button type="button" className="inline-flex items-center gap-1.5 text-[14px] text-primary hover:underline">
                  <i className="bi bi-file-earmark-plus" aria-hidden="true" />
                  Add Attachment
                </button>
              </div>
            </DetailCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
