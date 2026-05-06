import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StatsScreenProps {
  isMobile?: boolean;
}

export function StatsScreen({ isMobile = false }: StatsScreenProps) {
  return (
    <div className={`flex-1 flex flex-col pb-12 ${isMobile ? "pt-[58px]" : "pt-20"}`}>
      {/* Header */}
      <div className="px-4 md:px-8 xl:px-16 py-4">
        <h1 className="text-[26px] font-semibold text-foreground">Insights</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col px-4 md:px-8 xl:px-16">
        <div className="border-b">
          <TabsList className="bg-transparent h-auto p-0 gap-6">
            <TabsTrigger
              value="overview"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="social-shares"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Social Shares
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="share-requests"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Share Requests
            </TabsTrigger>
            <TabsTrigger
              value="gallery-downloads"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Gallery Downloads
            </TabsTrigger>
            <TabsTrigger
              value="user-stats"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              User Stats
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Overview content placeholder</p>
          </div>
        </TabsContent>

        <TabsContent value="social-shares" className="flex-1 py-6 mt-0">
          <Tabs defaultValue="verified-shares" className="flex-1 flex flex-col">
            <TabsList className="bg-muted/50 h-9 p-1 w-fit">
              <TabsTrigger
                value="verified-shares"
                className="text-sm px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Verified Shares
              </TabsTrigger>
              <TabsTrigger
                value="initiated-shares"
                className="text-sm px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"
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

        <TabsContent value="activity" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Activity content placeholder</p>
          </div>
        </TabsContent>

        <TabsContent value="share-requests" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Share Requests content placeholder</p>
          </div>
        </TabsContent>

        <TabsContent value="gallery-downloads" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Gallery Downloads content placeholder</p>
          </div>
        </TabsContent>

        <TabsContent value="user-stats" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>User Stats content placeholder</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
