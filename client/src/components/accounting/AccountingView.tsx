import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { TransactionWithItems } from "@shared/schema";
import { LuCalendar, LuDollarSign, LuArrowUp, LuArrowDown, LuRefreshCw } from "react-icons/lu";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import TransactionHistory from "./TransactionHistory";

export function AccountingView() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<"day" | "week" | "month">("day");

  // Calculate date range for API query
  const getDateRange = () => {
    if (!date) return null;
    
    const startDate = new Date(date);
    const endDate = new Date(date);
    
    if (dateRange === "week") {
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week (Sunday)
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End of week (Saturday)
    } else if (dateRange === "month") {
      startDate.setDate(1); // Start of month
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // End of month
    }
    
    return { startDate, endDate };
  };

  // Get transactions
  const { data: transactions, isLoading, refetch } = useQuery<TransactionWithItems[]>({
    queryKey: ["/api/transactions"],
  });

  // Filter transactions based on selected date range
  const filterTransactions = () => {
    if (!transactions || !date) return [];
    
    const range = getDateRange();
    if (!range) return [];
    
    const { startDate, endDate } = range;
    
    return transactions.filter((tx) => {
      const txDate = new Date(tx.timestamp);
      return txDate >= startDate && txDate <= endDate;
    });
  };

  const filteredTransactions = filterTransactions();

  // Calculate total sales for the selected period
  const totalSales = filteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
  
  // Prepare data for category distribution chart
  const prepareCategoryData = () => {
    if (!filteredTransactions.length) return [];
    
    const categoryMap = new Map();
    
    filteredTransactions.forEach(tx => {
      tx.items.forEach(item => {
        const category = item.product.category;
        const amount = item.price * item.quantity * (1 - item.discount / 100);
        
        if (categoryMap.has(category)) {
          categoryMap.set(category, categoryMap.get(category) + amount);
        } else {
          categoryMap.set(category, amount);
        }
      });
    });
    
    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value
    }));
  };

  // Prepare data for daily sales chart
  const prepareDailySalesData = () => {
    if (!transactions) return [];
    
    const range = getDateRange();
    if (!range) return [];
    
    const { startDate, endDate } = range;
    const days = [];
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const daySales = transactions.filter(tx => 
        format(new Date(tx.timestamp), "yyyy-MM-dd") === dayStr
      );
      
      return {
        name: format(day, "dd/MM"),
        ventas: daySales.reduce((sum, tx) => sum + tx.total, 0)
      };
    });
  };

  const categoryData = prepareCategoryData();
  const dailySalesData = prepareDailySalesData();
  
  // Colors for pie chart
  const COLORS = ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold mb-1">Contabilidad</h2>
          <p className="text-neutral-500 dark:text-neutral-400">
            {dateRange === "day" && date
              ? `Datos para el ${format(date, "d 'de' MMMM 'de' yyyy", { locale: es })}`
              : dateRange === "week" && date
              ? `Datos para la semana del ${format(getDateRange()?.startDate || date, "d 'de' MMMM", { locale: es })} al ${format(getDateRange()?.endDate || date, "d 'de' MMMM 'de' yyyy", { locale: es })}`
              : dateRange === "month" && date
              ? `Datos para ${format(date, "MMMM 'de' yyyy", { locale: es })}`
              : "Selecciona un período"}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <LuRefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="day" value={dateRange} onValueChange={(v) => setDateRange(v as "day" | "week" | "month")}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="day">Día</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="month">Mes</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="rounded-md border">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-md border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center">
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2 mr-3">
                    <LuDollarSign className="text-blue-500 dark:text-blue-400" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Total de ventas</p>
                    <p className="text-xl font-bold">{formatCurrency(totalSales)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-md border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center">
                  <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2 mr-3">
                    <LuArrowUp className="text-green-500 dark:text-green-400" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Transacciones</p>
                    <p className="text-xl font-bold">{filteredTransactions.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-md border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center">
                  <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2 mr-3">
                    <LuCalendar className="text-amber-500 dark:text-amber-400" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Ticket medio</p>
                    <p className="text-xl font-bold">
                      {filteredTransactions.length 
                        ? formatCurrency(totalSales / filteredTransactions.length) 
                        : formatCurrency(0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : filteredTransactions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Ventas por día</h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dailySalesData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Bar 
                          dataKey="ventas" 
                          fill="hsl(var(--chart-1))" 
                          name="Ventas" 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Distribución por categoría</h3>
                  {categoryData.length > 0 ? (
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                            dataKey="value"
                            nameKey="name"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] bg-neutral-50 dark:bg-neutral-900 rounded-md">
                      <p className="text-neutral-500 dark:text-neutral-400">
                        No hay datos suficientes
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-neutral-500 dark:text-neutral-400">
                  No hay transacciones en el período seleccionado
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionHistory 
            transactions={filteredTransactions} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default AccountingView;
