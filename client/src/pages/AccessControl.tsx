import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  DoorOpen, 
  LogOut, 
  Search, 
  UserCheck, 
  UserX, 
  AlertCircle,
  Users,
  Clock
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MemberAccess } from "@shared/schema";

interface MemberWithRFID {
  id: number;
  memberNumber: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  rfidNumber: string | null;
  active: boolean;
  memberTypeName: string;
}

interface MemberAccessWithDetails extends MemberAccess {
  member: {
    id: number;
    firstName: string;
    lastName: string;
    memberNumber: string;
    photo: string | null;
  };
}

export default function AccessControl() {
  const [searchTerm, setSearchTerm] = useState("");
  const [rfidInput, setRfidInput] = useState("");
  const [currentTab, setCurrentTab] = useState("manual");
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [accessAction, setAccessAction] = useState<"entry" | "exit">("entry");
  const [currentCount, setCurrentCount] = useState(0);
  const [maxCapacity, setMaxCapacity] = useState(100);
  const [showCapacityReachedDialog, setShowCapacityReachedDialog] = useState(false);

  // Get all member accesses for today
  const { data: accesses, isLoading: isLoadingAccesses, refetch: refetchAccesses } = useQuery<MemberAccessWithDetails[]>({
    queryKey: ["/api/access/today"],
  });

  // Search members by ID, name, or member number
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery<MemberWithRFID[]>({
    queryKey: ["/api/members/search", searchTerm],
    enabled: searchTerm.length > 2,
  });

  // Get member details by RFID
  const { data: rfidMember, isLoading: isLoadingRFID } = useQuery<MemberWithRFID>({
    queryKey: ["/api/members/rfid", rfidInput],
    enabled: rfidInput.length > 0,
  });

  // Get selected member details
  const { data: selectedMember } = useQuery<MemberWithRFID>({
    queryKey: ["/api/members", selectedMemberId],
    enabled: selectedMemberId !== null,
  });

  // Get club statistics (current members, max capacity)
  const { data: clubStats, isLoading: isLoadingStats } = useQuery<{
    currentCount: number;
    maxCapacity: number;
  }>({
    queryKey: ["/api/access/stats"],
  });

  // Update current count and max capacity when club stats are loaded
  useEffect(() => {
    if (clubStats) {
      setCurrentCount(clubStats.currentCount);
      setMaxCapacity(clubStats.maxCapacity);
    }
  }, [clubStats]);

  // Simulate RFID reader focus
  useEffect(() => {
    const rfidInput = document.getElementById("rfid-input");
    if (currentTab === "rfid" && rfidInput) {
      rfidInput.focus();
    }
  }, [currentTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.length > 2) {
      // The query will automatically run due to the dependency
    } else {
      toast({
        title: "Búsqueda muy corta",
        description: "Por favor ingresa al menos 3 caracteres para buscar",
        variant: "destructive"
      });
    }
  };

  const handleRFIDSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rfidInput && rfidMember) {
      handleMemberAccess(rfidMember.id, "entry");
      setRfidInput("");
    }
  };

  const selectMemberForAccess = (member: MemberWithRFID, action: "entry" | "exit") => {
    setSelectedMemberId(member.id);
    setAccessAction(action);
    setShowMemberDialog(true);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'HH:mm:ss', { locale: es });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleMemberAccess = async (memberId: number, accessType: "entry" | "exit") => {
    // Check if club is at capacity for entry
    if (accessType === "entry" && currentCount >= maxCapacity) {
      setShowCapacityReachedDialog(true);
      return;
    }

    try {
      await apiRequest("POST", "/api/access", {
        memberId,
        accessType
      });

      toast({
        title: "Acceso registrado",
        description: `${accessType === "entry" ? "Entrada" : "Salida"} registrada correctamente`,
      });

      // Update current count
      if (accessType === "entry") {
        setCurrentCount(prev => prev + 1);
      } else {
        setCurrentCount(prev => Math.max(0, prev - 1));
      }

      // Refresh access list
      refetchAccesses();
      
      // Reset state
      setShowMemberDialog(false);
      setSelectedMemberId(null);
      setAccessAction("entry");
      setSearchTerm("");
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/access/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/access/stats"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el acceso",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Control de Acceso</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          {/* Capacity Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Aforo del Club
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center">
                <div className="relative w-40 h-40 mb-4">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="10"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke={currentCount >= maxCapacity ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                      strokeWidth="10"
                      strokeDasharray={`${(currentCount / maxCapacity) * 283} 283`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{currentCount}</span>
                    <span className="text-sm text-muted-foreground">de {maxCapacity}</span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {currentCount >= maxCapacity 
                    ? "¡Aforo máximo alcanzado!" 
                    : `${maxCapacity - currentCount} plazas disponibles`}
                </p>
                
                <div className="grid grid-cols-2 gap-4 w-full">
                  <Button className="bg-green-500 hover:bg-green-600">
                    <DoorOpen className="mr-2 h-4 w-4" />
                    Entradas: {accesses?.filter(a => a.accessType === "entry").length || 0}
                  </Button>
                  <Button className="bg-red-500 hover:bg-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Salidas: {accesses?.filter(a => a.accessType === "exit").length || 0}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access Methods Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Registrar Acceso</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs 
                defaultValue="manual" 
                value={currentTab} 
                onValueChange={setCurrentTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                  <TabsTrigger value="rfid">RFID</TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual">
                  <form onSubmit={handleSearchSubmit} className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Buscar por nombre, nº socio, o DNI..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Button type="submit">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="border rounded-md">
                      {searchTerm.length > 2 && (
                        isLoadingSearch ? (
                          <div className="p-4 space-y-3">
                            {Array(3).fill(0).map((_, i) => (
                              <div key={i} className="flex items-center">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="ml-3 space-y-1 flex-1">
                                  <Skeleton className="h-4 w-24" />
                                  <Skeleton className="h-3 w-16" />
                                </div>
                                <Skeleton className="h-8 w-8 rounded" />
                                <Skeleton className="h-8 w-8 rounded ml-1" />
                              </div>
                            ))}
                          </div>
                        ) : searchResults && searchResults.length > 0 ? (
                          <div className="divide-y">
                            {searchResults.map(member => (
                              <div key={member.id} className="p-3 flex items-center">
                                <Avatar>
                                  <AvatarImage 
                                    src={member.photo || ""} 
                                    alt={`${member.firstName} ${member.lastName}`} 
                                  />
                                  <AvatarFallback>
                                    {getInitials(member.firstName, member.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="ml-3 flex-1">
                                  <p className="font-medium">{member.firstName} {member.lastName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    #{member.memberNumber} • {member.memberTypeName}
                                  </p>
                                </div>
                                
                                <div className="flex gap-1">
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-100"
                                    onClick={() => selectMemberForAccess(member, "entry")}
                                    disabled={!member.active}
                                  >
                                    <DoorOpen className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100"
                                    onClick={() => selectMemberForAccess(member, "exit")}
                                    disabled={!member.active}
                                  >
                                    <LogOut className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 text-center">
                            <p className="text-muted-foreground">No se encontraron socios</p>
                          </div>
                        )
                      )}
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="rfid">
                  <form onSubmit={handleRFIDSubmit} className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        id="rfid-input"
                        placeholder="Escanear tarjeta RFID..."
                        value={rfidInput}
                        onChange={(e) => setRfidInput(e.target.value)}
                        autoFocus
                      />
                      <Button type="submit" disabled={!rfidInput || !rfidMember}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      {rfidInput ? (
                        isLoadingRFID ? (
                          <div className="flex items-center">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="ml-3 space-y-1 flex-1">
                              <Skeleton className="h-5 w-32" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                        ) : rfidMember ? (
                          <div className="flex items-center">
                            <Avatar className="h-12 w-12">
                              <AvatarImage 
                                src={rfidMember.photo || ""} 
                                alt={`${rfidMember.firstName} ${rfidMember.lastName}`} 
                              />
                              <AvatarFallback className="text-lg">
                                {getInitials(rfidMember.firstName, rfidMember.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-3 flex-1">
                              <p className="font-medium">{rfidMember.firstName} {rfidMember.lastName}</p>
                              <p className="text-sm">
                                #{rfidMember.memberNumber} • {rfidMember.memberTypeName}
                              </p>
                              <Badge 
                                variant={rfidMember.active ? "success" : "destructive"}
                                className="mt-1"
                              >
                                {rfidMember.active ? "Activo" : "Inactivo"}
                              </Badge>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleMemberAccess(rfidMember.id, "entry")}
                                variant="outline"
                                className="text-green-500 border-green-500"
                                disabled={!rfidMember.active}
                              >
                                <DoorOpen className="h-4 w-4 mr-1" />
                                Entrada
                              </Button>
                              <Button 
                                onClick={() => handleMemberAccess(rfidMember.id, "exit")}
                                variant="outline"
                                className="text-red-500 border-red-500"
                                disabled={!rfidMember.active}
                              >
                                <LogOut className="h-4 w-4 mr-1" />
                                Salida
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="rounded-full bg-amber-100 p-3">
                              <AlertCircle className="h-6 w-6 text-amber-500" />
                            </div>
                            <div className="ml-3">
                              <p className="font-medium">Tarjeta no reconocida</p>
                              <p className="text-sm text-muted-foreground">
                                RFID: {rfidInput}
                              </p>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="py-4 text-center">
                          <DoorOpen className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-muted-foreground">Escanea una tarjeta RFID para registrar acceso</p>
                        </div>
                      )}
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Registro de Accesos de Hoy
              </CardTitle>
              <CardDescription>
                Listado de entradas y salidas registradas en el día
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAccesses ? (
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="ml-3 space-y-2 flex-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-5 w-20 ml-4" />
                    </div>
                  ))}
                </div>
              ) : accesses && accesses.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Socio</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Hace</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accesses.map(access => (
                        <TableRow key={access.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8">
                                <AvatarImage 
                                  src={access.member.photo || ""} 
                                  alt={`${access.member.firstName} ${access.member.lastName}`} 
                                />
                                <AvatarFallback>
                                  {getInitials(access.member.firstName, access.member.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="ml-3">
                                <p className="font-medium">{access.member.firstName} {access.member.lastName}</p>
                                <p className="text-xs text-muted-foreground">#{access.member.memberNumber}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={access.accessType === "entry" ? "success" : "destructive"}
                            >
                              {access.accessType === "entry" ? (
                                <>
                                  <DoorOpen className="h-3 w-3 mr-1" />
                                  Entrada
                                </>
                              ) : (
                                <>
                                  <LogOut className="h-3 w-3 mr-1" />
                                  Salida
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatTime(access.timestamp)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatTimeAgo(access.timestamp)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No hay registros de acceso para hoy</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Member Access Dialog */}
      <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {accessAction === "entry" ? "Registrar Entrada" : "Registrar Salida"}
            </DialogTitle>
            <DialogDescription>
              {accessAction === "entry" 
                ? "Confirma la entrada del socio al club" 
                : "Confirma la salida del socio del club"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMember && (
            <div className="py-4 flex items-center">
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={selectedMember.photo || ""} 
                  alt={`${selectedMember.firstName} ${selectedMember.lastName}`} 
                />
                <AvatarFallback className="text-xl">
                  {getInitials(selectedMember.firstName, selectedMember.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4">
                <h3 className="text-lg font-medium">{selectedMember.firstName} {selectedMember.lastName}</h3>
                <p className="text-muted-foreground">#{selectedMember.memberNumber}</p>
                <Badge 
                  variant={selectedMember.active ? "success" : "destructive"}
                  className="mt-1"
                >
                  {selectedMember.active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-center py-2">
            {accessAction === "entry" ? (
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                <DoorOpen className="h-6 w-6 text-green-500" />
              </div>
            ) : (
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                <LogOut className="h-6 w-6 text-red-500" />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMemberDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedMemberId && handleMemberAccess(selectedMemberId, accessAction)}
              variant={accessAction === "entry" ? "default" : "destructive"}
            >
              {accessAction === "entry" ? "Confirmar Entrada" : "Confirmar Salida"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Capacity Reached Dialog */}
      <Dialog open={showCapacityReachedDialog} onOpenChange={setShowCapacityReachedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aforo Máximo Alcanzado</DialogTitle>
            <DialogDescription>
              No se puede registrar más entradas en este momento porque se ha alcanzado el aforo máximo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center">
              <Users className="h-8 w-8 text-amber-500" />
            </div>
            <p className="font-medium">Aforo actual: {currentCount}/{maxCapacity}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Debe salir algún socio antes de permitir nuevas entradas.
            </p>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowCapacityReachedDialog(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
