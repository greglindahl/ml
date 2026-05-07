import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RequestsScreenProps {
  isMobile?: boolean;
}

export function RequestsScreen({ isMobile = false }: RequestsScreenProps) {
  return (
    <div className={`flex-1 flex flex-col pb-12 ${isMobile ? "pt-[58px]" : "pt-20"}`}>
      {/* Header */}
      <div className="px-4 md:px-8 xl:px-16 py-4">
        <h1 className="text-[26px] font-semibold text-foreground">Activations</h1>
      </div>

      {/* Primary Tabs */}
      <Tabs defaultValue="requests" className="flex-1 flex flex-col px-4 md:px-8 xl:px-16">
        <div className="border-b">
          <TabsList>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="workflows" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Workflows content placeholder</p>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="flex-1 py-6 mt-0">
          <Tabs defaultValue="requests-sub" className="flex-1 flex flex-col">
            <TabsList className="flex items-center gap-3 bg-transparent p-0 h-auto">
              <TabsTrigger
                value="campaigns"
                className="flex flex-col justify-center items-center py-2 px-3 text-sm font-normal rounded-md border border-transparent text-[#6E84A3] data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
              >
                Campaigns
              </TabsTrigger>
              <TabsTrigger
                value="requests-sub"
                className="flex flex-col justify-center items-center py-2 px-3 text-sm font-normal rounded-md border border-transparent text-[#6E84A3] data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
              >
                Requests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="flex-1 mt-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
                <p>Campaigns content placeholder</p>
              </div>
            </TabsContent>

            <TabsContent value="requests-sub" className="flex-1 mt-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
                <p>Requests content placeholder</p>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
