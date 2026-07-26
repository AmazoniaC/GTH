import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea un valor numérico como pesos colombianos. */
export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? Number(value) : value ?? 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(num || 0);
}

export function formatNumber(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? Number(value) : value ?? 0;
  return new Intl.NumberFormat('es-CO').format(num || 0);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  // Las fechas se almacenan como fecha-sin-hora (medianoche UTC). Formateamos
  // en UTC para evitar que la zona horaria de Colombia (UTC-5) reste un día.
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(value));
}

/** Convierte una fecha ISO a formato yyyy-MM-dd para inputs tipo date. */
export function toDateInput(value: string | Date | null | undefined): string {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export function getInitials(first?: string, last?: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
}
