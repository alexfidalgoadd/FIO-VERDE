import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MemberWithUser, AccessLogWithMember, AccessType, TransactionWithItems } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  formatDate, 
  formatTime, 
  getMemberTypeLabel,
  formatCurrency 
} from "@/lib/utils";
import { 
  LuUser, 
  LuEdit, 
  LuDoorOpen, 
  LuClipboard, 
  LuCalendar,
  LuPhone,
  LuMail, 
  LuMapPin,
  LuLogIn, 
  LuLogOut,
  LuShoppingCart 
} from "react-icons/lu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MemberDetailProps {
  memberId: number;
  onEdit?: () => void;
}

export function MemberDetail({ memberId, onEdit }: MemberDetailProps) {
  const [activeTab, setActiveTab] = useState("details");

  const { data: member, isLoading: memberLoading } = useQuery<MemberWithUser>({
    queryKey: [`/api/members/${memberId}`],
  });

  const { data: accessLogs, isLoading: accessLogsLoading } = useQuery<AccessLogWithMember[]>({
    queryKey: [`/api/access/member/${memberId}`],
    enabled: !!memberId,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<TransactionWithItems[]>({
    queryKey: [`/api/transactions?memberId=${memberId}`],
    enabled: !!memberId,
  });

  return (
    <div className="space-y-6">
      {memberLoading ? (
        <LoadingMemberDetails />
      ) : member ? (
        <>
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 text-xl">
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={member.fullName}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  member.fullName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold">{member.fullName}</h1>
                <div className="flex items-center space-x-2">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    #{member.memberNumber}
                  </span>
                  <Badge variant={member.active ? "success" : "destructive"}>
                    {member.active ? "Activo" : "Inactivo"}
                  </Badge>
                  <Badge variant="outline">{getMemberTypeLabel(member.memberType)}</Badge>
                </div>
              </div>
            </div>
            {onEdit && (
              <Button onClick={onEdit} className="flex items-center">
                <LuEdit className="mr-2" />
                Editar
              </Button>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="details" className="flex items-center">
                <LuUser className="mr-2" />
                Detalles
              </TabsTrigger>
              <TabsTrigger value="access" className="flex items-center">
                <LuDoorOpen className="mr-2" />
                Accesos
              </TabsTrigger>
              <TabsTrigger value="dispensary" className="flex items-center">
                <LuClipboard className="mr-2" />
                Dispensas
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información personal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex">
                      <LuCalendar className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Fecha de nacimiento
                        </p>
                        <p className="font-medium">
                          {member.birthDate ? formatDate(member.birthDate) : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      <LuUser className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          DNI/NIE
                        </p>
                        <p className="font-medium">{member.dni}</p>
                      </div>
                    </div>
                    <div className="flex">
                      <LuPhone className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Teléfono
                        </p>
                        <p className="font-medium">{member.phone || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex">
                      <LuMail className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Email
                        </p>
                        <p className="font-medium">{member.email || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex">
                      <LuMapPin className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Dirección
                        </p>
                        <p className="font-medium">{member.address || "N/A"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Información del club</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex">
                      <LuCalendar className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Fecha de registro
                        </p>
                        <p className="font-medium">
                          {formatDate(member.registrationDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      <LuCalendar className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Última cuota
                        </p>
                        <p className="font-medium">
                          {member.lastFeeDate ? formatDate(member.lastFeeDate) : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      <LuCalendar className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Próxima cuota
                        </p>
                        <p className="font-medium">
                          {member.nextFeeDate ? formatDate(member.nextFeeDate) : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      <LuUser className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Tipo de socio
                        </p>
                        <p className="font-medium">
                          {getMemberTypeLabel(member.memberType)}
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      <LuClipboard className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" />
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Límite de dispensas
                        </p>
                        <p className="font-medium">
                          {member.dispensingLimit ? `${member.dispensingLimit}g` : "Según tipo de socio"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Información adicional</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Instagram
                        </p>
                        <p className="font-medium">{member.instagram || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Telegram
                        </p>
                        <p className="font-medium">{member.telegram || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Campo personalizado 1
                        </p>
                        <p className="font-medium">{member.customField1 || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Campo personalizado 2
                        </p>
                        <p className="font-medium">{member.customField2 || "N/A"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                        Preferencias de comunicación
                      </p>
                      <div className="flex space-x-2">
                        <Badge variant={member.allowEmail ? "outline" : "secondary"}>
                          Email: {member.allowEmail ? "Sí" : "No"}
                        </Badge>
                        <Badge variant={member.allowSms ? "outline" : "secondary"}>
                          SMS: {member.allowSms ? "Sí" : "No"}
                        </Badge>
                        <Badge variant={member.allowTelegram ? "outline" : "secondary"}>
                          Telegram: {member.allowTelegram ? "Sí" : "No"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                        Notas
                      </p>
                      <p className="bg-neutral-50 dark:bg-neutral-900 p-3 rounded-md">
                        {member.notes || "Sin notas"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="access" className="mt-4 space-y-6">
              {accessLogsLoading ? (
                <Card>
                  <CardContent className="p-4">
                    <Skeleton className="h-8 w-48 mb-4" />
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de accesos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {accessLogs && accessLogs.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Hora</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accessLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>
                                <div className="flex items-center">
                                  {log.accessType === AccessType.ENTRY ? (
                                    <LuLogIn className="text-green-500 dark:text-green-400 mr-2" />
                                  ) : (
                                    <LuLogOut className="text-red-500 dark:text-red-400 mr-2" />
                                  )}
                                  {log.accessType === AccessType.ENTRY ? "Entrada" : "Salida"}
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(log.timestamp)}</TableCell>
                              <TableCell>{formatTime(log.timestamp)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-neutral-500 dark:text-neutral-400">
                          No hay registros de acceso
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="dispensary" className="mt-4 space-y-6">
              {transactionsLoading ? (
                <Card>
                  <CardContent className="p-4">
                    <Skeleton className="h-8 w-48 mb-4" />
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de dispensas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactions && transactions.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Productos</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Fecha</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                <div className="flex items-center">
                                  <LuShoppingCart className="text-neutral-500 dark:text-neutral-400 mr-2" />
                                  {transaction.items.length > 1
                                    ? `${transaction.items.length} productos`
                                    : transaction.items[0]?.product.name || "N/A"}
                                </div>
                              </TableCell>
                              <TableCell>
                                {transaction.items.length > 1
                                  ? "Varias"
                                  : transaction.items[0]
                                  ? `${transaction.items[0].quantity}${transaction.items[0].product.unitType}`
                                  : "N/A"}
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(transaction.total)}
                              </TableCell>
                              <TableCell>
                                {formatDate(transaction.timestamp)} {formatTime(transaction.timestamp)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-neutral-500 dark:text-neutral-400">
                          No hay registros de dispensas
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-neutral-500 dark:text-neutral-400">Socio no encontrado</p>
          <Link href="/members">
            <Button variant="link" className="mt-2">
              Volver a la lista de socios
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function LoadingMemberDetails() {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="ml-4 space-y-2">
          <Skeleton className="h-8 w-64" />
          <div className="flex space-x-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex">
                <Skeleton className="h-5 w-5 mr-2" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-48" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex">
                <Skeleton className="h-5 w-5 mr-2" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-48" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MemberDetail;
