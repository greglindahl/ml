import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminScreenProps {
  isMobile?: boolean;
}

export function AdminScreen({ isMobile = false }: AdminScreenProps) {
  return (
    <div className={`flex-1 flex flex-col pb-12 ${isMobile ? "pt-[58px]" : "pt-20"}`}>
      {/* Header */}
      <div className="px-4 md:px-8 xl:px-16 py-4">
        <h1 className="text-[26px] font-semibold text-foreground">Admin</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="groups" className="flex-1 flex flex-col px-4 md:px-8 xl:px-16">
        <div className="border-b">
          <TabsList className="bg-transparent h-auto p-0 gap-6">
            <TabsTrigger
              value="groups"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Groups
            </TabsTrigger>
            <TabsTrigger
              value="invite-codes"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Invite Codes
            </TabsTrigger>
            <TabsTrigger
              value="manage-users"
              className="bg-transparent px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Manage Users
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="groups" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Groups content placeholder</p>
          </div>
        </TabsContent>

        <TabsContent value="invite-codes" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Invite Codes content placeholder</p>
          </div>
        </TabsContent>

        <TabsContent value="manage-users" className="flex-1 py-6 mt-0">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            <p>Manage Users content placeholder</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
