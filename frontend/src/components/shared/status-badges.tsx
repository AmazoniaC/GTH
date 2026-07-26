import { Badge } from '@/components/ui/badge';
import type { EmployeeStatus, PayrollStatus } from '@/types';

const EMPLOYEE_STATUS: Record<EmployeeStatus, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  ACTIVE: { label: 'Activo', variant: 'success' },
  ON_LEAVE: { label: 'En licencia', variant: 'warning' },
  SUSPENDED: { label: 'Suspendido', variant: 'warning' },
  TERMINATED: { label: 'Retirado', variant: 'destructive' },
};

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  const s = EMPLOYEE_STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

const PAYROLL_STATUS: Record<PayrollStatus, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'default' }> = {
  DRAFT: { label: 'Borrador', variant: 'secondary' },
  PROCESSED: { label: 'Procesada', variant: 'default' },
  APPROVED: { label: 'Aprobada', variant: 'warning' },
  PAID: { label: 'Pagada', variant: 'success' },
  CANCELLED: { label: 'Anulada', variant: 'destructive' },
};

export function PayrollStatusBadge({ status }: { status: PayrollStatus }) {
  const s = PAYROLL_STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export const CONTRACT_TYPE_LABEL: Record<string, string> = {
  INDEFINITE: 'Término indefinido',
  FIXED_TERM: 'Término fijo',
  WORK_LABOR: 'Obra o labor',
  APPRENTICESHIP: 'Aprendizaje',
  TEMPORARY: 'Temporal',
};

export const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  TI: 'Tarjeta de identidad',
  PA: 'Pasaporte',
  PEP: 'PEP',
};
