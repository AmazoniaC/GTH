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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateEmployee, useDepartments, usePositions } from '../employees.api';
import { getErrorMessage } from '@/lib/api';

const schema = z.object({
  firstName: z.string().min(2, 'Requerido'),
  lastName: z.string().min(2, 'Requerido'),
  documentType: z.enum(['CC', 'CE', 'TI', 'PA', 'PEP']),
  documentNumber: z.string().min(3, 'Requerido'),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  hireDate: z.string().min(1, 'Requerido'),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  eps: z.string().optional(),
  pensionFund: z.string().optional(),
  severanceFund: z.string().optional(),
  compensationFund: z.string().optional(),
  arlRiskClass: z.coerce.number().min(1).max(5),
  contractType: z.enum(['INDEFINITE', 'FIXED_TERM', 'WORK_LABOR', 'APPRENTICESHIP', 'TEMPORARY']),
  baseSalary: z.coerce.number().positive('Debe ser mayor a 0'),
  startDate: z.string().min(1, 'Requerido'),
  isIntegralSalary: z.boolean(),
  transportAllowance: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeForm({ open, onOpenChange }: EmployeeFormProps) {
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();
  const createEmployee = useCreateEmployee();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      documentType: 'CC',
      arlRiskClass: 1,
      contractType: 'INDEFINITE',
      isIntegralSalary: false,
      transportAllowance: true,
      hireDate: new Date().toISOString().slice(0, 10),
      startDate: new Date().toISOString().slice(0, 10),
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createEmployee.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        documentType: values.documentType,
        documentNumber: values.documentNumber,
        email: values.email || undefined,
        phone: values.phone || undefined,
        gender: values.gender || undefined,
        city: values.city || undefined,
        address: values.address || undefined,
        hireDate: values.hireDate,
        departmentId: values.departmentId || undefined,
        positionId: values.positionId || undefined,
        eps: values.eps || undefined,
        pensionFund: values.pensionFund || undefined,
        severanceFund: values.severanceFund || undefined,
        compensationFund: values.compensationFund || undefined,
        arlRiskClass: values.arlRiskClass,
        contract: {
          type: values.contractType,
          baseSalary: values.baseSalary,
          startDate: values.startDate,
          isIntegralSalary: values.isIntegralSalary,
          transportAllowance: values.transportAllowance,
        },
      });
      toast.success('Empleado creado correctamente');
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo empleado</DialogTitle>
          <DialogDescription>
            Completa la información para registrar un nuevo colaborador.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="personal">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="laboral">Laboral</TabsTrigger>
              <TabsTrigger value="seguridad">Seg. Social</TabsTrigger>
              <TabsTrigger value="contrato">Contrato</TabsTrigger>
            </TabsList>

            {/* Datos personales */}
            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nombres" error={errors.firstName?.message}>
                  <Input {...register('firstName')} />
                </Field>
                <Field label="Apellidos" error={errors.lastName?.message}>
                  <Input {...register('lastName')} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo de documento">
                  <Select
                    defaultValue="CC"
                    onValueChange={(v) => setValue('documentType', v as FormValues['documentType'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CC">Cédula de ciudadanía</SelectItem>
                      <SelectItem value="CE">Cédula de extranjería</SelectItem>
                      <SelectItem value="TI">Tarjeta de identidad</SelectItem>
                      <SelectItem value="PA">Pasaporte</SelectItem>
                      <SelectItem value="PEP">PEP</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Número de documento" error={errors.documentNumber?.message}>
                  <Input {...register('documentNumber')} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Correo electrónico" error={errors.email?.message}>
                  <Input type="email" {...register('email')} />
                </Field>
                <Field label="Teléfono">
                  <Input {...register('phone')} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Género">
                  <Select onValueChange={(v) => setValue('gender', v as FormValues['gender'])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Masculino</SelectItem>
                      <SelectItem value="FEMALE">Femenino</SelectItem>
                      <SelectItem value="OTHER">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Ciudad">
                  <Input {...register('city')} />
                </Field>
                <Field label="Dirección">
                  <Input {...register('address')} />
                </Field>
              </div>
            </TabsContent>

            {/* Laboral */}
            <TabsContent value="laboral" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Fecha de ingreso" error={errors.hireDate?.message}>
                  <Input type="date" {...register('hireDate')} />
                </Field>
                <Field label="Departamento">
                  <Select onValueChange={(v) => setValue('departmentId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Cargo">
                <Select onValueChange={(v) => setValue('positionId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </TabsContent>

            {/* Seguridad social */}
            <TabsContent value="seguridad" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="EPS (Salud)">
                  <Input {...register('eps')} placeholder="Ej: Sura EPS" />
                </Field>
                <Field label="Fondo de pensión">
                  <Input {...register('pensionFund')} placeholder="Ej: Porvenir" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Fondo de cesantías">
                  <Input {...register('severanceFund')} placeholder="Ej: Porvenir" />
                </Field>
                <Field label="Caja de compensación">
                  <Input {...register('compensationFund')} placeholder="Ej: Compensar" />
                </Field>
              </div>
              <Field label="Clase de riesgo ARL (1-5)" error={errors.arlRiskClass?.message}>
                <Select
                  defaultValue="1"
                  onValueChange={(v) => setValue('arlRiskClass', Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Clase I · Riesgo mínimo</SelectItem>
                    <SelectItem value="2">Clase II · Riesgo bajo</SelectItem>
                    <SelectItem value="3">Clase III · Riesgo medio</SelectItem>
                    <SelectItem value="4">Clase IV · Riesgo alto</SelectItem>
                    <SelectItem value="5">Clase V · Riesgo máximo</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </TabsContent>

            {/* Contrato */}
            <TabsContent value="contrato" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo de contrato">
                  <Select
                    defaultValue="INDEFINITE"
                    onValueChange={(v) => setValue('contractType', v as FormValues['contractType'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDEFINITE">Término indefinido</SelectItem>
                      <SelectItem value="FIXED_TERM">Término fijo</SelectItem>
                      <SelectItem value="WORK_LABOR">Obra o labor</SelectItem>
                      <SelectItem value="APPRENTICESHIP">Aprendizaje</SelectItem>
                      <SelectItem value="TEMPORARY">Temporal</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Salario base mensual" error={errors.baseSalary?.message}>
                  <Input type="number" {...register('baseSalary')} placeholder="1623500" />
                </Field>
              </div>
              <Field label="Fecha de inicio del contrato" error={errors.startDate?.message}>
                <Input type="date" {...register('startDate')} />
              </Field>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Salario integral</p>
                  <p className="text-xs text-muted-foreground">IBC calculado sobre el 70%</p>
                </div>
                <Switch
                  checked={watch('isIntegralSalary')}
                  onCheckedChange={(c) => setValue('isIntegralSalary', c)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Auxilio de transporte</p>
                  <p className="text-xs text-muted-foreground">Aplica hasta 2 SMMLV</p>
                </div>
                <Switch
                  checked={watch('transportAllowance')}
                  onCheckedChange={(c) => setValue('transportAllowance', c)}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createEmployee.isPending}>
              {createEmployee.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar empleado
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
