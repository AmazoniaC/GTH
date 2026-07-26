import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calculator, FileSpreadsheet, Plus, SlidersHorizontal, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PayrollStatusBadge } from '@/components/shared/status-badges';
import { CreatePeriodDialog } from '../components/create-period-dialog';
import { usePayrollPeriods } from '../payroll.api';
import { formatCurrency, formatDate } from '@/lib/utils';

export function PayrollPage() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: periods, isLoading } = usePayrollPeriods();

  return (
    <div>
      <PageHeader title="Nómina" description="Procesa y gestiona las nóminas de tu empresa.">
        <Button variant="outline" asChild>
          <Link to="/payroll/simulator">
            <Calculator className="h-4 w-4" /> Simulador
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/settings">
            <SlidersHorizontal className="h-4 w-4" /> Parámetros
          </Link>
        </Button>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Procesar nómina
        </Button>
      </PageHeader>

      <Card>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : periods && periods.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periodo</TableHead>
                <TableHead>Empleados</TableHead>
                <TableHead>Neto pagado</TableHead>
                <TableHead>Costo empleador</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/payroll/periods/${p.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileSpreadsheet className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{p._count?.payslips ?? p.payslips?.length ?? 0}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(p.totalNet)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCurrency(p.totalEmployerCost)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(p.paymentDate)}
                  </TableCell>
                  <TableCell>
                    <PayrollStatusBadge status={p.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Wallet className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mt-4 font-medium">No hay nóminas procesadas</p>
            <p className="text-sm text-muted-foreground">
              Procesa tu primera nómina para empezar.
            </p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Procesar nómina
            </Button>
          </div>
        )}
      </Card>

      <CreatePeriodDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
