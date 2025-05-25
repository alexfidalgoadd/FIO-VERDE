import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  User, 
  Settings as SettingsIcon, 
  Building, 
  CreditCard, 
  Tag, 
  Save, 
  AlertTriangle,
  Users,
  Loader2
} from "lucide-react";

// Form schema for user settings
const userSettingsSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  name: z.string().min(1, "El nombre es requerido"),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
  confirmPassword: z.string().optional(),
}).refine(data => !data.newPassword || data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
}).refine(data => !data.newPassword || data.currentPassword, {
  message: "Se requiere la contraseña actual para cambiar a una nueva",
  path: ["currentPassword"],
});

// Form schema for club settings
const clubSettingsSchema = z.object({
  clubName: z.string().min(1, "El nombre del club es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  maxCapacity: z.coerce.number().min(1, "La capacidad máxima debe ser al menos 1"),
  logo: z.string().optional(),
  description: z.string().optional(),
});

// Form schema for member type settings
const memberTypeSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "El nombre del tipo es requerido"),
  dispenseLimitDaily: z.coerce.number().min(0, "El límite debe ser un número positivo").optional(),
  dispenseLimitMonthly: z.coerce.number().min(0, "El límite debe ser un número positivo").optional(),
  monthlyFee: z.coerce.number().min(0, "La cuota debe ser un número positivo").optional(),
  description: z.string().optional(),
});

interface MemberType {
  id: number;
  name: string;
  dispenseLimitDaily: number | null;
  dispenseLimitMonthly: number | null;
  monthlyFee: number;
  description: string | null;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("account");
  const [editingMemberTypeId, setEditingMemberTypeId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMemberTypeId, setDeletingMemberTypeId] = useState<number | null>(null);

  // User settings form
  const userForm = useForm<z.infer<typeof userSettingsSchema>>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      username: "",
      email: "",
      name: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Club settings form
  const clubForm = useForm<z.infer<typeof clubSettingsSchema>>({
    resolver: zodResolver(clubSettingsSchema),
    defaultValues: {
      clubName: "",
      address: "",
      email: "",
      phone: "",
      maxCapacity: 100,
      logo: "",
      description: "",
    },
  });

  // Member type form
  const memberTypeForm = useForm<z.infer<typeof memberTypeSchema>>({
    resolver: zodResolver(memberTypeSchema),
    defaultValues: {
      name: "",
      dispenseLimitDaily: 0,
      dispenseLimitMonthly: 0,
      monthlyFee: 0,
      description: "",
    },
  });

