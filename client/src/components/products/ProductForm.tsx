import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ProductCategory,
  CannabisType,
  ExtractionType,
  insertProductSchema,
} from "@shared/schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

// Extend product schema with additional validation
const productFormSchema = insertProductSchema.extend({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  category: z.nativeEnum(ProductCategory),
  pricePerGram: z.coerce.number().min(0.01, "El precio debe ser mayor a 0"),
  quantity: z.coerce.number().min(0, "La cantidad no puede ser negativa"),
  thcPercentage: z.coerce.number().optional().nullable(),
  cannabisType: z.nativeEnum(CannabisType).optional().nullable(),
  subcategory: z.string().optional().nullable(),
  terpenes: z.string().optional().nullable(),
  genetics: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  minStockAlert: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  batchNumber: z.string().optional().nullable(),
  unitType: z.string().default("g"),
});

interface ProductFormProps {
  initialValues?: any;
  onSuccess?: () => void;
}

export function ProductForm({ initialValues, onSuccess }: ProductFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialValues;

  const form = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialValues || {
      name: "",
      category: undefined,
      subcategory: null,
      quantity: 0,
      pricePerGram: 0,
      photoUrl: null,
      thcPercentage: null,
      cannabisType: null,
      terpenes: null,
      genetics: null,
      visibleInDispensary: true,
      brand: null,
      notes: null,
      minStockAlert: null,
      batchNumber: null,
      unitType: "g",
    },
  });

  const watchCategory = form.watch("category");

  async function onSubmit(values: z.infer<typeof productFormSchema>) {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await apiRequest("PUT", `/api/products/${initialValues.id}`, values);
        toast({
          title: "Producto actualizado",
          description: "El producto ha sido actualizado correctamente.",
        });
      } else {
        await apiRequest("POST", "/api/products", values);
        form.reset();
        toast({
          title: "Producto creado",
          description: "El producto ha sido creado correctamente.",
        });
      }
      
      // Invalidate products query to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al guardar el producto.",
        variant: "destructive",
      });
      console.error("Error saving product:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información básica</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: OG Kush" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(ProductCategory).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchCategory === ProductCategory.EXTRACTIONS && (
              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategoría</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar subcategoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ExtractionType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="cannabisType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(CannabisType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <FormControl>
                    <Input placeholder="Marca o productor" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unitType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de unidad</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar unidad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="g">Gramos (g)</SelectItem>
                      <SelectItem value="u">Unidades (u)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricePerGram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio por {form.getValues("unitType") || "g"}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad disponible ({form.getValues("unitType") || "g"})</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minStockAlert"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alerta de stock mínimo</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      {...field} 
                      value={field.value === null ? "" : field.value} 
                      onChange={e => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Cantidad a partir de la cual se mostrará una alerta de stock bajo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thcPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Porcentaje de THC</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="100" 
                      {...field} 
                      value={field.value === null ? "" : field.value} 
                      onChange={e => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles adicionales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <FormField
              control={form.control}
              name="terpenes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terpenos</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Myrcene, Limonene, Caryophyllene" 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="genetics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Genética</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Chemdawg x Hindu Kush" 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>URL de la foto</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://ejemplo.com/imagen.jpg" 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Introduce la URL de una imagen para mostrar en el catálogo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="batchNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de lote</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: OGK-2023-05" 
                      {...field}
                      value={field.value || ""}
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
                <FormItem className="col-span-2">
                  <FormLabel>Notas internas</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Información adicional sobre el producto" 
                      className="min-h-[120px]" 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visibleInDispensary"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Visible en dispensario</FormLabel>
                    <FormDescription>
                      Mostrar este producto en el catálogo del dispensario
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
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess && onSuccess()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default ProductForm;
