import { useState } from 'react';
import { Calculator, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSimulate } from '../payroll.api';
import { formatCurrency } from '@/lib/utils';
import type { SimulationResult } from '@/types';

export function PayrollSimulatorPage() {
  const simulate = useSimulate();
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [form, setForm] = useState({
    baseSalary: 2_500_000,
    workedDays: 30,
    arlRiskClass: 1,
    isIntegralSalary: false,
    transportAllowance: true,
  });

  const run = async () => {
    const res = await simulate.mutateAsync({
      baseSalary: form.baseSalary,
      workedDays: form.workedDays,
      arlRiskClass: form.arlRiskClass,
      isIntegralSalary: form.isIntegralSalary,
      hasTransportAllowance: form.transportAllowance,
    });
    setResult(res);
  };

  const earnings = result?.items.filter((i) => i.type === 'EARNING') ?? [];
  const deductions = result?.items.filter((i) => i.type === 'DEDUCTION') ?? [];
  const employer = result?.items.filter((i) => i.type === 'EMPLOYER_COST') ?? [];

  return (
    <div>
      <PageHeader
        title="Simulador de nómina"
        description="Calcula la liquidación de un salario según la legislación colombiana."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Formulario */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-4 w-4 text-primary" /> Datos de entrada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Salario base mensual</Label>
              <Input
                type="number"
                value={form.baseSalary}
                onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Días trabajados</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={form.workedDays}
                onChange={(e) => setForm({ ...form, workedDays: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Clase de riesgo ARL</Label>
              <Select
                value={String(form.arlRiskClass)}
                onValueChange={(v) => setForm({ ...form, arlRiskClass: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Clase I · 0,522%</SelectItem>
                  <SelectItem value="2">Clase II · 1,044%</SelectItem>
                  <SelectItem value="3">Clase III · 2,436%</SelectItem>
                  <SelectItem value="4">Clase IV · 4,350%</SelectItem>
                  <SelectItem value="5">Clase V · 6,960%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Salario integral</p>
                <p className="text-xs text-muted-foreground">IBC sobre el 70%</p>
              </div>
              <Switch
                checked={form.isIntegralSalary}
                onCheckedChange={(c) => setForm({ ...form, isIntegralSalary: c })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Auxilio de transporte</p>
                <p className="text-xs text-muted-foreground">Hasta 2 SMMLV</p>
              </div>
              <Switch
                checked={form.transportAllowance}
                onCheckedChange={(c) => setForm({ ...form, transportAllowance: c })}
              />
            </div>
            <Button className="w-full" onClick={run} disabled={simulate.isPending}>
              {simulate.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Calcular
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Resultado de la liquidación</CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="flex h-72 flex-col items-center justify-center text-center text-muted-foreground">
                <Calculator className="h-10 w-10 opacity-30" />
                <p className="mt-3 text-sm">
                  Ingresa los datos y presiona <span className="font-medium">Calcular</span>.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Metric label="Neto a pagar" value={formatCurrency(result.netPay)} highlight />
                  <Metric label="Costo empleador" value={formatCurrency(result.employerCost)} />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-success">
                      Devengados
                    </h4>
                    <ConceptList items={earnings} />
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-destructive">
                      Deducciones
                    </h4>
                    <ConceptList items={deductions} negative />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Aportes y provisiones del empleador
                  </h4>
                  <ConceptList items={employer} muted />
                </div>

                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  IBC (base de cotización): <span className="font-medium text-foreground">{formatCurrency(result.ibc)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? 'bg-primary/10' : 'bg-muted/60'}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-primary' : ''}`}>{value}</p>
    </div>
  );
}

function ConceptList({
  items,
  negative,
  muted,
}: {
  items: { concept: string; amount: number }[];
  negative?: boolean;
  muted?: boolean;
}) {
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item, i) => (
        <li key={i} className="flex items-center justify-between">
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
