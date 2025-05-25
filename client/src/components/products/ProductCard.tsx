import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, truncateText } from "@/lib/utils";
import { Product, ProductWithInventory } from "@shared/schema";

interface ProductCardProps {
  product: Product | ProductWithInventory;
  onClick?: (product: Product) => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(product);
    }
  };

  const cardContent = (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden flex flex-col h-full">
      {product.photoUrl ? (
        <img
          src={product.photoUrl}
          alt={product.name}
          className="w-full h-36 object-cover"
        />
      ) : (
        <div className="w-full h-36 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
          No image
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium">{product.name}</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {product.category} {product.subcategory ? `• ${product.subcategory}` : ""}
              {product.cannabisType ? ` • ${product.cannabisType}` : ""}
            </p>
          </div>
          {product.thcPercentage && (
            <Badge
              variant="outline"
              className="bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300"
            >
              {product.thcPercentage}% THC
            </Badge>
          )}
        </div>
        <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
          {truncateText(product.notes || "", 60)}
        </div>
        <div className="mt-3 flex justify-between items-end">
          <div>
            <span className="font-semibold">
              {formatCurrency(product.pricePerGram)}/{product.unitType}
            </span>
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            Stock: {product.quantity}{product.unitType}
          </div>
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <div onClick={handleClick} className="cursor-pointer h-full">
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={`/products/${product.id}`}>
      <a className="block h-full">
        {cardContent}
      </a>
    </Link>
  );
}

export default ProductCard;
