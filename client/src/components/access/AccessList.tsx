import { useQuery } from "@tanstack/react-query";
import { AccessLogWithMember, AccessType } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeAgo } from "@/lib/utils";
import { LuLogIn, LuLogOut, LuUserCheck, LuRefreshCw } from "react-icons/lu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AccessListProps {
  limit?: number;
  memberId?: number;
  showRefresh?: boolean;
  compact?: boolean;
  className?: string;
}

export function AccessList({
  limit,
  memberId,
  showRefresh = true,
  compact = false,
  className = "",
}: AccessListProps) {
  const { data: accessLogs, isLoading, refetch } = useQuery<AccessLogWithMember[]>({
    queryKey: memberId ? [`/api/access/member/${memberId}`] : ["/api/access"],
  });

  const limitedLogs = limit ? accessLogs?.slice(0, limit) : accessLogs;

  const handleRefresh = () => {
    refetch();
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {compact ? null : (
            <div className="flex items-center">
              <LuUserCheck className="mr-2" />
              {memberId ? "Accesos del socio" : "Registro de accesos"}
            </div>
          )}
        </CardTitle>
        {showRefresh && (
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <LuRefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        )}
      </CardHeader>
      <CardContent className={compact ? "p-0" : undefined}>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: limit || 5 }).map((_, i) => (
              <div key={i} className="flex items-center p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="ml-4 space-y-1 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : limitedLogs && limitedLogs.length > 0 ? (
          <ScrollArea className={`${compact ? "h-[250px]" : "h-[500px]"}`}>
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {limitedLogs.map((access) => (
                <div key={access.id} className="px-4 py-3 flex items-center">
                  {!compact && (
                    <div
                      className={`rounded-full p-2 mr-4 ${
                        access.accessType === AccessType.ENTRY
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                      }`}
                    >
                      {access.accessType === AccessType.ENTRY ? (
                        <LuLogIn
                          className="text-green-500 dark:text-green-400"
                          size={16}
                        />
                      ) : (
                        <LuLogOut
                          className="text-red-500 dark:text-red-400"
                          size={16}
                        />
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center">
                      {!memberId && (
                        <div className="flex items-center">
                          {access.member.photoUrl ? (
                            <img
                              src={access.member.photoUrl}
                              alt={access.member.fullName}
                              className="h-8 w-8 rounded-full mr-2 object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 mr-2">
                              {access.member.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <p className="font-medium mr-2">{access.member.fullName}</p>
                        </div>
                      )}
                      <Badge
                        variant={
                          access.accessType === AccessType.ENTRY
                            ? "success"
                            : "destructive"
                        }
                        className={memberId ? "ml-0" : "ml-2"}
                      >
                        {access.accessType === AccessType.ENTRY
                          ? "Entrada"
                          : "Salida"}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {formatTimeAgo(access.timestamp)} 
                      {!compact && !memberId && (
                        <span className="ml-2">#{access.member.memberNumber}</span>
                      )}
                    </p>
                  </div>
                  {!compact && memberId && (
                    <div className="ml-auto text-right">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatTimeAgo(access.timestamp)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-neutral-500 dark:text-neutral-400">
              No hay registros de acceso
            </p>
            {showRefresh && (
              <Button variant="link" size="sm" onClick={handleRefresh} className="mt-2">
                Actualizar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AccessList;
