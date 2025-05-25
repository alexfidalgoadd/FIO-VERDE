import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Save, 
  User, 
  Calendar, 
  Clock,
  CreditCard,
  Clipboard,
  Tag
} from "lucide-react";
import { insertMemberSchema, MemberTypeObject } from "@shared/schema";

// Extend the schema with any additional validation we need
const memberFormSchema = insertMemberSchema.extend({
  confirmDni: z.string().optional(),
}).refine(
  (data) => !data.confirmDni || data.dni === data.confirmDni,
  {
    message: "Los DNI no coinciden",
    path: ["confirmDni"],
  }
);

type MemberFormValues = z.infer<typeof memberFormSchema>;

export default function MemberDetail() {
  const [activeTab, setActiveTab] = useState("details");
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const isNew = id === "new";

  // Set up form
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      memberNumber: "",
      address: "",
      phone: "",
      dni: "",
      email: "",
      memberTypeId: null,
      rfidNumber: null,
      active: true,
      notes: "",
    },
  });

  // Fetch member types for dropdown
  const { data: memberTypes } = useQuery<MemberTypeObject[]>({
    queryKey: ["/api/member-types"],
  });

  // Fetch member data if editing existing member
  const { data: member, isLoading } = useQuery({
    queryKey: ["/api/members", id],
    enabled: !isNew && !!id,
    queryFn: async () => {
      const response = await fetch(`/api/members/${id}`);
      if (!response.ok) throw new Error("Failed to fetch member");
      return response.json();
    },
    onSuccess: (data) => {
      if (data) {
        // Reset form with existing member data
        form.reset({
          firstName: data.firstName,
          lastName: data.lastName,
          memberNumber: data.memberNumber,
          address: data.address || "",
          phone: data.phone || "",
          dni: data.dni,
          birthDate: data.birthDate ? format(new Date(data.birthDate), 'yyyy-MM-dd') : undefined,
          email: data.email || "",
          memberTypeId: data.memberTypeId,
          rfidNumber: data.rfidNumber,
          active: data.active,
          notes: data.notes || "",
        });
      }
    }
  });

  // Create or update member
  const mutation = useMutation({
    mutationFn: async (values: MemberFormValues) => {
      if (isNew) {
        return apiRequest("POST", "/api/members", values);
      } else {
        return apiRequest("PATCH", `/api/members/${id}`, values);
      }
    },
    onSuccess: (data) => {
      toast({
        title: isNew ? "Socio creado" : "Socio actualizado",
        description: isNew 
          ? `Se ha creado un nuevo socio con número ${form.getValues().memberNumber}` 
          : `Se han guardado los cambios del socio ${form.getValues().firstName} ${form.getValues().lastName}`,
      });
      
      if (isNew && data.id) {
        navigate(`/members/${data.id}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/members", id] });
        queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      }
    },
    onError: (error) => {
      console.error("Error creating/updating member:", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al guardar los datos del socio",
        variant: "destructive",
      });
    },
  });

  // Generate a new member number when creating a new member
  useEffect(() => {
    if (isNew) {
      // Generate a unique member number - in a real app, this would be fetched from the backend
      const randomNumber = Math.floor(10000 + Math.random() * 90000);
      form.setValue("memberNumber", `S-${randomNumber}`);
    }
  }, [isNew, form]);

  // Form submission handler
  const onSubmit = (values: MemberFormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/members")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isNew ? "Nuevo Socio" : isLoading ? "Cargando..." : `${member?.firstName} ${member?.lastName}`}
          </h1>
        </div>
        
        {!isNew && member && (
          <Avatar className="h-10 w-10">
            <AvatarImage src={member.photo || ""} alt={`${member.firstName} ${member.lastName}`} />
            <AvatarFallback>
              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">
            <User className="h-4 w-4 mr-2" />
            Detalles
          </TabsTrigger>
          {!isNew && (
            <>
              <TabsTrigger value="membership" disabled={isNew}>
                <Tag className="h-4 w-4 mr-2" />
                Membresía
              </TabsTrigger>
              <TabsTrigger value="history" disabled={isNew}>
                <Clock className="h-4 w-4 mr-2" />
                Historial
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Información del Socio</CardTitle>
              <CardDescription>
                Introduce los datos personales del socio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apellidos</FormLabel>
                            <FormControl>
                              <Input placeholder="Apellidos" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="memberNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Socio</FormLabel>
                            <FormControl>
                              <Input placeholder="S-12345" {...field} readOnly={true} />
                            </FormControl>
                            <FormDescription>
                              Número de socio generado automáticamente
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dni"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>DNI/NIE</FormLabel>
                            <FormControl>
                              <Input placeholder="12345678A" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input placeholder="600 123 456" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de Nacimiento</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="memberTypeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Socio</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(Number(value))}
                              value={field.value?.toString() || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {memberTypes?.map((type) => (
                                  <SelectItem key={type.id} value={type.id.toString()}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="rfidNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número RFID</FormLabel>
                            <FormControl>
                              <Input placeholder="12345678" 
                                {...field} 
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value || null)}
                              />
                            </FormControl>
                            <FormDescription>
                              Opcional - Asociar tarjeta RFID para control de acceso
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dirección</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Dirección completa" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notas</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Notas adicionales" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {!isNew && (
                      <FormField
                        control={form.control}
                        name="active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Estado Activo</FormLabel>
                              <FormDescription>
                                Los socios inactivos no podrán acceder al club ni dispensar
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={mutation.isPending} className="flex items-center">
                        {mutation.isPending ? (
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {isNew ? "Crear Socio" : "Guardar Cambios"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {!isNew && (
          <TabsContent value="membership">
            <Card>
              <CardHeader>
                <CardTitle>Información de Membresía</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Fecha de Alta</Label>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{member?.joinDate ? format(new Date(member.joinDate), 'dd MMMM yyyy', { locale: es }) : '-'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Membresía</Label>
                    <div className="flex items-center">
                      <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{memberTypes?.find(t => t.id === member?.memberTypeId)?.name || 'Desconocido'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Último Pago de Cuota</Label>
                    <div className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{member?.lastFeeDate ? format(new Date(member.lastFeeDate), 'dd MMMM yyyy', { locale: es }) : 'Pendiente'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Próximo Pago de Cuota</Label>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{member?.nextFeeDate ? format(new Date(member.nextFeeDate), 'dd MMMM yyyy', { locale: es }) : 'No definido'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/50 p-4 flex justify-end">
                <Button variant="outline">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Registrar Pago de Cuota
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        )}

        {!isNew && (
          <TabsContent value="history">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Dispensas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-6">
                    No hay dispensas recientes para este socio
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Accesos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-6">
                    No hay registros de acceso recientes para este socio
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}