import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { 
  BarChart4, 
  TrendingUp, 
  Users, 
  Calendar, 
  Download, 
  Cannabis, 
  ArrowUpDown,
  FileSpreadsheet,
  File
} from "lucide-react";

interface DateRange {
  from?: Date;
  to?: Date;
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState("sales");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(new Date())
  });
  const [reportInterval, setReportInterval] = useState<"day" | "week" | "month">("day");

  // Charts data queries
  const { data: salesData, isLoading: isLoadingSales } = useQuery<any[]>({
    queryKey: [
      "/api/reports/sales", 
      dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      reportInterval
    ],
  });

  const { data: membersData, isLoading: isLoadingMembers } = useQuery<any[]>({
    queryKey: [
      "/api/reports/members", 
      dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    ],
  });

  const { data: productsData, isLoading: isLoadingProducts } = useQuery<any[]>({
    queryKey: [
      "/api/reports/products", 
      dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    ],
  });

  const { data: accessData, isLoading: isLoadingAccess } = useQuery<any[]>({
    queryKey: [
      "/api/reports/access", 
      dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      reportInterval
    ],
  });

  // Chart colors
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const exportToExcel = async () => {
    try {
      const endpoint = `/api/reports/${activeTab}/export/excel`;
      const params = new URLSearchParams();
      
      if (dateRange.from) {
        params.append('from', dateRange.from.toISOString());
      }
      if (dateRange.to) {
        params.append('to', dateRange.to.toISOString());
      }
      params.append('interval', reportInterval);
      
      const response = await fetch(`${endpoint}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${activeTab}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  const exportToPDF = async () => {
    try {
      const endpoint = `/api/reports/${activeTab}/export/pdf`;
      const params = new URLSearchParams();
      
      if (dateRange.from) {
        params.append('from', dateRange.from.toISOString());
      }
      if (dateRange.to) {
        params.append('to', dateRange.to.toISOString());
      }
      params.append('interval', reportInterval);
      
      const response = await fetch(`${endpoint}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${activeTab}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Informes</h1>
        
        <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-3">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Select 
          value={reportInterval} 
          onValueChange={(value: "day" | "week" | "month") => setReportInterval(value)}
        >
          <SelectTrigger className="w-auto">
            <SelectValue placeholder="Intervalo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Diario</SelectItem>
            <SelectItem value="week">Semanal</SelectItem>
            <SelectItem value="month">Mensual</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={exportToExcel} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Excel
        </Button>
        
        <Button variant="outline" onClick={exportToPDF} className="gap-2">
          <File className="h-4 w-4" />
          PDF
        </Button>
      </div>

      <Tabs 
        defaultValue="sales" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="sales">
            <TrendingUp className="h-4 w-4 mr-2" />
            Ventas
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Socios
          </TabsTrigger>
          <TabsTrigger value="products">
            <Cannabis className="h-4 w-4 mr-2" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="access">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Accesos
          </TabsTrigger>
        </TabsList>
        
        {/* Sales Tab */}
        <TabsContent value="sales">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Evolución de Ventas</CardTitle>
                <CardDescription>
                  Total de ventas por {reportInterval === "day" ? "día" : reportInterval === "week" ? "semana" : "mes"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSales ? (
                  <Skeleton className="h-[350px] w-full" />
                ) : salesData && salesData.length > 0 ? (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={salesData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          className="text-xs text-muted-foreground"
                        />
                        <YAxis 
                          className="text-xs text-muted-foreground"
                          tickFormatter={(value) => `${value} €`}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value} €`, "Ventas"]}
                          labelFormatter={(value) => `${value}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          name="Ventas" 
                          stroke="hsl(var(--primary))" 
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[350px] flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos disponibles para el periodo seleccionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Categoría</CardTitle>
                <CardDescription>
                  Distribución de ventas por categoría de producto
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSales ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : salesData && salesData.some(item => item.categories) ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesData.find(x => x.categories)?.categories || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {(salesData.find(x => x.categories)?.categories || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toFixed(2)} €`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos disponibles para el periodo seleccionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Productos Más Vendidos</CardTitle>
                <CardDescription>
                  Top productos por cantidad vendida
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSales ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : salesData && salesData.some(item => item.topProducts) ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={salesData.find(x => x.topProducts)?.topProducts || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          type="number" 
                          className="text-xs text-muted-foreground"
                        />
                        <YAxis 
                          type="category"
                          dataKey="name" 
                          className="text-xs text-muted-foreground"
                          width={100}
                          tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="quantity" name="Cantidad (g)" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos disponibles para el periodo seleccionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Members Tab */}
        <TabsContent value="members">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Nuevos Socios</CardTitle>
                <CardDescription>
                  Registro de nuevos socios en el periodo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMembers ? (
                  <Skeleton className="h-[350px] w-full" />
                ) : membersData && membersData.length > 0 ? (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={membersData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          className="text-xs text-muted-foreground"
                        />
                        <YAxis className="text-xs text-muted-foreground" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Nuevos Socios" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[350px] flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos disponibles para el periodo seleccionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Socios por Tipo</CardTitle>
                <CardDescription>
                  Distribución de socios por tipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMembers ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : membersData && membersData.some(item => item.typeDistribution) ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={membersData.find(x => x.typeDistribution)?.typeDistribution || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {(membersData.find(x => x.typeDistribution)?.typeDistribution || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => value} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos disponibles para el periodo seleccionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Actividad de Socios</CardTitle>
                <CardDescription>
                  Socios más activos (por dispensas)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMembers ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : membersData && membersData.some(item => item.topMembers) ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={membersData.find(x => x.topMembers)?.topMembers || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          type="number" 
                          className="text-xs text-muted-foreground"
                        />
                        <YAxis 
                          type="category"
                          dataKey="name" 
                          className="text-xs text-muted-foreground"
                          width={100}
                          tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="visits" name="Dispensas" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos disponibles para el periodo seleccionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Products Tab */}
        <TabsContent value="products">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Productos Más Dispensados</CardTitle>
                <CardDescription>
                  Por cantidad (gramos)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProducts ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : productsData && productsData.some(item => item.topByQuantity) ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={productsData.find(x => x.topByQuantity)?.topByQuantity || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          type="number" 
                          className="text-xs text-muted-foreground"
                        />
                        <YAxis 
                          type="category"
                          dataKey="name" 
                          className="text-xs text-muted-foreground"
                          width={100}
                          tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                        />
                        <Tooltip formatter={(value) => `${value}g`} />
                        <Legend />
                        <Bar dataKey="quantity" name="Cantidad (g)" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos disponibles para el periodo seleccionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Productos Más Vendidos</CardTitle>
                <CardDescription>
                  Por valor (euros)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProducts ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : productsData && productsData.some(item => item.topByValue) ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={productsData.find(x => x.topByValue)?.topByValue || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          type="number" 
                          className="text-xs text-muted-foreground"
                        />
                        <YAxis 
                          type="category"
                          dataKey="name" 
                          className="text-xs text-muted-foreground"
                          width={100}
                          tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                        />
                        <Tooltip formatter={(value) => `${value} €`} />
                        <Legend />
                        <Bar dataKey="value" name="Valor (€)" fill="hsl(var(--chart-2))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos disponibles para el periodo seleccionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Ventas por Categoría</CardTitle>
                <CardDescription>
                  Distribución por categoría de producto
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProducts ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : productsData && productsData.some(item => item.byCategory) ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={productsData.find(x => x.byCategory)?.byCategory || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="name" 
                          className="text-xs text-muted-foreground"
                        />
                        <YAxis className="text-xs text-muted-foreground" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="quantity" name="Cantidad (g)" fill="hsl(var(--primary))" />
                        <Bar dataKey="value" name="Valor (€)" fill="hsl(var(--chart-2))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos disponibles para el periodo seleccionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Access Tab */}
        <TabsContent value="access">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Actividad de Acceso</CardTitle>
                <CardDescription>
                  Entradas y salidas registradas por {reportInterval === "day" ? "día" : reportInterval === "week" ? "semana" : "mes"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAccess ? (
                  <Skeleton className="h-[350px] w-full" />
                ) : accessData && accessData.length > 0 ? (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={accessData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          className="text-xs text-muted-foreground"
                        />
                        <YAxis className="text-xs text-muted-foreground" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="entries" name="Entradas" fill="hsl(var(--chart-2))" />
                        <Bar dataKey="exits" name="Salidas" fill="hsl(var(--chart-3))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[350px] flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos disponibles para el periodo seleccionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Afluencia por Hora</CardTitle>
                <CardDescription>
                  Distribución de visitas por hora del día
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAccess ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : accessData && accessData.some(item => item.hourlyDistribution) ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={accessData.find(x => x.hourlyDistribution)?.hourlyDistribution || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="hour" 
                          className="text-xs text-muted-foreground"
                        />
                        <YAxis className="text-xs text-muted-foreground" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Visitas" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos disponibles para el periodo seleccionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Afluencia por Día</CardTitle>
                <CardDescription>
                  Distribución de visitas por día de la semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAccess ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : accessData && accessData.some(item => item.weekdayDistribution) ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={accessData.find(x => x.weekdayDistribution)?.weekdayDistribution || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="day" 
                          className="text-xs text-muted-foreground"
                        />
                        <YAxis className="text-xs text-muted-foreground" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Visitas" fill="hsl(var(--chart-4))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos disponibles para el periodo seleccionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
