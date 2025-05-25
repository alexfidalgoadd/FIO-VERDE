import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ProductWithInventory, ProductCategory, CannabisType } from "@shared/schema";
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
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "./ProductCard";
import { LuPlus, LuSearch, LuFilter } from "react-icons/lu";

interface ProductListProps {
  onNewProduct?: () => void;
}

export function ProductList({ onNewProduct }: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [cannabisTypeFilter, setCannabisTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");

  const { data: products, isLoading } = useQuery<ProductWithInventory[]>({
    queryKey: ["/api/products"],
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredProducts = products
    ? products.filter((product) => {
        // First apply search filter
        const matchesSearch =
          searchQuery === "" ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (product.subcategory && product.subcategory.toLowerCase().includes(searchQuery.toLowerCase()));

        // Then apply category filter
        const matchesCategory =
          categoryFilter === "all" || product.category === categoryFilter;

        // Then apply cannabis type filter
        const matchesCannabisType =
          cannabisTypeFilter === "all" || product.cannabisType === cannabisTypeFilter;

        // Then apply visibility tab
        const matchesTab =
          activeTab === "all" ||
          (activeTab === "visible" && product.visibleInDispensary) ||
          (activeTab === "hidden" && !product.visibleInDispensary);

        return matchesSearch && matchesCategory && matchesCannabisType && matchesTab;
      })
    : [];

  // Group products by category
  const groupedProducts = filteredProducts.reduce<
    Record<string, ProductWithInventory[]>
  >((acc, product) => {
    const key = product.category;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(product);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={handleSearch}
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
                {Object.values(ProductCategory).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <Select value={cannabisTypeFilter} onValueChange={setCannabisTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.values(CannabisType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {onNewProduct && (
            <Button onClick={onNewProduct} className="whitespace-nowrap">
              <LuPlus className="mr-2" /> Nuevo
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="visible">Visibles</TabsTrigger>
          <TabsTrigger value="hidden">Ocultos</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
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
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedProducts).map(([category, products]) => (
            <div key={category}>
              <h3 className="text-lg font-medium mb-4">{category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-500 dark:text-neutral-400">
                No se encontraron productos que coincidan con los filtros aplicados.
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                  setCannabisTypeFilter("all");
                  setActiveTab("all");
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductList;
