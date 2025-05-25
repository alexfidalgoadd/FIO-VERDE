import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProductCard from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Product } from "@shared/schema";

export default function ProductsGrid() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  return (
    <Card className="h-full">
      <CardHeader className="px-6 py-4 border-b flex-row flex justify-between items-center">
        <CardTitle className="text-base font-medium">Productos Destacados</CardTitle>
        <Link href="/products">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
            Ver todos
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(3).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden flex flex-col">
                <Skeleton className="w-full h-36" />
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products?.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <a className="block h-full hover:opacity-90 transition-opacity">
                  <ProductCard product={product} />
                </a>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
