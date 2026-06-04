import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EngageScreenProps {
  isMobile?: boolean;
}

export function EngageScreen({ isMobile = false }: EngageScreenProps) {
  return (
    <div className={`flex-1 flex flex-col pb-12 ${isMobile ? "pt-[58px]" : ""}`}>
      {/* Spacer for consistent header position - matches LibraryScreen */}
      {!isMobile && <div className="mb-2 h-[44px] flex-shrink-0" />}
      {/* Header */}
      <div className="px-6 md:px-9 flex items-center min-h-10 mb-6">
        <h1 className="text-[26px] font-semibold text-foreground">Engage</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="campaigns" className="flex-1 flex flex-col px-6 md:px-9">
        <div className="border-b">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="themes">Themes</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
