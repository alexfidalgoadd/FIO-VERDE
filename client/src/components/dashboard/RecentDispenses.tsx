import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface DispenseWithDetails {
  id: number;
  date: string;
  totalPrice: number;
  member: {
    id: number;
    firstName: string;
    lastName: string;
    memberNumber: string;
    photo: string | null;
  };
  items: {
    id: number;
    productId: number;
    productName: string;
    productCategory: string;
    productSubcategory: string;
    quantity: number;
    price: number;
  }[];
}

export default function RecentDispenses() {
  const { data: dispenses, isLoading } = useQuery<DispenseWithDetails[]>({
    queryKey: ["/api/dispenses/recent"],
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  return (
    <Card className="h-full">
      <CardHeader className="px-6 py-4 border-b">
        <CardTitle className="text-base font-medium">Últimas Dispensas</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Socio</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Producto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cantidad</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="ml-3">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16 mt-1" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-32 mt-1" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-8" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-20" />
                    </td>
                  </tr>
                ))
              ) : (
                dispenses?.map((dispense) => (
                  <tr key={dispense.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={dispense.member.photo || ""}
                            alt={`${dispense.member.firstName} ${dispense.member.lastName}`} 
                          />
                          <AvatarFallback>
                            {getInitials(dispense.member.firstName, dispense.member.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <p className="text-sm font-medium">{`${dispense.member.firstName} ${dispense.member.lastName}`}</p>
                          <p className="text-xs text-muted-foreground">{`#${dispense.member.memberNumber}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {dispense.items.length > 0 && (
                        <>
                          <p className="text-sm">{dispense.items[0].productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {dispense.items[0].productCategory} • {dispense.items[0].productSubcategory}
                          </p>
                          {dispense.items.length > 1 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              + {dispense.items.length - 1} más
                            </p>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {dispense.items.length > 0 && `${dispense.items[0].quantity}g`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {dispense.totalPrice.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatTime(dispense.date)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
      <CardFooter className="px-6 py-3 bg-muted/50 border-t text-center">
        <Link href="/dispensary" className="w-full">
          <a className="text-sm text-primary hover:underline">
            Ver todas las dispensas →
          </a>
        </Link>
      </CardFooter>
    </Card>
  );
}
