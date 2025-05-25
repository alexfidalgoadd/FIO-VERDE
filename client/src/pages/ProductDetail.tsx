import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Save, 
  PackageOpen, 
  Pencil,
  History,
  BarChart
} from "lucide-react";
import { insertProductSchema, ProductCategory } from "@shared/schema";

// Extend the schema with any additional validation we need
const productFormSchema = insertProductSchema.extend({
  thcPercentage: z.union([
    z.number().min(0).max(100).optional(),
    z.string().transform((val) => (val === "" ? null : Number(val))),
  ]),
  cbdPercentage: z.union([
    z.number().min(0).max(100).optional(),
    z.string().transform((val) => (val === "" ? null : Number(val))),
  ]),
  price: z.union([
    z.number().min(0).optional(),
    z.string().transform((val) => (val === "" ? 0 : Number(val))),
  ]),
  stockQuantity: z.union([
    z.number().min(0).optional(),
    z.string().transform((val) => (val === "" ? 0 : Number(val))),
  ]),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductDetail() {
  const [activeTab, setActiveTab] = useState("details");
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const isNew = id === "new";
  
  // Estados para controlar la cantidad a añadir o quitar del inventario
  const [addStockAmount, setAddStockAmount] = useState<number>(0);
  const [removeStockAmount, setRemoveStockAmount] = useState<number>(0);

  // Set up form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      image: null,
      categoryId: null,
      stockQuantity: 0,
      strainType: null,
      thcPercentage: null,
      cbdPercentage: null,
      growMethod: null,
      harvestDate: null,
      originRegion: null,
      visibleInDispensary: true,
      notes: "",
    },
  });

  // Fetch product categories for dropdown
  const { data: categories } = useQuery<ProductCategory[]>({
    queryKey: ["/api/product-categories"],
  });

  // Fetch product data if editing existing product
  const { data: product, isLoading } = useQuery({
    queryKey: ["/api/products", id],
    enabled: !isNew && !!id,
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      return response.json();
    },
    onSuccess: (data) => {
      if (data) {
        // Reset form with existing product data
        form.reset({
          name: data.name,
          description: data.description || "",
          price: data.price,
          image: data.image,
          categoryId: data.categoryId,
          stockQuantity: data.stockQuantity,
          strainType: data.strainType,
          thcPercentage: data.thcPercentage,
          cbdPercentage: data.cbdPercentage,
          growMethod: data.growMethod,
          harvestDate: data.harvestDate ? new Date(data.harvestDate).toISOString().split('T')[0] : null,
          originRegion: data.originRegion,
          visibleInDispensary: data.visibleInDispensary,
          notes: data.notes || "",
        });
      }
    }
  });

  // Create or update product
  // Mutación para actualizar el stock del producto
  const stockMutation = useMutation({
    mutationFn: async ({ amount, operation }: { amount: number, operation: 'add' | 'remove' }) => {
      if (!product) return;
      
      const newStockQuantity = operation === 'add'
        ? (product.stockQuantity || 0) + amount
        : Math.max(0, (product.stockQuantity || 0) - amount);
        
      return apiRequest("PATCH", `/api/products/${id}`, {
        stockQuantity: newStockQuantity
      });
    },
    onSuccess: () => {
      // Limpiar campos de entrada después de actualizar
      setAddStockAmount(0);
      setRemoveStockAmount(0);
      
      // Refrescar los datos del producto
      queryClient.invalidateQueries({ queryKey: [`/api/products/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      toast({
        title: "Stock actualizado",
        description: "El inventario ha sido actualizado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar el stock",
        description: error instanceof Error ? error.message : "Ha ocurrido un error",
        variant: "destructive",
      });
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      if (isNew) {
        return apiRequest("POST", "/api/products", values);
      } else {
        return apiRequest("PATCH", `/api/products/${id}`, values);
      }
    },
    onSuccess: (data) => {
      toast({
        title: isNew ? "Producto creado" : "Producto actualizado",
        description: isNew 
          ? `Se ha creado un nuevo producto: ${form.getValues().name}` 
          : `Se han guardado los cambios del producto ${form.getValues().name}`,
      });
      
      if (isNew && data.id) {
        navigate(`/products/${data.id}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/products", id] });
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      }
    },
    onError: (error) => {
      console.error("Error creating/updating product:", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al guardar los datos del producto",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: ProductFormValues) => {
    mutation.mutate(values);
  };

  // Image upload handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("image", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/products")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isNew ? "Nuevo Producto" : isLoading ? "Cargando..." : product?.name}
          </h1>
        </div>
        
        {!isNew && product && (
          <div className="flex items-center space-x-2">
            <div className="text-sm text-muted-foreground">
              {product.stockQuantity > 0 ? (
                <span>Stock: {product.stockQuantity}g</span>
              ) : (
                <span className="text-red-500">Sin stock</span>
              )}
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">
            <PackageOpen className="h-4 w-4 mr-2" />
            Detalles
          </TabsTrigger>
          {!isNew && (
            <>
              <TabsTrigger value="inventory" disabled={isNew}>
                <BarChart className="h-4 w-4 mr-2" />
                Inventario
              </TabsTrigger>
              <TabsTrigger value="history" disabled={isNew}>
                <History className="h-4 w-4 mr-2" />
                Historial
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Información del Producto</CardTitle>
              <CardDescription>
                Introduce los detalles del producto
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre del producto" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(Number(value))}
                              value={field.value?.toString() || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories?.map((category) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Precio (€/g)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="stockQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock (g)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="strainType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Variedad</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(value)}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="indica">Indica</SelectItem>
                                <SelectItem value="sativa">Sativa</SelectItem>
                                <SelectItem value="hybrid">Híbrido</SelectItem>
                                <SelectItem value="ruderalis">Ruderalis</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="thcPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>THC %</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="0.1"
                                placeholder="ej. 20.5"
                                {...field}
                                value={field.value === null ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cbdPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CBD %</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="0.1"
                                placeholder="ej. 5.2"
                                {...field}
                                value={field.value === null ? '' : field.value}
                                onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="harvestDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de Cosecha</FormLabel>
                            <FormControl>
                              <Input 
                                type="date"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value || null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="growMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Método de Cultivo</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(value)}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un método" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="indoor">Interior</SelectItem>
                                <SelectItem value="outdoor">Exterior</SelectItem>
                                <SelectItem value="greenhouse">Invernadero</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Imagen</FormLabel>
                            <div className="flex items-center gap-4">
                              {field.value && (
                                <div className="relative w-20 h-20 rounded overflow-hidden border border-input">
                                  <img
                                    src={field.value}
                                    alt="Product preview"
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  className="cursor-pointer"
                                />
                                <FormDescription>
                                  Sube una imagen representativa del producto
                                </FormDescription>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descripción detallada del producto" 
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notas</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Notas adicionales (internas)" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="visibleInDispensary"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Visible en Dispensario</FormLabel>
                            <FormDescription>
                              Cuando está activado, este producto será visible en la pantalla de dispensario
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={mutation.isPending} className="flex items-center">
                        {mutation.isPending ? (
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {isNew ? "Crear Producto" : "Guardar Cambios"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {!isNew && (
          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Inventario</CardTitle>
                <CardDescription>
                  Ajusta el stock y registra movimientos de inventario
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="py-4">
                        <CardTitle className="text-base">Stock Actual</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {product?.stockQuantity || 0}g
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="py-4">
                        <CardTitle className="text-base">Precio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {product?.price?.toFixed(2) || 0}€/g
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="py-4">
                        <CardTitle className="text-base">Dispensado Total</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          0g
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="add-stock">Añadir Stock (g)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input 
                          id="add-stock" 
                          type="number" 
                          min="0" 
                          step="0.1"
                          value={addStockAmount || ""}
                          onChange={(e) => setAddStockAmount(parseFloat(e.target.value) || 0)}
                        />
                        <Button 
                          onClick={() => {
                            if (addStockAmount > 0) {
                              stockMutation.mutate({ amount: addStockAmount, operation: 'add' });
                            }
                          }}
                          disabled={stockMutation.isPending || addStockAmount <= 0}
                        >
                          {stockMutation.isPending && stockMutation.variables?.operation === 'add' ? (
                            <span className="animate-spin mr-2">⏳</span>
                          ) : null}
                          Añadir
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="remove-stock">Eliminar Stock (g)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input 
                          id="remove-stock" 
                          type="number" 
                          min="0" 
                          step="0.1"
                          value={removeStockAmount || ""}
                          onChange={(e) => setRemoveStockAmount(parseFloat(e.target.value) || 0)}
                        />
                        <Button 
                          variant="outline"
                          onClick={() => {
                            if (removeStockAmount > 0) {
                              stockMutation.mutate({ amount: removeStockAmount, operation: 'remove' });
                            }
                          }}
                          disabled={stockMutation.isPending || removeStockAmount <= 0}
                        >
                          {stockMutation.isPending && stockMutation.variables?.operation === 'remove' ? (
                            <span className="animate-spin mr-2">⏳</span>
                          ) : null}
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {!isNew && (
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Dispensas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-6">
                  No hay dispensas recientes de este producto
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}