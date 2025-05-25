import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MemberAccess } from "@shared/schema";

interface MemberAccessWithDetails extends MemberAccess {
  member: {
    id: number;
    firstName: string;
    lastName: string;
    memberNumber: string;
  };
}

export default function RecentAccesses() {
  const { data: accesses, isLoading } = useQuery<MemberAccessWithDetails[]>({
    queryKey: ["/api/access/recent"],
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  return (
    <Card className="h-full">
      <CardHeader className="px-6 py-4 border-b">
        <CardTitle className="text-base font-medium">Últimos Accesos</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center">
                <Skeleton className="rounded-full h-10 w-10 mr-4" />
                <div className="flex-1">
                  <div className="flex items-center">
                    <Skeleton className="h-4 w-32 mr-2" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-20 mt-1" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))
          ) : (
            accesses?.map((access) => (
              <div key={access.id} className="px-6 py-4 flex items-center">
                <div className={`rounded-full p-3 mr-4 ${
                  access.accessType === "entry" 
                    ? "bg-green-100 dark:bg-green-900/30" 
                    : "bg-red-100 dark:bg-red-900/30"
                }`}>
                  {access.accessType === "entry" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M17 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zM9.293 3.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L10.586 8H3a1 1 0 110-2h7.586L9.293 4.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="flex items-center">
                    <p className="text-sm font-medium">
                      {`${access.member.firstName} ${access.member.lastName}`}
                    </p>
                    <Badge
                      variant={access.accessType === "entry" ? "success" : "destructive"}
                      className="ml-2"
                    >
                      {access.accessType === "entry" ? "Entrada" : "Salida"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatTime(access.timestamp)}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-xs text-muted-foreground">#{access.member.memberNumber}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter className="px-6 py-3 bg-muted/50 border-t text-center">
        <Link href="/access" className="w-full">
          <a className="text-sm text-primary hover:underline">
            Ver todos los accesos →
          </a>
        </Link>
      </CardFooter>
    </Card>
  );
}
