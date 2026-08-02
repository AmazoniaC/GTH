import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Letterhead, DocumentFooter } from '@/components/shared/document-letterhead';
import { useLiquidation, useTerminationReasons } from '../liquidations.api';
import { formatCurrency, formatDate } from '@/lib/utils';

export function LiquidationDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: liq, isLoading } = useLiquidation(id);
  const { data: reasons } = useTerminationReasons();
  const reasonLabel = reasons?.find((r) => r.code === liq?.reason)?.label ?? liq?.reason;

  if (isLoading || !liq) {
    return <Skeleton className="h-96" />;
  }

  const earnings = liq.items.filter((i) => i.type === 'EARNING');
  const deductions = liq.items.filter((i) => i.type === 'DEDUCTION');
  const emp = liq.employee;
  const org = liq.organization;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate('/payroll/liquidations')}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Imprimir / PDF
        </Button>
      </div>

      <Card className="p-8 print:border-0 print:shadow-none">
        {/* Membrete */}
        <Letterhead org={org} />
        <h1 className="text-center text-base font-bold uppercase tracking-wide">
          Liquidación definitiva de contrato
        </h1>
        {liq.number && (
          <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
            N° {liq.number}
          </p>
        )}

        {/* Datos del empleado */}
        <div className="grid grid-cols-2 gap-2 py-4 text-sm">
          <Field label="Empleado" value={`${emp.firstName} ${emp.lastName}`} />
          <Field label="Documento" value={`${emp.documentType} ${emp.documentNumber}`} />
          <Field label="Cargo" value={emp.position?.title ?? '—'} />
          <Field label="Motivo del retiro" value={reasonLabel ?? '—'} />
          <Field label="Fecha de ingreso" value={formatDate(emp.hireDate)} />
          <Field label="Fecha de retiro" value={formatDate(liq.terminationDate)} />
        </div>

        {/* Devengados */}
        <ItemsTable
          title="Devengados"
          items={earnings}
          totalLabel="Total devengado"
          totalValue={formatCurrency(liq.totalEarnings)}
        />

        {/* Deducciones */}
        {deductions.length > 0 && (
          <ItemsTable
            title="Deducciones"
            items={deductions}
            negative
            totalLabel="Total deducciones"
            totalValue={`−${formatCurrency(liq.totalDeductions)}`}
          />
        )}

        {/* Neto */}
        <div className="mt-4 flex items-center justify-between rounded-lg bg-primary/5 px-4 py-3 text-lg font-bold text-primary">
          <span>Neto a pagar</span>
          <span>{formatCurrency(liq.netPay)}</span>
        </div>

        {liq.notes && (
          <p className="mt-4 text-xs text-muted-foreground">
            <b>Notas:</b> {liq.notes}
          </p>
        )}

        {/* Firma */}
        <div className="mt-16 grid grid-cols-2 gap-8 text-sm">
          <SignatureBlock name={org.legalRepresentative || ''} role="Representante Legal" />
          <SignatureBlock name={`${emp.firstName} ${emp.lastName}`} role="Recibí a satisfacción" />
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Generado el {formatDate(liq.createdAt)} · {org.city ?? ''}
        </p>

        <DocumentFooter org={org} />
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ItemsTable({
  title,
  items,
  negative,
  totalLabel,
  totalValue,
}: {
  title: string;
  items: { concept: string; detail?: string; amount: number }[];
  negative?: boolean;
  totalLabel: string;
  totalValue: string;
}) {
  return (
    <div className="mt-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <table className="zebra w-full text-sm">
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="even:bg-muted/50">
              <td className="px-2 py-1.5">
                {it.concept}
                {it.detail && <span className="ml-1 text-xs text-muted-foreground">({it.detail})</span>}
              </td>
              <td className={`px-2 py-1.5 text-right ${negative ? 'text-destructive' : ''}`}>
                {negative ? '−' : ''}
                {formatCurrency(it.amount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border font-semibold">
            <td className="px-2 py-1.5">{totalLabel}</td>
            <td className="px-2 py-1.5 text-right">{totalValue}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function SignatureBlock({ name, role }: { name: string; role: string }) {
  return (
    <div className="text-center">
      <div className="mb-1 border-t border-foreground" />
      <p className="font-medium">{name || ' '}</p>
      <p className="text-xs text-muted-foreground">{role}</p>
    </div>
  );
}
