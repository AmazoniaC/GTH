import { toast } from 'sonner';
import { Download, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatNumber } from '@/lib/utils';
import { exportCsv } from '@/lib/export-csv';
import { usePeriodPila, type PilaData } from '../payroll.api';

interface Props {
  periodId: string;
  periodName: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function PilaDialog({ periodId, periodName, open, onOpenChange }: Props) {
  const { data, isLoading, isError } = usePeriodPila(periodId, open);

  const handleExport = () => {
    if (!data) return;
    const headers = [
      'Empleado', 'Tipo Doc', 'Documento', 'Días', 'IBC', 'EPS', 'Salud', 'AFP', 'Pensión',
      'FSP', 'ARL (entidad)', 'Clase riesgo', 'ARL', 'Caja (entidad)', 'Caja', 'SENA', 'ICBF', 'Total',
    ];
    const rows = data.rows.map((r) => [
      r.employee, r.documentType, r.documentNumber, r.days, r.ibc, r.eps, r.health, r.afp,
      r.pension, r.fsp, r.arlEntity, r.riskClass, r.arl, r.ccfEntity, r.ccf, r.sena, r.icbf, r.total,
    ]);
    const t = data.totals;
    rows.push(['TOTALES', '', '', '', t.ibc, '', t.health, '', t.pension, t.fsp, '', '', t.arl, '', t.ccf, t.sena, t.icbf, t.total]);
    exportCsv(`PILA-${periodName}`, headers, rows);
    toast.success('Archivo exportado.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Liquidación de aportes (PILA) · {periodName}</DialogTitle>
        </DialogHeader>

        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data ? `${data.count} empleado(s). Bases y aportes por subsistema.` : 'Calculando…'}
          </p>
          <Button size="sm" onClick={handleExport} disabled={!data || data.count === 0}>
            <Download className="mr-2 h-4 w-4" /> Exportar a Excel
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Calculando la planilla…
          </div>
        ) : isError ? (
          <p className="py-10 text-center text-sm text-destructive">No se pudo calcular la PILA.</p>
        ) : !data || data.count === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">El periodo no tiene desprendibles.</p>
        ) : (
          <div className="max-h-[60vh] overflow-auto rounded-lg border border-border">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead className="text-right">Días</TableHead>
                  <TableHead className="text-right">IBC</TableHead>
                  <TableHead className="text-right">Salud</TableHead>
                  <TableHead className="text-right">Pensión</TableHead>
                  <TableHead className="text-right">FSP</TableHead>
                  <TableHead className="text-right">ARL</TableHead>
                  <TableHead className="text-right">Caja</TableHead>
                  <TableHead className="text-right">SENA</TableHead>
                  <TableHead className="text-right">ICBF</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <p className="font-medium">{r.employee}</p>
                      <p className="text-xs text-muted-foreground">{r.documentType} {r.documentNumber}</p>
                    </TableCell>
                    <TableCell className="text-right">{r.days}</TableCell>
                    <TableCell className="text-right">{formatNumber(r.ibc)}</TableCell>
                    <TableCell className="text-right">{formatNumber(r.health)}</TableCell>
                    <TableCell className="text-right">{formatNumber(r.pension)}</TableCell>
                    <TableCell className="text-right">{formatNumber(r.fsp)}</TableCell>
                    <TableCell className="text-right">{formatNumber(r.arl)}</TableCell>
                    <TableCell className="text-right">{formatNumber(r.ccf)}</TableCell>
                    <TableCell className="text-right">{formatNumber(r.sena)}</TableCell>
                    <TableCell className="text-right">{formatNumber(r.icbf)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatNumber(r.total)}</TableCell>
                  </TableRow>
                ))}
                <TotalsRow totals={data.totals} />
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TotalsRow({ totals: t }: { totals: PilaData['totals'] }) {
  return (
    <TableRow className="bg-muted/50 font-semibold">
      <TableCell>TOTALES</TableCell>
      <TableCell />
      <TableCell className="text-right">{formatNumber(t.ibc)}</TableCell>
      <TableCell className="text-right">{formatNumber(t.health)}</TableCell>
      <TableCell className="text-right">{formatNumber(t.pension)}</TableCell>
      <TableCell className="text-right">{formatNumber(t.fsp)}</TableCell>
      <TableCell className="text-right">{formatNumber(t.arl)}</TableCell>
      <TableCell className="text-right">{formatNumber(t.ccf)}</TableCell>
      <TableCell className="text-right">{formatNumber(t.sena)}</TableCell>
      <TableCell className="text-right">{formatNumber(t.icbf)}</TableCell>
      <TableCell className="text-right">{formatNumber(t.total)}</TableCell>
    </TableRow>
  );
}
