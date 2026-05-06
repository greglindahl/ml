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
          <TabsList>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="invite-codes">Invite Codes</TabsTrigger>
            <TabsTrigger value="manage-users">Manage Users</TabsTrigger>
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
