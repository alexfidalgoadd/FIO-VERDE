import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MemberType, insertMemberSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn, getMemberTypeLabel } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

// Extend member schema with additional validation
const memberFormSchema = insertMemberSchema.extend({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  dni: z.string().min(8, "El DNI debe tener al menos 8 caracteres"),
  memberType: z.nativeEnum(MemberType).default(MemberType.REGULAR),
  birthDate: z.date().optional().nullable(),
  email: z.string().email("Email no válido").optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  photoUrl: z.string().url("URL no válida").optional().nullable(),
  instagram: z.string().optional().nullable(),
  telegram: z.string().optional().nullable(),
  customField1: z.string().optional().nullable(),
  customField2: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  allowEmail: z.boolean().default(false),
  allowSms: z.boolean().default(false),
  allowTelegram: z.boolean().default(false),
  active: z.boolean().default(true),
  rfidTag: z.string().optional().nullable(),
  dispensingLimit: z.coerce.number().optional().nullable(),
});

interface MemberFormProps {
  initialValues?: any;
  onSuccess?: () => void;
}

export function MemberForm({ initialValues, onSuccess }: MemberFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialValues;

  const { data: memberTypes } = useQuery({
    queryKey: ["/api/member-types"],
  });

  const form = useForm<z.infer<typeof memberFormSchema>>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: initialValues || {
      fullName: "",
      dni: "",
      memberType: MemberType.REGULAR,
      birthDate: null,
      email: "",
      phone: "",
      address: "",
      photoUrl: "",
      instagram: "",
      telegram: "",
      customField1: "",
      customField2: "",
      notes: "",
      allowEmail: false,
      allowSms: false,
      allowTelegram: false,
      active: true,
      rfidTag: "",
      dispensingLimit: null,
    },
  });

  async function onSubmit(values: z.infer<typeof memberFormSchema>) {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await apiRequest("PUT", `/api/members/${initialValues.id}`, values);
        toast({
          title: "Socio actualizado",
          description: "El socio ha sido actualizado correctamente.",
        });
      } else {
        await apiRequest("POST", "/api/members", values);
        form.reset();
        toast({
          title: "Socio creado",
          description: "El socio ha sido creado correctamente.",
        });
      }
      
      // Invalidate members query to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al guardar el socio.",
        variant: "destructive",
      });
      console.error("Error saving member:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información básica</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre y apellidos" {...field} />
                  </FormControl>
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
                    <Input placeholder="12345678X" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="memberType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de socio</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(MemberType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {getMemberTypeLabel(type)}
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
              name="birthDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de nacimiento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "P", { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                    <Input 
                      type="email" 
                      placeholder="ejemplo@email.com" 
                      {...field}
                      value={field.value || ""}
                    />
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
                    <Input 
                      placeholder="666 555 444" 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Calle, número, código postal, ciudad" 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información adicional</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de la foto</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://ejemplo.com/foto.jpg" 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rfidTag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código RFID</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Código de la tarjeta RFID" 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="@usuario" 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telegram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telegram</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="@usuario" 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customField1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campo personalizado 1</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customField2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campo personalizado 2</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dispensingLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Límite de dispensas (g)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      step="0.1" 
                      min="0" 
                      placeholder="Límite personalizado" 
                      {...field}
                      value={field.value === null ? "" : field.value}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Deja en blanco para usar el límite predeterminado del tipo de socio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Información adicional sobre el socio" 
                      className="min-h-[120px]" 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferencias de comunicación</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <FormField
              control={form.control}
              name="allowEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Email</FormLabel>
                    <FormDescription>
                      Recibir comunicaciones por email
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowSms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>SMS</FormLabel>
                    <FormDescription>
                      Recibir comunicaciones por SMS
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowTelegram"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Telegram</FormLabel>
                    <FormDescription>
                      Recibir comunicaciones por Telegram
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Estado de la cuenta</FormLabel>
                <FormDescription>
                  Un socio inactivo no puede acceder al club ni realizar dispensas
                </FormDescription>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${field.value ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {field.value ? "Activo" : "Inactivo"}
                </span>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess && onSuccess()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default MemberForm;
