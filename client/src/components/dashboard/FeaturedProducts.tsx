import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ProductWithInventory } from "@shared/schema";
import ProductCard from "../products/ProductCard";

export function FeaturedProducts() {
  const { data: products, isLoading } = useQuery<ProductWithInventory[]>({
    queryKey: ["/api/products"],
  });

  // Filter to visible products with stock and take first 3
  const featuredProducts = products
    ? [...products]
        .filter((p) => p.visibleInDispensary && p.quantity > 0)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 3)
    : [];

  return (
    <Card className="h-full">
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
        <h3 className="text-base font-medium">Productos Destacados</h3>
        <Link href="/products">
          <Button variant="link" size="sm" className="text-primary-600 dark:text-primary-400">
            Ver todos
          </Button>
        </Link>
      </div>
      <CardContent className="p-4">
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
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
  );
}

export default FeaturedProducts;
