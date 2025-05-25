import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  iconColor?: string;
  iconBgColor?: string;
}

export default function StatCard({ 
  icon, 
  title, 
  value,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10"
}: StatCardProps) {
  return (
    <Card>
      <div className="p-6 flex items-center">
        <div className={`rounded-full ${iconBgColor} p-3 mr-4`}>
          <div className={`text-xl ${iconColor}`}>{icon}</div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </div>
    </Card>
  );
}
