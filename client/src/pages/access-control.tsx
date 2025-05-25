import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RfidScanner from "@/components/access/RfidScanner";
import AccessList from "@/components/access/AccessList";
import { LuDoorOpen, LuList, LuScan } from "react-icons/lu";

export default function AccessControl() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center">
          <LuDoorOpen className="mr-2" /> Control de Acceso
        </h1>
      </div>

      <Tabs defaultValue="scanner">
        <TabsList>
          <TabsTrigger value="scanner" className="flex items-center">
            <LuScan className="mr-2 h-4 w-4" />
            Escáner RFID
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center">
            <LuList className="mr-2 h-4 w-4" />
            Registro de Accesos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RfidScanner />
            <AccessList compact={true} />
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LuList className="mr-2" /> Registro completo de accesos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AccessList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
