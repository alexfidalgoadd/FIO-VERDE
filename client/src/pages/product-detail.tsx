import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import ProductForm from "@/components/products/ProductForm";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LuArrowLeft, LuEdit, LuInfo, LuTag, LuPackage, LuCalendar, LuEye, LuEyeOff } from "react-icons/lu";
import { Product } from "@shared/schema";

export default function ProductDetail({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: product, isLoading, refetch } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
  });

  const handleOpenEditDialog = () => {
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    refetch();
  };

  const handleBackToList = () => {
    setLocation("/products");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          size="sm"
          className="mb-6"
          onClick={handleBackToList}
        >
          <LuArrowLeft className="mr-2 h-4 w-4" /> Volver a la lista
        </Button>
        <Card className="p-6">
          <CardContent className="p-0">
            <Skeleton className="h-[600px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          size="sm"
          className="mb-6"
          onClick={handleBackToList}
        >
          <LuArrowLeft className="mr-2 h-4 w-4" /> Volver a la lista
        </Button>
        <Card className="p-6">
          <CardContent className="p-0 text-center py-12">
            <p className="text-neutral-500 dark:text-neutral-400">Producto no encontrado</p>
            <Button variant="link" onClick={handleBackToList}>
              Volver a la lista de productos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button 
        variant="outline" 
        size="sm"
        className="mb-6"
        onClick={handleBackToList}
      >
        <LuArrowLeft className="mr-2 h-4 w-4" /> Volver a la lista
      </Button>

      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div className="h-16 w-16 rounded-md bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 overflow-hidden">
            {product.photoUrl ? (
              <img
                src={product.photoUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <LuPackage className="h-8 w-8" />
            )}
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <div className="flex items-center space-x-2">
              <Badge>{product.category}</Badge>
              {product.subcategory && <Badge variant="outline">{product.subcategory}</Badge>}
              {product.cannabisType && <Badge variant="secondary">{product.cannabisType}</Badge>}
              {product.thcPercentage && (
                <Badge variant="outline" className="bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                  {product.thcPercentage}% THC
                </Badge>
              )}
              <Badge variant={product.visibleInDispensary ? "success" : "destructive"}>
                {product.visibleInDispensary ? (
                  <><LuEye className="mr-1 h-3 w-3" /> Visible</>
                ) : (
                  <><LuEyeOff className="mr-1 h-3 w-3" /> Oculto</>
                )}
              </Badge>
            </div>
          </div>
        </div>
        <Button onClick={handleOpenEditDialog} className="flex items-center">
          <LuEdit className="mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <LuInfo className="mr-2" /> Información del producto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Detalles básicos</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Categoría:</span>
                    <span className="font-medium">{product.category}</span>
                  </div>
                  {product.subcategory && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">Subcategoría:</span>
                      <span className="font-medium">{product.subcategory}</span>
                    </div>
                  )}
                  {product.cannabisType && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">Tipo:</span>
                      <span className="font-medium">{product.cannabisType}</span>
                    </div>
                  )}
                  {product.brand && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">Marca:</span>
                      <span className="font-medium">{product.brand}</span>
                    </div>
                  )}
                  {product.genetics && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">Genética:</span>
                      <span className="font-medium">{product.genetics}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Detalles técnicos</h3>
                <div className="space-y-2 text-sm">
                  {product.thcPercentage && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">THC:</span>
                      <span className="font-medium">{product.thcPercentage}%</span>
                    </div>
                  )}
                  {product.terpenes && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">Terpenos:</span>
                      <span className="font-medium">{product.terpenes}</span>
                    </div>
                  )}
                  {product.batchNumber && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">Lote:</span>
                      <span className="font-medium">{product.batchNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Fecha de entrada:</span>
                    <span className="font-medium">{formatDate(product.entryDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2">Descripción</h3>
              <p className="text-neutral-700 dark:text-neutral-300">{product.notes || "No hay descripción disponible."}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LuTag className="mr-2" /> Precio y stock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-2xl font-bold">{formatCurrency(product.pricePerGram)}/{product.unitType}</div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Precio por {product.unitType === 'g' ? 'gramo' : 'unidad'}</p>
            </div>

            <Separator />

            <div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 dark:text-neutral-400">Stock disponible:</span>
                <span className="text-xl font-medium">{product.quantity}{product.unitType}</span>
              </div>
              {product.minStockAlert && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-neutral-500 dark:text-neutral-400">Alerta de stock mínimo:</span>
                  <span className="font-medium">{product.minStockAlert}{product.unitType}</span>
                </div>
              )}
              <div className="mt-4">
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      product.minStockAlert && product.quantity <= product.minStockAlert
                        ? "bg-red-500"
                        : "bg-primary-500"
                    }`}
                    style={{ 
                      width: `${Math.min(product.quantity * 10, 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 text-right">
                  {product.minStockAlert && product.quantity <= product.minStockAlert && (
                    <span className="text-red-500 dark:text-red-400">Stock bajo</span>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Visibilidad</h4>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Visible en dispensario:</span>
                <Badge variant={product.visibleInDispensary ? "success" : "destructive"}>
                  {product.visibleInDispensary ? "Sí" : "No"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          <ProductForm 
            initialValues={product} 
            onSuccess={handleCloseEditDialog} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
