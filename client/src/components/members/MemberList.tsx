import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MemberWithUser, MemberType } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getMemberTypeLabel } from "@/lib/utils";
import { LuPlus, LuSearch, LuFilter } from "react-icons/lu";

interface MemberListProps {
  onNewMember?: () => void;
}

export function MemberList({ onNewMember }: MemberListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [memberTypeFilter, setMemberTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("active");

  const { data: members, isLoading } = useQuery<MemberWithUser[]>({
    queryKey: ["/api/members"],
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredMembers = members
    ? members.filter((member) => {
        // First apply search filter
        const matchesSearch =
          searchQuery === "" ||
          member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.memberNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (member.dni && member.dni.toLowerCase().includes(searchQuery.toLowerCase()));

        // Then apply member type filter
        const matchesType =
          memberTypeFilter === "all" || member.memberType === memberTypeFilter;

        // Then apply active/inactive tab
        const matchesTab =
          (activeTab === "active" && member.active) ||
          (activeTab === "inactive" && !member.active) ||
          activeTab === "all";

        return matchesSearch && matchesType && matchesTab;
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar socios..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10"
          />
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        </div>
        <div className="flex gap-2">
          <div className="w-40">
            <Select
              value={memberTypeFilter}
              onValueChange={setMemberTypeFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de socio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.values(MemberType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {getMemberTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {onNewMember && (
            <Button onClick={onNewMember} className="whitespace-nowrap">
              <LuPlus className="mr-2" /> Nuevo
            </Button>
          )}
        </div>
      </div>

      <Tabs
        defaultValue="active"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value="inactive">Inactivos</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <div className="p-4 flex items-center">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="ml-4 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="ml-auto h-6 w-16 rounded-full" />
                </div>
                <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 grid grid-cols-2 gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <Link key={member.id} href={`/members/${member.id}`}>
              <a className="block">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="p-4 flex items-center">
                      <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={member.fullName}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          member.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium">{member.fullName}</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          #{member.memberNumber}
                        </p>
                      </div>
                      <Badge
                        className="ml-auto"
                        variant={member.active ? "success" : "warning"}
                      >
                        {member.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-neutral-500 dark:text-neutral-400">
                          Tipo:
                        </span>{" "}
                        {getMemberTypeLabel(member.memberType)}
                      </div>
                      <div>
                        <span className="text-neutral-500 dark:text-neutral-400">
                          Inscripción:
                        </span>{" "}
                        {formatDate(member.registrationDate)}
                      </div>
                      <div className="col-span-2">
                        <span className="text-neutral-500 dark:text-neutral-400">
                          Email:
                        </span>{" "}
                        {member.email || "N/A"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}

          {filteredMembers.length === 0 && (
            <div className="text-center py-12 col-span-3">
              <p className="text-neutral-500 dark:text-neutral-400">
                No se encontraron socios que coincidan con los filtros aplicados.
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery("");
                  setMemberTypeFilter("all");
                  setActiveTab("active");
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MemberList;
