import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useCreatePeriod } from '../payroll.api';
import { getErrorMessage } from '@/lib/api';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const schema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
  workedDays: z.coerce.number().min(1).max(30),
  paymentDate: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CreatePeriodDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createPeriod = useCreatePeriod();
  const now = new Date();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      workedDays: 30,
    },
  });

  const month = watch('month');
  const year = watch('year');

  const onSubmit = async (values: FormValues) => {
    try {
      await createPeriod.mutateAsync({
        name: `Nómina ${MONTHS[values.month - 1]} ${values.year}`,
        type: 'MONTHLY',
        month: values.month,
        year: values.year,
        workedDays: values.workedDays,
        paymentDate: values.paymentDate || undefined,
      });
      toast.success('Nómina procesada correctamente');
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Procesar nueva nómina</DialogTitle>
          <DialogDescription>
            Se liquidará a todos los empleados activos con contrato vigente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Mes</Label>
              <Select
                value={String(month)}
                onValueChange={(v) => setValue('month', Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Año</Label>
              <Select value={String(year)} onValueChange={(v) => setValue('year', Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2025, 2026, 2027].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Días trabajados</Label>
            <Input type="number" min={1} max={30} {...register('workedDays')} />
            {errors.workedDays && (
              <p className="text-xs text-destructive">{errors.workedDays.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              En Colombia el mes laboral base es de 30 días.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Fecha de pago (opcional)</Label>
            <Input type="date" {...register('paymentDate')} />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createPeriod.isPending}>
              {createPeriod.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Procesar nómina
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
