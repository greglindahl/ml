import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EngageScreenProps {
  isMobile?: boolean;
}

export function EngageScreen({ isMobile = false }: EngageScreenProps) {
  return (
    <div className={`flex-1 flex flex-col pb-12 ${isMobile ? "pt-[58px]" : "pt-20"}`}>
      {/* Header */}
      <div className="px-4 md:px-8 xl:px-16 py-4">
        <h1 className="text-[26px] font-semibold text-foreground">Engage</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="campaigns" className="flex-1 flex flex-col px-4 md:px-8 xl:px-16">
        <div className="border-b">
          <TabsList className="bg-transparent h-auto p-0 gap-6">
            <TabsTrigger
              value="campaigns"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Campaigns
            </TabsTrigger>
            <TabsTrigger
              value="themes"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Themes
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="campaigns" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Campaigns content placeholder</p>
          </div>
        </TabsContent>

        <TabsContent value="themes" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Themes content placeholder</p>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Settings content placeholder</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
