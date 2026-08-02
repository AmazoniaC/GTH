import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLiquidations, useTerminationReasons } from '../liquidations.api';
import { formatCurrency, formatDate } from '@/lib/utils';

export function LiquidationsPage() {
  const navigate = useNavigate();
  const { data: liquidations } = useLiquidations();
  const { data: reasons } = useTerminationReasons();
  const reasonLabel = useMemo(
    () => Object.fromEntries((reasons ?? []).map((r) => [r.code, r.label])),
    [reasons],
  );

  return (
    <div>
      <PageHeader
        title="Liquidaciones definitivas"
        description="Liquidación de prestaciones sociales al terminar el contrato."
      >
        <Button onClick={() => navigate('/payroll/liquidations/new')}>
          <Plus className="h-4 w-4" /> Nueva liquidación
        </Button>
      </PageHeader>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Fecha de retiro</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Neto</TableHead>
              <TableHead>Generada</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {liquidations?.map((l) => (
              <TableRow
                key={l.id}
                className="cursor-pointer"
                onClick={() => navigate(`/payroll/liquidations/${l.id}`)}
              >
                <TableCell>
                  <p className="font-medium">
                    {l.employee.firstName} {l.employee.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{l.employee.documentNumber}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(l.terminationDate)}</TableCell>
                <TableCell className="text-sm">{reasonLabel[l.reason] ?? l.reason}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(l.netPay)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(l.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <FileText className="ml-auto h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
            {liquidations?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Aún no hay liquidaciones. Crea la primera con “Nueva liquidación”.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
