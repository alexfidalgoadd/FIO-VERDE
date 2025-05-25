import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const truncateText = (text: string | null, length: number) => {
    if (!text) return "";
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="relative h-36">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium">{product.name}</h4>
            <p className="text-xs text-muted-foreground">
              {product.categoryId} • {product.strainType}
            </p>
          </div>
          {product.thcPercentage && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-0">
              {product.thcPercentage}% THC
            </Badge>
          )}
        </div>
        <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {truncateText(product.notes || "", 60)}
        </div>
        <div className="mt-3 flex justify-between items-end">
          <div>
            <span className="font-semibold">{product.price.toFixed(2)} €/g</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Stock: {product.stockQuantity}g
          </div>
        </div>
      </div>
    </Card>
  );
}
