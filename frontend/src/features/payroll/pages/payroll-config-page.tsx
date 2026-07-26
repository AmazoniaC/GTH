import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePayrollConfig, useUpsertConfig } from '../payroll.api';
import { getErrorMessage } from '@/lib/api';

export function PayrollConfigPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: config, isLoading } = usePayrollConfig(year);
  const upsert = useUpsertConfig();

  const [form, setForm] = useState({
    minimumWage: 0,
    transportAllowance: 0,
    uvt: 0,
  });

  useEffect(() => {
    if (config) {
      setForm({
        minimumWage: Number(config.minimumWage),
        transportAllowance: Number(config.transportAllowance),
        uvt: Number(config.uvt),
      });
    }
  }, [config]);

  const save = async () => {
    try {
      await upsert.mutateAsync({ year, ...form });
      toast.success('Parámetros guardados correctamente');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div>
      <PageHeader
        title="Parámetros de nómina"
        description="Configura los valores legales usados en el cálculo de la nómina."
      >
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2025, 2026, 2027].map((y) => (
              <SelectItem key={y} value={String(y)}>
                Año {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Valores base {year}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>Salario mínimo (SMMLV)</Label>
                  <Input
                    type="number"
                    value={form.minimumWage}
                    onChange={(e) => setForm({ ...form, minimumWage: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Auxilio de transporte</Label>
                  <Input
                    type="number"
                    value={form.transportAllowance}
                    onChange={(e) =>
                      setForm({ ...form, transportAllowance: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>UVT (Unidad de Valor Tributario)</Label>
                  <Input
                    type="number"
                    value={form.uvt}
                    onChange={(e) => setForm({ ...form, uvt: Number(e.target.value) })}
                  />
                </div>
                <Button onClick={save} disabled={upsert.isPending}>
                  {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Guardar parámetros
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Porcentajes de aportes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <RateRow label="Salud empleado" value="4%" />
            <RateRow label="Pensión empleado" value="4%" />
            <RateRow label="Salud empleador" value="8,5%" />
            <RateRow label="Pensión empleador" value="12%" />
            <RateRow label="Cesantías" value="8,33%" />
            <RateRow label="Prima de servicios" value="8,33%" />
            <RateRow label="Vacaciones" value="4,17%" />
            <RateRow label="SENA / ICBF / Caja" value="2% / 3% / 4%" />
            <p className="pt-2 text-xs text-muted-foreground">
              Aplica exoneración de aportes (Ley 1607) para salarios inferiores a 10 SMMLV.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
