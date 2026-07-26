import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { usePayslip } from '../payroll.api';
import { formatCurrency, getInitials } from '@/lib/utils';
import type { PayslipItem } from '@/types';

export function PayslipPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: slip, isLoading } = usePayslip(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }
  if (!slip) return null;

  const earnings = slip.items?.filter((i) => i.type === 'EARNING') ?? [];
  const deductions = slip.items?.filter((i) => i.type === 'DEDUCTION') ?? [];
  const employerCosts = slip.items?.filter((i) => i.type === 'EMPLOYER_COST') ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Imprimir
        </Button>
      </div>

      <Card className="mx-auto max-w-3xl">
        <CardContent className="p-8">
          {/* Encabezado */}
          <div className="flex items-start justify-between border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-bold">
                  G
                </div>
                <p className="text-lg font-bold">GTH Suite</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Desprendible de pago</p>
              <p className="text-sm text-muted-foreground">{slip.period?.name}</p>
            </div>
            <Avatar className="h-16 w-16 text-xl">
              <AvatarFallback>
                {getInitials(slip.employee?.firstName, slip.employee?.lastName)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Datos del empleado */}
          <div className="grid grid-cols-2 gap-4 py-6 sm:grid-cols-3">
            <Info label="Empleado" value={`${slip.employee?.firstName} ${slip.employee?.lastName}`} />
            <Info label="Documento" value={slip.employee?.documentNumber} />
            <Info label="Código" value={slip.employee?.employeeCode} />
            <Info label="Cargo" value={slip.employee?.position?.title} />
            <Info label="Departamento" value={slip.employee?.department?.name} />
            <Info label="Días trabajados" value={String(slip.workedDays)} />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Devengados */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-success">
                Devengados
              </h3>
              <ItemList items={earnings} />
              <TotalRow label="Total devengado" value={slip.totalEarnings} className="text-success" />
            </div>

            {/* Deducciones */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-destructive">
                Deducciones
              </h3>
              <ItemList items={deductions} negative />
              <TotalRow
                label="Total deducciones"
                value={slip.totalDeductions}
                className="text-destructive"
                negative
              />
            </div>
          </div>

          <Separator className="my-6" />

          {/* Neto */}
          <div className="flex items-center justify-between rounded-xl bg-primary/5 p-5">
            <p className="font-semibold">Neto a pagar</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(slip.netPay)}</p>
          </div>

          {/* Aportes empleador */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Aportes y provisiones del empleador
            </h3>
            <ItemList items={employerCosts} muted />
            <TotalRow label="Costo total empleador" value={slip.employerCost} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ItemList({
  items,
  negative,
  muted,
}: {
  items: PayslipItem[];
  negative?: boolean;
  muted?: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin conceptos.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between text-sm">
          <span className={muted ? 'text-muted-foreground' : ''}>{item.concept}</span>
          <span className="font-medium tabular-nums">
            {negative ? '-' : ''}
            {formatCurrency(item.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function TotalRow({
  label,
  value,
  className,
  negative,
}: {
  label: string;
  value: string;
  className?: string;
  negative?: boolean;
}) {
  return (
    <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
      <span>{label}</span>
      <span className={`tabular-nums ${className ?? ''}`}>
        {negative ? '-' : ''}
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || '—'}</p>
    </div>
  );
}
