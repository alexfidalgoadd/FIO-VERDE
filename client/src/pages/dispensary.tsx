import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DispensaryView from "@/components/dispensary/DispensaryView";
import { LuStore } from "react-icons/lu";

export default function Dispensary() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center">
          <LuStore className="mr-2" /> Dispensario
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dispensario de productos</CardTitle>
        </CardHeader>
        <CardContent>
          <DispensaryView />
        </CardContent>
      </Card>
    </div>
  );
}
