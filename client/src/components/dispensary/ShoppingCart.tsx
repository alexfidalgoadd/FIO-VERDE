import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MemberWithUser, Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, calculateDiscountedPrice } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LuTrash2, LuShoppingCart, LuAlertCircle, LuPlusCircle, LuMinusCircle } from "react-icons/lu";

interface ShoppingCartProps {
  items: {
    product: Product;
    quantity: number;
    discount: number;
  }[];
  members: MemberWithUser[];
  selectedMember: MemberWithUser | null;
  onSelectMember: (member: MemberWithUser | null) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onUpdateDiscount: (productId: number, discount: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  isLoading: boolean;
}

export function ShoppingCart({
  items,
  members,
  selectedMember,
  onSelectMember,
  onUpdateQuantity,
  onUpdateDiscount,
  onRemoveItem,
  onClearCart,
  isLoading,
}: ShoppingCartProps) {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  // Calculate total price of all items
  const subtotal = items.reduce((total, item) => {
    return total + calculateDiscountedPrice(
      item.product.pricePerGram, 
      item.quantity,
      item.discount
    );
  }, 0);

  // Handle checkout process
  const handleCheckout = async () => {
    if (!selectedMember) {
      toast({
        title: "Error",
        description: "Selecciona un socio para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Añade productos al carrito para continuar.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      const transaction = {
        memberId: selectedMember.id,
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          discount: item.discount
        }))
      };

      await apiRequest("POST", "/api/transactions", transaction);

      toast({
        title: "Compra completada",
        description: "La transacción se ha registrado correctamente.",
      });

      // Clear cart and reset selected member
      onClearCart();
      
      // Refresh products to update stock
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/dispensary"] });
      
    } catch (error: any) {
      console.error("Error processing transaction:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo completar la transacción.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center">
          <LuShoppingCart className="mr-2" />
          Carrito de compra
        </CardTitle>
      </CardHeader>
      <div className="px-6 mb-4">
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select
            value={selectedMember ? String(selectedMember.id) : ""}
            onValueChange={(value) => {
              const member = members.find(m => m.id === Number(value)) || null;
              onSelectMember(member);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar socio" />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.id} value={String(member.id)}>
                  {member.fullName} - #{member.memberNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      <CardContent className="flex-1 overflow-auto p-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <LuShoppingCart className="h-16 w-16 text-neutral-300 dark:text-neutral-600 mb-4" />
            <p className="text-neutral-500 dark:text-neutral-400">El carrito está vacío</p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-2">
              Agrega productos haciendo clic en ellos
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-430px)]">
            <div className="px-6 divide-y divide-neutral-200 dark:divide-neutral-800">
              {items.map((item) => (
                <div key={item.product.id} className="py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {formatCurrency(item.product.pricePerGram)}/{item.product.unitType}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="h-8 w-8 text-neutral-500 hover:text-red-500"
                    >
                      <LuTrash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="mt-2 flex items-center">
                    <div className="flex items-center border rounded-md">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <LuMinusCircle className="h-4 w-4" />
                      </Button>
                      <div className="w-12 text-center">{item.quantity}{item.product.unitType}</div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.quantity}
                      >
                        <LuPlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="ml-4 flex items-center gap-2">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        Descuento:
                      </span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount}
                        onChange={(e) => onUpdateDiscount(item.product.id, Number(e.target.value))}
                        className="w-16 h-8 text-center"
                      />
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">%</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      Subtotal:
                    </div>
                    <div className="font-medium">
                      {formatCurrency(
                        calculateDiscountedPrice(
                          item.product.pricePerGram, 
                          item.quantity,
                          item.discount
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      
      <CardFooter className="flex-col border-t border-neutral-200 dark:border-neutral-800 p-6">
        <div className="flex justify-between items-center w-full mb-4">
          <span className="font-medium">Total:</span>
          <span className="text-xl font-bold">{formatCurrency(subtotal)}</span>
        </div>
        
        <div className="flex space-x-2 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClearCart}
            disabled={items.length === 0 || processing}
          >
            Vaciar
          </Button>
          <Button
            className="flex-1"
            onClick={handleCheckout}
            disabled={!selectedMember || items.length === 0 || processing}
          >
            {processing ? "Procesando..." : "Completar compra"}
          </Button>
        </div>
        
        {!selectedMember && items.length > 0 && (
          <div className="mt-3 flex items-start text-sm text-amber-600 dark:text-amber-500">
            <LuAlertCircle className="h-4 w-4 mr-1 mt-0.5" />
            <span>Selecciona un socio para continuar</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export default ShoppingCart;
