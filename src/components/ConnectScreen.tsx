import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SectionTabs } from "@/components/SectionTabs";

const CONNECT_TABS = [
  { value: "imports", label: "Imports" },
  { value: "exports", label: "Exports" },
  { value: "routing-rules", label: "Routing Rules" },
  { value: "integrations", label: "Integrations" },
];

interface ConnectScreenProps {
  isMobile?: boolean;
}

export function ConnectScreen({ isMobile = false }: ConnectScreenProps) {
  const [activeTab, setActiveTab] = useState("imports");

  return (
    <div className={`flex-1 flex flex-col pb-12 ${isMobile ? "pt-[72px]" : ""}`}>
      {/* Spacer for consistent header position - matches LibraryScreen */}
      {!isMobile && <div className="mb-2 h-[44px] flex-shrink-0" />}
      {/* Header */}
      <div className="px-6 md:px-9 flex items-center min-h-10 mb-6">
        <h1 className="text-[26px] font-semibold text-foreground">Connect</h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col px-6 md:px-9">
        <SectionTabs tabs={CONNECT_TABS} value={activeTab} onValueChange={setActiveTab} isMobile={isMobile} />

        <TabsContent value="imports" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Imports content placeholder</p>
          </div>
        </TabsContent>

        <TabsContent value="exports" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Exports content placeholder</p>
          </div>
        </TabsContent>

        <TabsContent value="routing-rules" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Routing Rules content placeholder</p>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Integrations content placeholder</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
