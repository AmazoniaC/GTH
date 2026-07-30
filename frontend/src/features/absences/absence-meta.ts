import type { AbsenceStatus } from '@/types';

/**
 * Metadatos de los tipos de ausencia del sistema (espejo de las reglas del
 * backend). Sirven para pistas de la UI: agrupación, conteo de días y qué
 * tipos requieren datos de soporte (EPS/ARL). Los tipos personalizados que
 * no estén aquí usan un comportamiento neutro.
 */
export type AbsenceGroup = 'VACATION' | 'INCAPACITY' | 'LICENSE' | 'PERMIT';

export interface AbsenceTypeMeta {
  group: AbsenceGroup;
  dayCount: 'BUSINESS' | 'CALENDAR';
  requiresEntity?: boolean;
  consumesVacation?: boolean;
}

export const ABSENCE_META: Record<string, AbsenceTypeMeta> = {
  VACATION: { group: 'VACATION', dayCount: 'BUSINESS', consumesVacation: true },
  SICK_GENERAL: { group: 'INCAPACITY', dayCount: 'CALENDAR', requiresEntity: true },
  SICK_LABOR: { group: 'INCAPACITY', dayCount: 'CALENDAR', requiresEntity: true },
  LICENSE_MATERNITY: { group: 'LICENSE', dayCount: 'CALENDAR', requiresEntity: true },
  LICENSE_PATERNITY: { group: 'LICENSE', dayCount: 'CALENDAR', requiresEntity: true },
  LICENSE_BEREAVEMENT: { group: 'LICENSE', dayCount: 'BUSINESS' },
  LICENSE_UNPAID: { group: 'LICENSE', dayCount: 'CALENDAR' },
  PERMIT_PAID: { group: 'PERMIT', dayCount: 'BUSINESS' },
  PERMIT_UNPAID: { group: 'PERMIT', dayCount: 'BUSINESS' },
};

export function metaFor(code: string): AbsenceTypeMeta {
  return ABSENCE_META[code] ?? { group: 'PERMIT', dayCount: 'BUSINESS' };
}

export const GROUP_LABEL: Record<AbsenceGroup, string> = {
  VACATION: 'Vacaciones',
  INCAPACITY: 'Incapacidad',
  LICENSE: 'Licencia',
  PERMIT: 'Permiso',
};

export const STATUS_META: Record<AbsenceStatus, { label: string; variant: string }> = {
  PENDING: { label: 'Pendiente', variant: 'default' },
  APPROVED: { label: 'Aprobada', variant: 'success' },
  IN_PROGRESS: { label: 'En disfrute', variant: 'default' },
  COMPLETED: { label: 'Disfrutada', variant: 'secondary' },
  REJECTED: { label: 'Rechazada', variant: 'destructive' },
  CANCELLED: { label: 'Cancelada', variant: 'outline' },
};

export const STATUS_OPTIONS: AbsenceStatus[] = [
  'PENDING',
  'APPROVED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
];
