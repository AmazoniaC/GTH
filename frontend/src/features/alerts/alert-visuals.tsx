import { Cake, CalendarClock, FileWarning, ShieldAlert, type LucideIcon } from 'lucide-react';
import type { AlertCategory, AlertSeverity } from '@/types';

export const CATEGORY_META: Record<AlertCategory, { label: string; icon: LucideIcon }> = {
  CONTRACT: { label: 'Contratos', icon: CalendarClock },
  PROBATION: { label: 'Periodo de prueba', icon: ShieldAlert },
  DOCUMENT: { label: 'Documentos', icon: FileWarning },
  BIRTHDAY: { label: 'Cumpleaños', icon: Cake },
};

export const SEVERITY_CLASS: Record<AlertSeverity, string> = {
  critical: 'text-destructive bg-destructive/10',
  warning: 'text-warning-foreground bg-warning/15',
  info: 'text-primary bg-primary/10',
};
