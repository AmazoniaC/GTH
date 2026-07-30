import { useState } from 'react';
import { toast } from 'sonner';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useOptions } from '@/features/catalog/catalog.api';
import { previewAbsenceDays } from '@/lib/colombia-dates';
import { metaFor } from '@/features/absences/absence-meta';
import { useRequestAbsence } from './portal.api';
import { getErrorMessage } from '@/lib/api';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

/** Diálogo de autoservicio: el empleado solicita una ausencia. */
export function AbsenceRequestDialog({ open, onOpenChange }: Props) {
  const { data: types } = useOptions('ABSENCE_TYPE');
  const request = useRequestAbsence();

  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const meta = type ? metaFor(type) : null;
  const days = meta ? previewAbsenceDays(startDate, endDate, meta.dayCount) : 0;

  const submit = () => {
    if (!type) return toast.error('Selecciona el tipo.');
    if (!startDate || !endDate) return toast.error('Indica las fechas.');
    request.mutate(
      { type, startDate, endDate, reason: reason || undefined },
      {
        onSuccess: () => {
          toast.success('Solicitud enviada. Queda pendiente de aprobación.');
          setType('');
          setStartDate('');
          setEndDate('');
          setReason('');
          onOpenChange(false);
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar ausencia</DialogTitle>
          <DialogDescription>
            Tu solicitud quedará pendiente hasta que tu jefe o RRHH la aprueben.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Desde</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Hasta</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          {meta && startDate && endDate && (
            <p className="text-sm text-muted-foreground">
              Duración estimada: <strong>{days}</strong>{' '}
              {meta.dayCount === 'BUSINESS' ? 'día(s) hábil(es)' : 'día(s) calendario'}
            </p>
          )}
          <div>
            <Label className="mb-1.5 block">Motivo (opcional)</Label>
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={request.isPending}>
            {request.isPending ? 'Enviando…' : 'Enviar solicitud'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
