import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProductList from "@/components/products/ProductList";
import ProductForm from "@/components/products/ProductForm";
import { LuSprout } from "react-icons/lu";

export default function Products() {
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);

  const handleOpenNewProductDialog = () => {
    setIsNewProductDialogOpen(true);
  };

  const handleCloseNewProductDialog = () => {
    setIsNewProductDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center">
          <LuSprout className="mr-2" /> Productos
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventario de productos</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductList onNewProduct={handleOpenNewProductDialog} />
        </CardContent>
      </Card>

      {/* New Product Dialog */}
      <Dialog open={isNewProductDialogOpen} onOpenChange={setIsNewProductDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Producto</DialogTitle>
          </DialogHeader>
          <ProductForm onSuccess={handleCloseNewProductDialog} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
