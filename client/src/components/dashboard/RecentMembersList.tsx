import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistance } from "date-fns";
import { es } from "date-fns/locale";
import { Member } from "@shared/schema";

export default function RecentMembersList() {
  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members/recent"],
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Card className="h-full">
      <CardHeader className="px-6 py-4 border-b">
        <CardTitle className="text-base font-medium">Nuevos Socios</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="py-3 flex items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="ml-3 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="ml-auto h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {members?.map((member) => (
              <li key={member.id} className="py-3 flex items-center">
                <Avatar>
                  <AvatarImage src={member.photo || ""} alt={`${member.firstName} ${member.lastName}`} />
                  <AvatarFallback>{getInitials(member.firstName, member.lastName)}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium">{`${member.firstName} ${member.lastName}`}</p>
                  <p className="text-xs text-muted-foreground">
                    Registrado: {formatDistance(new Date(member.joinDate), new Date(), { 
                      addSuffix: true,
                      locale: es
                    })}
                  </p>
                </div>
                <Badge 
                  variant={member.active ? "success" : "secondary"}
                  className="ml-auto"
                >
                  {member.active ? "Activo" : "Inactivo"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 text-center">
          <Link href="/members">
            <a className="text-sm text-primary hover:underline">
              Ver todos los socios →
            </a>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
