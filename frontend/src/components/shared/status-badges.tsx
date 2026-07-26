import { Badge } from '@/components/ui/badge';
import type { PayrollStatus } from '@/types';
import { useOptions } from '@/features/catalog/catalog.api';

type BadgeVariant = 'success' | 'warning' | 'destructive' | 'secondary';

// Variante de color por código conocido; el resto usa un color neutro.
const STATUS_VARIANT: Record<string, BadgeVariant> = {
  ACTIVE: 'success',
  ON_LEAVE: 'warning',
  SUSPENDED: 'warning',
  TERMINATED: 'destructive',
};

const STATUS_FALLBACK_LABEL: Record<string, string> = {
  ACTIVE: 'Activo',
  ON_LEAVE: 'En licencia',
  SUSPENDED: 'Suspendido',
  TERMINATED: 'Retirado',
};

export function EmployeeStatusBadge({ status }: { status: string }) {
  const { data: options } = useOptions('EMPLOYEE_STATUS');
  const label =
    options?.find((o) => o.code === status)?.label ?? STATUS_FALLBACK_LABEL[status] ?? status;
  const variant = STATUS_VARIANT[status] ?? 'secondary';
  return <Badge variant={variant}>{label}</Badge>;
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
