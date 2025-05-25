import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { MemberWithUser } from "@shared/schema";

export function RecentMembers() {
  const { data: members, isLoading } = useQuery<MemberWithUser[]>({
    queryKey: ["/api/members"],
  });

  // Sort by registration date and take the most recent 4
  const recentMembers = members
    ? [...members]
        .sort(
          (a, b) =>
            new Date(b.registrationDate).getTime() -
            new Date(a.registrationDate).getTime()
        )
        .slice(0, 4)
    : [];

  return (
    <Card className="h-full">
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
        <h3 className="text-base font-medium">Nuevos Socios</h3>
      </div>
      <CardContent className="p-4">
        {isLoading ? (
          <LoadingState />
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {recentMembers.map((member) => (
              <li key={member.id} className="py-3 flex items-center">
                <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={member.fullName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    member.fullName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {member.fullName}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Registrado: {formatDate(member.registrationDate)}
                  </p>
                </div>
                <Badge
                  className="ml-auto"
                  variant={member.active ? "success" : "warning"}
                >
                  {member.active ? "Activo" : "Pendiente"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 text-center">
          <Link href="/members">
            <a className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
              Ver todos los socios →
            </a>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
      {[1, 2, 3, 4].map((i) => (
        <li key={i} className="py-3 flex items-center">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="ml-3 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="ml-auto h-5 w-16 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

export default RecentMembers;
