import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { MemberType, Role } from "@shared/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj);
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
}

export function isToday(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear();
}

export function formatTimeAgo(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Justo ahora';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Hace ${diffInHours} h`;
  
  if (isToday(date)) {
    return `Hoy ${formatTime(date)}`;
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (dateObj.getDate() === yesterday.getDate() &&
      dateObj.getMonth() === yesterday.getMonth() &&
      dateObj.getFullYear() === yesterday.getFullYear()) {
    return `Ayer ${formatTime(date)}`;
  }
  
  return formatDate(date);
}

export function getMemberTypeLabel(type: MemberType | null | undefined): string {
  if (!type) return 'Regular';
  
  switch (type) {
    case MemberType.REGULAR:
      return 'Regular';
    case MemberType.HONORIFIC:
      return 'Honorífico';
    case MemberType.THERAPEUTIC:
      return 'Terapéutico';
    case MemberType.MEDICAL:
      return 'Paciente Médico';
    default:
      return 'Desconocido';
  }
}

export function getRoleLabel(role: Role | null | undefined): string {
  if (!role) return 'Miembro';
  
  switch (role) {
    case Role.ADMIN:
      return 'Administrador';
    case Role.WORKER:
      return 'Trabajador';
    case Role.MEMBER:
      return 'Miembro';
    default:
      return 'Desconocido';
  }
}

export function getStatusBadgeColor(status: boolean | string): {
  bgColor: string;
  textColor: string;
} {
  const isActive = typeof status === 'boolean' ? status : status === 'active';
  
  return isActive
    ? { bgColor: 'bg-green-100', textColor: 'text-green-800' }
    : { bgColor: 'bg-amber-100', textColor: 'text-amber-800' };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function calculateDiscountedPrice(
  price: number,
  quantity: number,
  discount: number = 0
): number {
  const subtotal = price * quantity;
  return subtotal - (subtotal * discount / 100);
}
