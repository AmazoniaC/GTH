import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CalendarDays, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useOptions } from '@/features/catalog/catalog.api';
import { useEmployeeOptions } from '@/features/employees/employees.api';
import { useCreateAbsence, useUpdateAbsence, useVacationBalance } from './absence.api';
import { metaFor, STATUS_META, STATUS_OPTIONS } from './absence-meta';
import { previewAbsenceDays } from '@/lib/colombia-dates';
import { getErrorMessage } from '@/lib/api';
import { toDateInput } from '@/lib/utils';
import type { Absence, AbsenceStatus } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  absence?: Absence | null;
  /** Empleado preseleccionado (al abrir desde su ficha). */
  defaultEmployeeId?: string;
}

const emptyForm = {
  employeeId: '',
  type: '',
  startDate: '',
  endDate: '',
  status: 'APPROVED' as AbsenceStatus,
  entity: '',
  supportNumber: '',
  diagnosis: '',
  reason: '',
  notes: '',
};

export function AbsenceFormDialog({ open, onOpenChange, absence, defaultEmployeeId }: Props) {
  const isEdit = !!absence;
  const { data: employees } = useEmployeeOptions();
  const { data: types } = useOptions('ABSENCE_TYPE');
  const createAbsence = useCreateAbsence();
  const updateAbsence = useUpdateAbsence();

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    if (absence) {
      setForm({
        employeeId: absence.employeeId,
        type: absence.type,
        startDate: toDateInput(absence.startDate),
        endDate: toDateInput(absence.endDate),
        status: absence.status,
        entity: absence.entity ?? '',
        supportNumber: absence.supportNumber ?? '',
        diagnosis: absence.diagnosis ?? '',
        reason: absence.reason ?? '',
        notes: absence.notes ?? '',
      });
    } else {
      setForm({ ...emptyForm, employeeId: defaultEmployeeId ?? '' });
    }
  }, [open, absence, defaultEmployeeId]);

  const meta = form.type ? metaFor(form.type) : null;
  const days = useMemo(
    () => (meta ? previewAbsenceDays(form.startDate, form.endDate, meta.dayCount) : 0),
    [form.startDate, form.endDate, meta],
  );

  const isVacation = meta?.consumesVacation;
  const { data: balance } = useVacationBalance(isVacation ? form.employeeId : undefined);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = () => {
    if (!form.employeeId) return toast.error('Selecciona un empleado.');
    if (!form.type) return toast.error('Selecciona el tipo de ausencia.');
    if (!form.startDate || !form.endDate) return toast.error('Indica las fechas.');

    const payload = {
      employeeId: form.employeeId,
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
      entity: form.entity || null,
      supportNumber: form.supportNumber || null,
      diagnosis: form.diagnosis || null,
      reason: form.reason || null,
      notes: form.notes || null,
    };

    const onDone = (msg: string) => {
      toast.success(msg);
      onOpenChange(false);
    };
    if (isEdit && absence) {
      updateAbsence.mutate(
        { id: absence.id, ...payload },
        { onSuccess: () => onDone('Ausencia actualizada.'), onError: (e) => toast.error(getErrorMessage(e)) },
      );
    } else {
      createAbsence.mutate(payload, {
        onSuccess: () => onDone('Ausencia registrada.'),
        onError: (e) => toast.error(getErrorMessage(e)),
      });
    }
  };

  const pending = createAbsence.isPending || updateAbsence.isPending;
  const overBalance = isVacation && balance && days > balance.available;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar ausencia' : 'Registrar ausencia'}</DialogTitle>
          <DialogDescription>
            Vacaciones, incapacidades, licencias y permisos. Los días se calculan automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Empleado</Label>
              <Select
                value={form.employeeId}
                onValueChange={(v) => set({ employeeId: v })}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} · {e.documentNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Tipo de ausencia</Label>
              <Select value={form.type} onValueChange={(v) => set({ type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {(types ?? [])
                    .filter((t) => t.isActive)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.code}>
                        {t.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block">Desde</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => set({ startDate: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Hasta</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => set({ endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Duración calculada */}
          {meta && form.startDate && form.endDate && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>
                Duración: <strong>{days}</strong>{' '}
                {meta.dayCount === 'BUSINESS' ? 'día(s) hábil(es)' : 'día(s) calendario'}
              </span>
            </div>
          )}

          {/* Saldo de vacaciones */}
          {isVacation && balance && (
            <div
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                overBalance ? 'border-destructive/40 bg-destructive/5 text-destructive' : 'border-border bg-muted/40'
              }`}
            >
              <Plane className="h-4 w-4" />
              <span>
                Saldo disponible: <strong>{balance.available}</strong> días.
                {overBalance && ' La solicitud supera el saldo.'}
              </span>
            </div>
          )}

          {/* Datos de soporte (incapacidades/licencias) */}
          {meta?.requiresEntity && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block">Entidad (EPS/ARL)</Label>
                <Input value={form.entity} onChange={(e) => set({ entity: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1.5 block">N.° de soporte</Label>
                <Input
                  value={form.supportNumber}
                  onChange={(e) => set({ supportNumber: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1.5 block">Diagnóstico / motivo</Label>
                <Input value={form.diagnosis} onChange={(e) => set({ diagnosis: e.target.value })} />
              </div>
            </div>
          )}

          {/* Motivo (permisos/licencias) */}
          {meta && !meta.requiresEntity && meta.group !== 'VACATION' && (
            <div>
              <Label className="mb-1.5 block">Motivo</Label>
              <Input value={form.reason} onChange={(e) => set({ reason: e.target.value })} />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block">Estado</Label>
              <Select value={form.status} onValueChange={(v) => set({ status: v as AbsenceStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Notas</Label>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? 'Guardando…' : isEdit ? 'Guardar' : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
