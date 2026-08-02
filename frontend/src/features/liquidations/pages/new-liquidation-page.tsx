import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Calculator, Plus, Trash2, Save } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmployeeOptions } from '@/features/employees/employees.api';
import {
  useTerminationReasons,
  useComputeLiquidation,
  useCreateLiquidation,
  type ComputeInput,
  type ComputeResult,
  type LiquidationLine,
} from '../liquidations.api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';

export function NewLiquidationPage() {
  const navigate = useNavigate();
  const { data: employees = [] } = useEmployeeOptions();
  const { data: reasons } = useTerminationReasons();
  const compute = useComputeLiquidation();
  const create = useCreateLiquidation();

  const [employeeId, setEmployeeId] = useState('');
  const [terminationDate, setTerminationDate] = useState('');
  const [reason, setReason] = useState('');
  const [pendingSalaryDays, setPendingSalaryDays] = useState('');
  const [extraEarnings, setExtraEarnings] = useState<LiquidationLine[]>([]);
  const [deductions, setDeductions] = useState<LiquidationLine[]>([]);
  const [notes, setNotes] = useState('');
  const [markTerminated, setMarkTerminated] = useState(true);
  const [result, setResult] = useState<ComputeResult | null>(null);

  const buildInput = (): ComputeInput => ({
    employeeId,
    terminationDate,
    reason,
    pendingSalaryDays: pendingSalaryDays ? Number(pendingSalaryDays) : 0,
    extraEarnings: extraEarnings.filter((l) => l.concept && l.amount),
    deductions: deductions.filter((l) => l.concept && l.amount),
    notes: notes || null,
  });

  const validate = () => {
    if (!employeeId) return toast.error('Selecciona un empleado.'), false;
    if (!terminationDate) return toast.error('Indica la fecha de retiro.'), false;
    if (!reason) return toast.error('Selecciona el motivo del retiro.'), false;
    return true;
  };

  const doCompute = () => {
    if (!validate()) return;
    compute.mutate(buildInput(), {
      onSuccess: (r) => setResult(r),
      onError: (e) => toast.error(getErrorMessage(e)),
    });
  };

  const doSave = () => {
    if (!validate()) return;
    create.mutate(
      { ...buildInput(), markTerminated },
      {
        onSuccess: (liq) => {
          toast.success('Liquidación guardada.');
          navigate(`/payroll/liquidations/${liq.id}`);
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );
  };

  const addLine = (setter: React.Dispatch<React.SetStateAction<LiquidationLine[]>>) =>
    setter((prev) => [...prev, { concept: '', amount: 0 }]);
  const updateLine = (
    setter: React.Dispatch<React.SetStateAction<LiquidationLine[]>>,
    i: number,
    patch: Partial<LiquidationLine>,
  ) => setter((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeLine = (setter: React.Dispatch<React.SetStateAction<LiquidationLine[]>>, i: number) =>
    setter((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div>
      <PageHeader
        title="Nueva liquidación"
        description="Liquidación definitiva de prestaciones sociales."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del retiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Empleado</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} · {e.documentNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Fecha de retiro</Label>
                <Input
                  type="date"
                  value={terminationDate}
                  onChange={(e) => setTerminationDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Días salario pendiente</Label>
                <Input
                  type="number"
                  min={0}
                  max={31}
                  value={pendingSalaryDays}
                  onChange={(e) => setPendingSalaryDays(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Motivo del retiro</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar motivo" />
                </SelectTrigger>
                <SelectContent>
                  {(reasons ?? []).map((r) => (
                    <SelectItem key={r.code} value={r.code}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <LineEditor
              title="Otros conceptos (devengados)"
              lines={extraEarnings}
              onAdd={() => addLine(setExtraEarnings)}
              onUpdate={(i, p) => updateLine(setExtraEarnings, i, p)}
              onRemove={(i) => removeLine(setExtraEarnings, i)}
            />
            <LineEditor
              title="Deducciones"
              lines={deductions}
              onAdd={() => addLine(setDeductions)}
              onUpdate={(i, p) => updateLine(setDeductions, i, p)}
              onRemove={(i) => removeLine(setDeductions, i)}
            />

            <div>
              <Label className="mb-1.5 block">Notas</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <Button className="w-full" variant="outline" onClick={doCompute} disabled={compute.isPending}>
              <Calculator className="h-4 w-4" />
              {compute.isPending ? 'Calculando…' : 'Calcular'}
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultado de la liquidación</CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Completa los datos y pulsa “Calcular” para ver el detalle.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                  Salario base: <b>{formatCurrency(result.baseSalary)}</b> · Auxilio:{' '}
                  <b>{formatCurrency(result.transportAllowance)}</b> · Vacaciones pendientes:{' '}
                  <b>{result.vacationDays} día(s)</b>
                  <br />
                  Cesantías desde {formatDate(result.cesantiasFrom)} · Prima desde{' '}
                  {formatDate(result.primaFrom)}
                </div>

                <div className="space-y-1.5">
                  {result.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className={it.type === 'DEDUCTION' ? 'text-destructive' : ''}>
                        {it.concept}
                        {it.detail && (
                          <span className="ml-1 text-xs text-muted-foreground">({it.detail})</span>
                        )}
                      </span>
                      <span className={it.type === 'DEDUCTION' ? 'text-destructive' : 'font-medium'}>
                        {it.type === 'DEDUCTION' ? '−' : ''}
                        {formatCurrency(it.amount)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 border-t border-border pt-3 text-sm">
                  <Row label="Total devengado" value={formatCurrency(result.totalEarnings)} />
                  <Row label="Total deducciones" value={`−${formatCurrency(result.totalDeductions)}`} />
                  <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 text-base font-bold text-primary">
                    <span>Neto a pagar</span>
                    <span>{formatCurrency(result.netPay)}</span>
                  </div>
                </div>

                <label className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                  <span>Marcar al empleado como retirado y cerrar su contrato</span>
                  <Switch checked={markTerminated} onCheckedChange={setMarkTerminated} />
                </label>

                <Button className="w-full" onClick={doSave} disabled={create.isPending}>
                  <Save className="h-4 w-4" />
                  {create.isPending ? 'Guardando…' : 'Guardar liquidación'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function LineEditor({
  title,
  lines,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  lines: LiquidationLine[];
  onAdd: () => void;
  onUpdate: (i: number, patch: Partial<LiquidationLine>) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <Label>{title}</Label>
        <Button variant="ghost" size="sm" onClick={onAdd} className="h-7">
          <Plus className="h-3.5 w-3.5" /> Agregar
        </Button>
      </div>
      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder="Concepto"
              value={l.concept}
              onChange={(e) => onUpdate(i, { concept: e.target.value })}
            />
            <Input
              type="number"
              className="w-32"
              placeholder="Valor"
              value={l.amount || ''}
              onChange={(e) => onUpdate(i, { amount: Number(e.target.value) })}
            />
            <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => onRemove(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
