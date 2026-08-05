import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Ban, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEmployeeOptions } from '@/features/employees/employees.api';
import {
  useNovelties,
  useNoveltyCatalog,
  useCreateNovelty,
  useUpdateNovelty,
  useDeleteNovelty,
  type Novelty,
} from '../novelties.api';
import { formatCurrency } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';

export function NoveltiesPage() {
  const { data: novelties } = useNovelties();
  const del = useDeleteNovelty();
  const update = useUpdateNovelty();
  const [open, setOpen] = useState(false);

  const toggleActive = (n: Novelty) =>
    update.mutate(
      { id: n.id, isActive: !n.isActive },
      { onSuccess: () => toast.success(n.isActive ? 'Novedad desactivada.' : 'Novedad activada.'), onError: (e) => toast.error(getErrorMessage(e)) },
    );
  const remove = (n: Novelty) => {
    if (!confirm('¿Eliminar esta novedad?')) return;
    del.mutate(n.id, { onSuccess: () => toast.success('Novedad eliminada.'), onError: (e) => toast.error(getErrorMessage(e)) });
  };

  return (
    <div>
      <PageHeader
        title="Novedades de nómina"
        description="Horas extra, bonos, comisiones y deducciones (préstamos) que se aplican al liquidar."
      >
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Nueva novedad
        </Button>
      </PageHeader>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Recurrencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {novelties?.map((n) => (
              <TableRow key={n.id}>
                <TableCell>
                  <p className="font-medium">{n.employee?.firstName} {n.employee?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{n.employee?.documentNumber}</p>
                </TableCell>
                <TableCell className="text-sm">{n.concept}</TableCell>
                <TableCell>
                  <Badge variant={n.kind === 'EARNING' ? 'success' : 'destructive'}>
                    {n.kind === 'EARNING' ? 'Devengado' : 'Deducción'}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium tabular-nums">
                  {n.kind === 'DEDUCTION' ? '-' : ''}{formatCurrency(n.amount)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {n.recurring
                    ? n.installments
                      ? `Cuota ${n.appliedCount}/${n.installments}`
                      : 'Cada mes'
                    : n.appliedCount > 0
                      ? 'Aplicada'
                      : 'Una vez'}
                </TableCell>
                <TableCell>
                  <Badge variant={n.isActive ? 'default' : 'outline'}>{n.isActive ? 'Activa' : 'Inactiva'}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(n)} title={n.isActive ? 'Desactivar' : 'Activar'}>
                    {n.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(n)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {novelties?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No hay novedades registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <NoveltyDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function NoveltyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: employees = [] } = useEmployeeOptions();
  const { data: catalog } = useNoveltyCatalog();
  const create = useCreateNovelty();

  const [employeeId, setEmployeeId] = useState('');
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [hours, setHours] = useState('');
  const [total, setTotal] = useState('');
  const [installments, setInstallments] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [concept, setConcept] = useState('');
  const [notes, setNotes] = useState('');

  const isOvertime = code.startsWith('OT_');
  const isLoan = code === 'LOAN';
  const kind = useMemo(
    () => (catalog?.deductions.some((d) => d.code === code) ? 'DEDUCTION' : 'EARNING'),
    [catalog, code],
  );
  const installmentValue = isLoan && Number(total) && Number(installments)
    ? Math.round(Number(total) / Number(installments))
    : 0;

  const reset = () => {
    setEmployeeId(''); setCode(''); setAmount(''); setHours(''); setTotal('');
    setInstallments(''); setRecurring(false); setConcept(''); setNotes('');
  };

  const submit = () => {
    if (!employeeId) return toast.error('Selecciona un empleado.');
    if (!code) return toast.error('Selecciona el tipo de novedad.');

    const payload: Parameters<typeof create.mutate>[0] = {
      employeeId,
      kind: kind as 'EARNING' | 'DEDUCTION',
      code,
      concept: concept || undefined,
      notes: notes || undefined,
      recurring: isLoan ? true : recurring,
    };
    if (isOvertime) {
      if (!Number(hours)) return toast.error('Indica las horas.');
      payload.hours = Number(hours);
    } else if (isLoan) {
      if (!installmentValue) return toast.error('Indica el valor total y el número de cuotas.');
      payload.amount = installmentValue;
      payload.installments = Number(installments);
    } else {
      if (!Number(amount)) return toast.error('Indica el valor.');
      payload.amount = Number(amount);
    }

    create.mutate(payload, {
      onSuccess: () => { toast.success('Novedad registrada.'); reset(); onOpenChange(false); },
      onError: (e) => toast.error(getErrorMessage(e)),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva novedad de nómina</DialogTitle>
          <DialogDescription>Se incluirá automáticamente al liquidar el próximo período.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Empleado</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar empleado" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName} · {e.documentNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block">Tipo de novedad</Label>
            <Select value={code} onValueChange={setCode}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Horas extra y recargos</SelectLabel>
                  {catalog?.overtime.map((o) => <SelectItem key={o.code} value={o.code}>{o.label}</SelectItem>)}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Devengados</SelectLabel>
                  {catalog?.earnings.map((o) => <SelectItem key={o.code} value={o.code}>{o.label}</SelectItem>)}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Deducciones</SelectLabel>
                  {catalog?.deductions.map((o) => <SelectItem key={o.code} value={o.code}>{o.label}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {isOvertime && (
            <div>
              <Label className="mb-1.5 block">Número de horas</Label>
              <Input type="number" min={0} step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} />
              <p className="mt-1 text-xs text-muted-foreground">El valor se calcula automáticamente (salario/240 × horas × recargo).</p>
            </div>
          )}

          {isLoan && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Valor total</Label>
                <Input type="number" min={0} value={total} onChange={(e) => setTotal(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 block">N.° de cuotas</Label>
                <Input type="number" min={1} value={installments} onChange={(e) => setInstallments(e.target.value)} />
              </div>
              {installmentValue > 0 && (
                <p className="col-span-2 text-xs text-muted-foreground">
                  Cuota mensual: <b>{formatCurrency(installmentValue)}</b> (se descuenta cada mes hasta saldar).
                </p>
              )}
            </div>
          )}

          {!isOvertime && !isLoan && code && (
            <>
              <div>
                <Label className="mb-1.5 block">Valor</Label>
                <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <label className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span>Recurrente (aplicar cada mes)</span>
                <Switch checked={recurring} onCheckedChange={setRecurring} />
              </label>
            </>
          )}

          <div>
            <Label className="mb-1.5 block">Concepto (opcional)</Label>
            <Input value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Se toma del tipo si lo dejas vacío" />
          </div>
          <div>
            <Label className="mb-1.5 block">Notas</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={create.isPending}>{create.isPending ? 'Guardando…' : 'Registrar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
