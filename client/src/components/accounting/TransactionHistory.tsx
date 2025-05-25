import { useState } from "react";
import { TransactionWithItems } from "@shared/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { LuChevronDown, LuChevronRight, LuShoppingCart } from "react-icons/lu";

interface TransactionHistoryProps {
  transactions: TransactionWithItems[];
  isLoading: boolean;
}

export function TransactionHistory({
  transactions,
  isLoading,
}: TransactionHistoryProps) {
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({});

  const toggleTransaction = (id: number) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div>
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border rounded-md p-4 space-y-2">
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="flex justify-between pt-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <Collapsible
              key={transaction.id}
              open={openItems[transaction.id]}
              onOpenChange={() => toggleTransaction(transaction.id)}
              className="border rounded-md overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 bg-neutral-50 dark:bg-neutral-900">
                <div className="flex items-center">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1">
                      {openItems[transaction.id] ? (
                        <LuChevronDown className="h-4 w-4" />
                      ) : (
                        <LuChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <LuShoppingCart className="ml-1 mr-2 h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                  <div>
                    <div className="font-medium">
                      {transaction.member.fullName}
                      <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">
                        #{transaction.member.memberNumber}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      {formatDateTime(transaction.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatCurrency(transaction.total)}</div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    {transaction.items.length} producto{transaction.items.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <CollapsibleContent>
                <div className="p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Descuento</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transaction.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.product.name}</div>
                              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                {item.product.category} {item.product.subcategory ? `• ${item.product.subcategory}` : ""}{item.product.cannabisType ? ` • ${item.product.cannabisType}` : ""}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity}{item.product.unitType}</TableCell>
                          <TableCell>{formatCurrency(item.price)}/{item.product.unitType}</TableCell>
                          <TableCell>
                            {item.discount > 0 ? (
                              <Badge variant="outline">{item.discount}%</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(
                              item.price * item.quantity * (1 - item.discount / 100)
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} className="text-right font-bold">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(transaction.total)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-neutral-500 dark:text-neutral-400">
            No hay transacciones disponibles
          </p>
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;
