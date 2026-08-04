import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Printer,
  Receipt,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PayrollStatusBadge } from '@/components/shared/status-badges';
import {
  fetchPeriodForPrint,
  useDeletePeriod,
  usePayrollPeriod,
  useUpdatePeriodStatus,
} from '../payroll.api';
import { printPayslips } from '../print-payslips';
import { usePermissions } from '@/features/auth/use-permissions';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';
import type { PayrollStatus } from '@/types';

const NEXT_STATUS: Partial<Record<PayrollStatus, { next: PayrollStatus; label: string }>> = {
  DRAFT: { next: 'APPROVED', label: 'Aprobar nómina' },
  PROCESSED: { next: 'APPROVED', label: 'Aprobar nómina' },
  APPROVED: { next: 'PAID', label: 'Marcar como pagada' },
};

export function PayrollPeriodPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: period, isLoading } = usePayrollPeriod(id);
  const updateStatus = useUpdatePeriodStatus();
  const deletePeriod = useDeletePeriod();
  const { isAdmin, canManagePayroll } = usePermissions();
  const [downloading, setDownloading] = useState(false);

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      const data = await fetchPeriodForPrint(id);
      if (!data.payslips.length) {
        toast.error('Este periodo no tiene desprendibles.');
        return;
      }
      printPayslips(data);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDownloading(false);
    }
  };

  const handleAdvance = async () => {
    if (!period) return;
    const action = NEXT_STATUS[period.status];
    if (!action) return;
    try {
      await updateStatus.mutateAsync({ id, status: action.next });
      toast.success('Estado actualizado');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta nómina? Esta acción no se puede deshacer.')) return;
    try {
      await deletePeriod.mutateAsync(id);
      toast.success('Nómina eliminada');
      navigate('/payroll');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!period) return null;

  const action = NEXT_STATUS[period.status];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/payroll')}>
        <ArrowLeft className="h-4 w-4" /> Volver a nómina
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{period.name}</h1>
          <PayrollStatusBadge status={period.status} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadAll} disabled={downloading}>
            <Printer className="h-4 w-4" /> {downloading ? 'Generando…' : 'Desprendibles (PDF)'}
          </Button>
          {action && canManagePayroll && (
            <Button onClick={handleAdvance} disabled={updateStatus.isPending}>
              <BadgeCheck className="h-4 w-4" /> {action.label}
            </Button>
          )}
          {isAdmin && period.status !== 'PAID' && (
            <Button variant="destructive" onClick={handleDelete} disabled={deletePeriod.isPending}>
              <Trash2 className="h-4 w-4" /> Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          icon={Users}
          label="Empleados"
          value={String(period.payslips?.length ?? 0)}
          accent="bg-primary/10 text-primary"
        />
        <SummaryTile
          icon={TrendingUp}
          label="Total devengado"
          value={formatCurrency(period.totalEarnings)}
          accent="bg-success/10 text-success"
        />
        <SummaryTile
          icon={TrendingDown}
          label="Total deducciones"
          value={formatCurrency(period.totalDeductions)}
          accent="bg-destructive/10 text-destructive"
        />
        <SummaryTile
          icon={Banknote}
          label="Neto pagado"
          value={formatCurrency(period.totalNet)}
          accent="bg-primary/10 text-primary"
        />
      </div>

      <Card className="bg-primary text-primary-foreground">
        <CardContent className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm opacity-80">Costo total para la empresa</p>
            <p className="text-3xl font-bold">{formatCurrency(period.totalEmployerCost)}</p>
          </div>
          <div className="text-sm opacity-90">
            <p>Periodo: {formatDate(period.startDate)} — {formatDate(period.endDate)}</p>
            <p>Fecha de pago: {formatDate(period.paymentDate)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Desprendibles */}
      <Card>
        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <Receipt className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Desprendibles de pago</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Días</TableHead>
              <TableHead>Devengado</TableHead>
              <TableHead>Deducciones</TableHead>
              <TableHead>Neto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {period.payslips?.map((slip) => (
              <TableRow
                key={slip.id}
                className="cursor-pointer"
                onClick={() => navigate(`/payroll/payslips/${slip.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>
                        {getInitials(slip.employee?.firstName, slip.employee?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {slip.employee?.firstName} {slip.employee?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {slip.employee?.employeeCode}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{slip.workedDays}</TableCell>
                <TableCell className="text-success font-medium">
                  {formatCurrency(slip.totalEarnings)}
                </TableCell>
                <TableCell className="text-destructive">
                  -{formatCurrency(slip.totalDeductions)}
                </TableCell>
                <TableCell className="font-semibold">{formatCurrency(slip.netPay)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card className="p-5">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xl font-bold tracking-tight">{value}</p>
    </Card>
  );
}
