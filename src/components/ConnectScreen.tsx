import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ConnectScreenProps {
  isMobile?: boolean;
}

export function ConnectScreen({ isMobile = false }: ConnectScreenProps) {
  return (
    <div className={`flex-1 flex flex-col pb-12 ${isMobile ? "pt-[58px]" : "pt-20"}`}>
      {/* Header */}
      <div className="px-4 md:px-8 xl:px-16 py-4">
        <h1 className="text-[26px] font-semibold text-foreground">Connect</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="imports" className="flex-1 flex flex-col px-4 md:px-8 xl:px-16">
        <div className="border-b">
          <TabsList className="bg-transparent h-auto p-0 gap-6">
            <TabsTrigger
              value="imports"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Imports
            </TabsTrigger>
            <TabsTrigger
              value="exports"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Exports
            </TabsTrigger>
            <TabsTrigger
              value="routing-rules"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Routing Rules
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Integrations
            </TabsTrigger>
          </TabsList>
        </div>

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
