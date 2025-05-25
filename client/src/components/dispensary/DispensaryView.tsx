import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product, MemberWithUser } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LuSearch, LuFilter } from "react-icons/lu";
import ProductCard from "../products/ProductCard";
import ShoppingCart from "./ShoppingCart";

export function DispensaryView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(null);
  const [selectedTab, setSelectedTab] = useState("all");
  
  // Items in the cart
  const [cartItems, setCartItems] = useState<{
    product: Product;
    quantity: number;
    discount: number;
  }[]>([]);

  // Fetch products visible in dispensary
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/dispensary"],
  });

  // Fetch all members for selection
  const { data: members, isLoading: membersLoading } = useQuery<MemberWithUser[]>({
    queryKey: ["/api/members"],
  });

  const activeMembers = members?.filter(m => m.active) || [];

  // Add product to cart
  const addToCart = (product: Product) => {
    // Check if product is already in cart
    const existingItem = cartItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      // Increment quantity if already in cart
      setCartItems(cartItems.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      // Add new item to cart
      setCartItems([...cartItems, { product, quantity: 1, discount: 0 }]);
    }
  };

  // Update cart item quantity
  const updateCartItemQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(cartItems.map(item => 
        item.product.id === productId 
          ? { ...item, quantity } 
          : item
      ));
    }
  };

  // Update cart item discount
  const updateCartItemDiscount = (productId: number, discount: number) => {
    setCartItems(cartItems.map(item => 
      item.product.id === productId 
        ? { ...item, discount } 
        : item
    ));
  };

  // Remove product from cart
  const removeFromCart = (productId: number) => {
    setCartItems(cartItems.filter(item => item.product.id !== productId));
  };

  // Clear shopping cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Filter products based on search, category and tab
  const filteredProducts = products
    ? products.filter((product) => {
        // Apply search filter
        const matchesSearch =
          searchQuery === "" ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (product.subcategory && product.subcategory.toLowerCase().includes(searchQuery.toLowerCase()));

        // Apply category filter
        const matchesCategory =
          categoryFilter === "all" || product.category === categoryFilter;

        // All filters passed
        return matchesSearch && matchesCategory;
      })
    : [];

  // Group products by category
  const groupedProducts = filteredProducts.reduce<Record<string, Product[]>>(
    (acc, product) => {
      const key = product.category;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(product);
      return acc;
    },
    {}
  );

  return (
    <div className="flex flex-col h-full lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0">
      <div className="w-full lg:w-2/3 flex flex-col h-full">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          </div>
          <div className="flex gap-2">
            <div className="w-40">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {products && Array.from(new Set(products.map(p => p.category))).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto mt-6">
          <ScrollArea className="h-[calc(100vh-280px)]">
            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="w-full h-36" />
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                      <div className="flex justify-between pt-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="space-y-8">
                {Object.entries(groupedProducts).map(([category, products]) => (
                  <div key={category}>
                    <h3 className="text-lg font-medium mb-4">{category}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          onClick={addToCart}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-neutral-500 dark:text-neutral-400">
                  No se encontraron productos con los filtros actuales.
                </p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      <div className="w-full lg:w-1/3 flex flex-col h-full">
        <ShoppingCart
          items={cartItems}
          members={activeMembers}
          selectedMember={selectedMember}
          onSelectMember={setSelectedMember}
          onUpdateQuantity={updateCartItemQuantity}
          onUpdateDiscount={updateCartItemDiscount}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          isLoading={membersLoading}
        />
      </div>
    </div>
  );
}

export default DispensaryView;