  // Fetch user settings
  const { data: userSettings, isLoading: isLoadingUserSettings } = useQuery({
    queryKey: ["/api/settings/user"],
    onSuccess: (data) => {
      if (data) {
        userForm.reset({
          username: data.username,
          email: data.email,
          name: data.name,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    },
  });

  // Fetch club settings
  const { data: clubSettings, isLoading: isLoadingClubSettings } = useQuery({
    queryKey: ["/api/settings/club"],
    onSuccess: (data) => {
      if (data) {
        clubForm.reset({
          clubName: data.clubName,
          address: data.address,
          email: data.email,
          phone: data.phone || "",
          maxCapacity: data.maxCapacity,
          logo: data.logo || "",
          description: data.description || "",
        });
      }
    },
  });

  // Fetch member types
  const { data: memberTypes, isLoading: isLoadingMemberTypes, refetch: refetchMemberTypes } = useQuery<MemberType[]>({
    queryKey: ["/api/member-types"],
  });

  // Update user settings mutation
  const updateUserSettings = useMutation({
    mutationFn: async (data: z.infer<typeof userSettingsSchema>) => {
      return apiRequest("PATCH", "/api/settings/user", data);
    },
    onSuccess: () => {
      toast({
        title: "Configuración actualizada",
        description: "Tus datos han sido actualizados correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    },
  });

  // Update club settings mutation
  const updateClubSettings = useMutation({
    mutationFn: async (data: z.infer<typeof clubSettingsSchema>) => {
      return apiRequest("PATCH", "/api/settings/club", data);
    },
    onSuccess: () => {
      toast({
        title: "Configuración actualizada",
        description: "La configuración del club ha sido actualizada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/club"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración del club",
        variant: "destructive",
      });
    },
  });

  // Create member type mutation
  const createMemberType = useMutation({
    mutationFn: async (data: z.infer<typeof memberTypeSchema>) => {
      return apiRequest("POST", "/api/member-types", data);
    },
    onSuccess: () => {
      toast({
        title: "Tipo de socio creado",
        description: "El tipo de socio ha sido creado correctamente",
      });
      memberTypeForm.reset({
        name: "",
        dispenseLimitDaily: 0,
        dispenseLimitMonthly: 0,
        monthlyFee: 0,
        description: "",
      });
      refetchMemberTypes();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el tipo de socio",
        variant: "destructive",
      });
    },
  });

  // Update member type mutation
  const updateMemberType = useMutation({
    mutationFn: async (data: z.infer<typeof memberTypeSchema>) => {
      return apiRequest("PATCH", `/api/member-types/${data.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Tipo de socio actualizado",
        description: "El tipo de socio ha sido actualizado correctamente",
      });
      setEditingMemberTypeId(null);
      memberTypeForm.reset({
        name: "",
        dispenseLimitDaily: 0,
        dispenseLimitMonthly: 0,
        monthlyFee: 0,
        description: "",
      });
      refetchMemberTypes();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el tipo de socio",
        variant: "destructive",
      });
    },
  });

  // Delete member type mutation
  const deleteMemberType = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/member-types/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Tipo de socio eliminado",
        description: "El tipo de socio ha sido eliminado correctamente",
      });
      setShowDeleteConfirm(false);
      setDeletingMemberTypeId(null);
      refetchMemberTypes();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el tipo de socio",
        variant: "destructive",
      });
    },
  });

  const onSubmitUserSettings = (data: z.infer<typeof userSettingsSchema>) => {
    updateUserSettings.mutate(data);
  };

  const onSubmitClubSettings = (data: z.infer<typeof clubSettingsSchema>) => {
    updateClubSettings.mutate(data);
  };

  const onSubmitMemberType = (data: z.infer<typeof memberTypeSchema>) => {
    if (editingMemberTypeId) {
      updateMemberType.mutate({ ...data, id: editingMemberTypeId });
    } else {
      createMemberType.mutate(data);
    }
  };

  const startEditingMemberType = (memberType: MemberType) => {
    setEditingMemberTypeId(memberType.id);
    memberTypeForm.reset({
      id: memberType.id,
      name: memberType.name,
      dispenseLimitDaily: memberType.dispenseLimitDaily || 0,
      dispenseLimitMonthly: memberType.dispenseLimitMonthly || 0,
      monthlyFee: memberType.monthlyFee,
      description: memberType.description || "",
    });
  };

  const cancelEditingMemberType = () => {
    setEditingMemberTypeId(null);
    memberTypeForm.reset({
      name: "",
      dispenseLimitDaily: 0,
      dispenseLimitMonthly: 0,
      monthlyFee: 0,
      description: "",
    });
  };

  const confirmDeleteMemberType = (id: number) => {
    setDeletingMemberTypeId(id);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Configuración</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2" />
            Cuenta
          </TabsTrigger>
          <TabsTrigger value="club">
            <Building className="h-4 w-4 mr-2" />
            Club
          </TabsTrigger>
          <TabsTrigger value="membertypes">
            <Tag className="h-4 w-4 mr-2" />
            Tipos de Socio
          </TabsTrigger>
        </TabsList>
        
        {/* Account Settings Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Cuenta</CardTitle>
              <CardDescription>
                Gestiona tu información personal y contraseña
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUserSettings ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Form {...userForm}>
                  <form onSubmit={userForm.handleSubmit(onSubmitUserSettings)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={userForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre de Usuario</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={userForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre Completo</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={userForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <h3 className="text-lg font-medium mb-4">Cambiar Contraseña</h3>
                    
                    <div className="space-y-4">
                      <FormField
                        control={userForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña Actual</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={userForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nueva Contraseña</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormDescription>
                              Deja en blanco si no deseas cambiar tu contraseña
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={userForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateUserSettings.isPending}
                        className="flex gap-2"
                      >
                        {updateUserSettings.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        <Save className="h-4 w-4" />
                        Guardar Cambios
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Club Settings Tab */}
        <TabsContent value="club">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Club</CardTitle>
              <CardDescription>
                Gestiona la información general del club
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingClubSettings ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Form {...clubForm}>
                  <form onSubmit={clubForm.handleSubmit(onSubmitClubSettings)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={clubForm.control}
                        name="clubName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Club</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={clubForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email de Contacto</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={clubForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={clubForm.control}
                        name="maxCapacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Aforo Máximo</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" />
                            </FormControl>
                            <FormDescription>
                              Número máximo de socios permitidos simultáneamente
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={clubForm.control}
                        name="logo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL del Logo</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              URL de la imagen del logo del club
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="md:col-span-2">
                        <FormField
                          control={clubForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dirección</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <FormField
                          control={clubForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field}
                                  rows={4}
                                  placeholder="Describe tu club..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateClubSettings.isPending}
                        className="flex gap-2"
                      >
                        {updateClubSettings.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        <Save className="h-4 w-4" />
                        Guardar Cambios
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Member Types Tab */}
        <TabsContent value="membertypes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Socio</CardTitle>
                <CardDescription>
                  Lista de tipos de socio configurados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMemberTypes ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : memberTypes && memberTypes.length > 0 ? (
                  <div className="space-y-4">
                    {memberTypes.map(memberType => (
                      <div 
                        key={memberType.id} 
                        className="border rounded-md p-4 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{memberType.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Cuota: {memberType.monthlyFee.toFixed(2)} €/mes
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => startEditingMemberType(memberType)}
                            >
                              Editar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-destructive border-destructive hover:bg-destructive/10"
                              onClick={() => confirmDeleteMemberType(memberType.id)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                          {memberType.dispenseLimitDaily !== null && (
                            <p>Límite diario: {memberType.dispenseLimitDaily}g</p>
                          )}
                          {memberType.dispenseLimitMonthly !== null && (
                            <p>Límite mensual: {memberType.dispenseLimitMonthly}g</p>
                          )}
                        </div>
                        
                        {memberType.description && (
                          <p className="text-sm text-muted-foreground">{memberType.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">No hay tipos de socio configurados</p>
                  </div>
                )}
                
                {showDeleteConfirm && (
                  <div className="mt-6 border border-destructive rounded-md p-4 bg-destructive/10">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 mr-2" />
                      <div>
                        <h4 className="font-medium text-destructive">¿Eliminar tipo de socio?</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Esta acción no se puede deshacer. Los socios asignados a este tipo quedarán sin tipo asignado.
                        </p>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowDeleteConfirm(false)}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deletingMemberTypeId && deleteMemberType.mutate(deletingMemberTypeId)}
                            disabled={deleteMemberType.isPending}
                          >
                            {deleteMemberType.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Confirmar Eliminación
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingMemberTypeId ? "Editar Tipo de Socio" : "Crear Nuevo Tipo de Socio"}
                </CardTitle>
                <CardDescription>
                  {editingMemberTypeId 
                    ? "Modifica los detalles del tipo de socio" 
                    : "Define un nuevo tipo de socio con sus características"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...memberTypeForm}>
                  <form onSubmit={memberTypeForm.handleSubmit(onSubmitMemberType)} className="space-y-4">
                    <FormField
                      control={memberTypeForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ej: Honorífico, Regular, Medicinal..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={memberTypeForm.control}
                        name="dispenseLimitDaily"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Límite Diario (g)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0" 
                                step="0.1" 
                                placeholder="0 = sin límite"
                              />
                            </FormControl>
                            <FormDescription>
                              Gramos máximos por día (0 = sin límite)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={memberTypeForm.control}
                        name="dispenseLimitMonthly"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Límite Mensual (g)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0" 
                                step="0.1" 
                                placeholder="0 = sin límite"
                              />
                            </FormControl>
                            <FormDescription>
                              Gramos máximos por mes (0 = sin límite)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={memberTypeForm.control}
                      name="monthlyFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cuota Mensual (€)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              placeholder="Ej: 20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={memberTypeForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              rows={3}
                              placeholder="Describe este tipo de socio..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end gap-2 pt-2">
                      {editingMemberTypeId && (
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={cancelEditingMemberType}
                        >
                          Cancelar
                        </Button>
                      )}
                      <Button 
                        type="submit" 
                        disabled={createMemberType.isPending || updateMemberType.isPending}
                      >
                        {(createMemberType.isPending || updateMemberType.isPending) && (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        )}
                        {editingMemberTypeId ? "Actualizar" : "Crear"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
