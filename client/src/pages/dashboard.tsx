import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from "@/components/dashboard/StatCard";
import RecentMembers from "@/components/dashboard/RecentMembers";
import FeaturedProducts from "@/components/dashboard/FeaturedProducts";
import RecentDispensary from "@/components/dashboard/RecentDispensary";
import RecentAccesses from "@/components/dashboard/RecentAccesses";
import { LuUsers, LuSprout, LuShoppingCart, LuDoorOpen } from "react-icons/lu";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <div className="space-y-6">
      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Socios"
          value={stats?.totalMembers || 0}
          icon={<LuUsers className="text-xl" />}
          iconBgColor="bg-primary-50 dark:bg-primary-900/30"
          iconTextColor="text-primary-500 dark:text-primary-400"
          loading={isLoading}
        />
        <StatCard
          title="Productos Activos"
          value={stats?.activeProducts || 0}
          icon={<LuSprout className="text-xl" />}
          iconBgColor="bg-secondary-50 dark:bg-secondary-900/30"
          iconTextColor="text-secondary-500 dark:text-secondary-400"
          loading={isLoading}
        />
        <StatCard
          title="Dispensas Hoy"
          value={stats?.todayDispensary || 0}
          icon={<LuShoppingCart className="text-xl" />}
          iconBgColor="bg-blue-50 dark:bg-blue-900/30"
          iconTextColor="text-blue-500 dark:text-blue-400"
          loading={isLoading}
        />
        <StatCard
          title="Visitas Hoy"
          value={stats?.todayVisits || 0}
          icon={<LuDoorOpen className="text-xl" />}
          iconBgColor="bg-amber-50 dark:bg-amber-900/30"
          iconTextColor="text-amber-500 dark:text-amber-400"
          loading={isLoading}
        />
      </div>

      {/* Tabs for main content */}
      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="socios">Últimos Socios</TabsTrigger>
          <TabsTrigger value="productos">Productos Destacados</TabsTrigger>
          <TabsTrigger value="actividad">Actividad Reciente</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-6">
          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent members panel */}
            <RecentMembers />

            {/* Featured products */}
            <div className="lg:col-span-2">
              <FeaturedProducts />
            </div>
          </div>

          {/* Recent activity and dispensary activity */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recent dispensary sales */}
            <div className="lg:col-span-7">
              <RecentDispensary />
            </div>

            {/* Recent access activity */}
            <div className="lg:col-span-5">
              <RecentAccesses />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="socios" className="mt-6">
          <Card className="p-6">
            <RecentMembers />
          </Card>
        </TabsContent>

        <TabsContent value="productos" className="mt-6">
          <Card className="p-6">
            <FeaturedProducts />
          </Card>
        </TabsContent>

        <TabsContent value="actividad" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecentDispensary />
            <RecentAccesses />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
