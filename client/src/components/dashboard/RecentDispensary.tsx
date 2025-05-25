import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatTimeAgo } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { TransactionWithItems } from "@shared/schema";

export function RecentDispensary() {
  const { data: transactions, isLoading } = useQuery<TransactionWithItems[]>({
    queryKey: ["/api/transactions"],
  });

  // Take the most recent 4 transactions
  const recentTransactions = transactions
    ? [...transactions].slice(0, 4)
    : [];

  return (
    <Card className="h-full">
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
        <h3 className="text-base font-medium">Últimas Dispensas</h3>
      </div>
      <div className="overflow-x-auto">
        {isLoading ? (
          <LoadingState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                        {transaction.member.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">
                          {transaction.member.fullName}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          #{transaction.member.memberNumber}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">
                      {transaction.items[0]?.product.name || "Múltiple"}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {transaction.items[0]?.product.category || ""}{" "}
                      {transaction.items[0]?.product.cannabisType
                        ? `• ${transaction.items[0]?.product.cannabisType}`
                        : ""}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {transaction.items[0]
                      ? `${transaction.items[0].quantity}${transaction.items[0].product.unitType}`
                      : ""}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatCurrency(transaction.total)}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-500 dark:text-neutral-400">
                    {formatTimeAgo(transaction.timestamp)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 text-center">
        <Link href="/accounting">
          <a className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            Ver todas las dispensas →
          </a>
        </Link>
      </div>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="p-4">
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="flex items-center">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="ml-3 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentDispensary;
