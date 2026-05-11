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
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="social-shares">Social Shares</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Overview content placeholder</p>
          </div>
        </TabsContent>

        <TabsContent value="users" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Users content placeholder</p>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Activity content placeholder</p>
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
