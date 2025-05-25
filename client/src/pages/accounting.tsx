import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AccountingView from "@/components/accounting/AccountingView";
import { LuCalculator } from "react-icons/lu";

export default function Accounting() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center">
          <LuCalculator className="mr-2" /> Contabilidad
        </h1>
      </div>

      <AccountingView />
    </div>
  );
}
