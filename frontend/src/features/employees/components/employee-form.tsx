import { useEffect } from 'react';
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
import { useCreateEmployee, useDepartments, usePositions, useUpdateEmployee } from '../employees.api';
import { useOptions } from '@/features/catalog/catalog.api';
import { PhotoUpload } from '@/components/shared/photo-upload';
import { getErrorMessage } from '@/lib/api';
import { getInitials, toDateInput } from '@/lib/utils';
import { COLOMBIA, COUNTRIES, DEPARTMENTS } from '@/lib/colombia-geo';
import type { Employee } from '@/types';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const MARITAL = [
  { value: 'SINGLE', label: 'Soltero(a)' },
  { value: 'MARRIED', label: 'Casado(a)' },
  { value: 'FREE_UNION', label: 'Unión libre' },
  { value: 'DIVORCED', label: 'Divorciado(a)' },
  { value: 'WIDOWED', label: 'Viudo(a)' },
];

const schema = z.object({
  photoUrl: z.string().nullable().optional(),
  documentType: z.string().min(1),
  documentNumber: z.string().min(3, 'Requerido'),
  issuePlace: z.string().optional(),
  issueDate: z.string().optional(),
  firstName: z.string().min(2, 'Requerido'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Requerido'),
  secondLastName: z.string().optional(),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'FREE_UNION']).optional(),
  nationality: z.string().optional(),
  bloodType: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  stateProvince: z.string().optional(),
  country: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  hireDate: z.string().min(1, 'Requerido'),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  status: z.string().min(1),
  eps: z.string().optional(),
  pensionFund: z.string().optional(),
  severanceFund: z.string().optional(),
  compensationFund: z.string().optional(),
  arl: z.string().optional(),
  arlRiskClass: z.coerce.number().min(1).max(5),
  contractType: z.string().min(1),
  baseSalary: z.coerce.number().positive('Debe ser mayor a 0'),
  startDate: z.string().min(1, 'Requerido'),
  isIntegralSalary: z.boolean(),
  transportAllowance: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
}

const today = new Date().toISOString().slice(0, 10);

const emptyDefaults: FormValues = {
  photoUrl: null,
  documentType: 'CC',
  documentNumber: '',
  issuePlace: '',
  issueDate: '',
  firstName: '',
  middleName: '',
  lastName: '',
  secondLastName: '',
  email: '',
  phone: '',
  mobile: '',
  birthDate: '',
  gender: undefined,
  maritalStatus: undefined,
  nationality: 'Colombiana',
  bloodType: '',
  address: '',
  city: '',
  stateProvince: '',
  country: 'Colombia',
  emergencyContactName: '',
  emergencyContactPhone: '',
  hireDate: today,
  departmentId: undefined,
  positionId: undefined,
  status: 'ACTIVE',
  eps: '',
  pensionFund: '',
  severanceFund: '',
  compensationFund: '',
  arl: '',
  arlRiskClass: 1,
  contractType: 'INDEFINITE',
  baseSalary: 0,
  startDate: today,
  isIntegralSalary: false,
  transportAllowance: true,
};

export function EmployeeForm({ open, onOpenChange, employee }: EmployeeFormProps) {
  const isEdit = !!employee;
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();
  const { data: documentTypes } = useOptions('DOCUMENT_TYPE');
  const { data: contractTypes } = useOptions('CONTRACT_TYPE');
  const { data: statuses } = useOptions('EMPLOYEE_STATUS');
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee(employee?.id ?? '');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: emptyDefaults });

  useEffect(() => {
    if (!open) return;
    if (employee) {
      const contract = employee.contracts?.[0];
      reset({
        photoUrl: employee.photoUrl ?? null,
        documentType: employee.documentType,
        documentNumber: employee.documentNumber,
        issuePlace: employee.issuePlace ?? '',
        issueDate: toDateInput(employee.issueDate),
        firstName: employee.firstName,
        middleName: employee.middleName ?? '',
        lastName: employee.lastName,
        secondLastName: employee.secondLastName ?? '',
        email: employee.email ?? '',
        phone: employee.phone ?? '',
        mobile: employee.mobile ?? '',
        birthDate: toDateInput(employee.birthDate),
        gender: employee.gender ?? undefined,
        maritalStatus: employee.maritalStatus ?? undefined,
        nationality: employee.nationality ?? '',
        bloodType: employee.bloodType ?? '',
        address: employee.address ?? '',
        city: employee.city ?? '',
        stateProvince: employee.stateProvince ?? '',
        country: employee.country ?? '',
        emergencyContactName: employee.emergencyContactName ?? '',
        emergencyContactPhone: employee.emergencyContactPhone ?? '',
        hireDate: toDateInput(employee.hireDate),
        departmentId: employee.departmentId ?? undefined,
        positionId: employee.positionId ?? undefined,
        status: employee.status,
        eps: employee.eps ?? '',
        pensionFund: employee.pensionFund ?? '',
        severanceFund: employee.severanceFund ?? '',
        compensationFund: employee.compensationFund ?? '',
        arl: employee.arl ?? '',
        arlRiskClass: employee.arlRiskClass,
        contractType: contract?.type ?? 'INDEFINITE',
        baseSalary: contract ? Number(contract.baseSalary) : 0,
        startDate: toDateInput(contract?.startDate ?? employee.hireDate),
        isIntegralSalary: contract?.isIntegralSalary ?? false,
        transportAllowance: contract?.transportAllowance ?? true,
      });
    } else {
      reset(emptyDefaults);
    }
  }, [open, employee, reset]);

  const onSubmit = async (values: FormValues) => {
    const opt = (v?: string) => (v && v.trim() ? v : undefined);
    const commonFields = {
      photoUrl: values.photoUrl ?? null,
      documentType: values.documentType,
      documentNumber: values.documentNumber,
      issuePlace: opt(values.issuePlace),
      issueDate: opt(values.issueDate),
      firstName: values.firstName,
      middleName: opt(values.middleName),
      lastName: values.lastName,
      secondLastName: opt(values.secondLastName),
      email: opt(values.email),
      phone: opt(values.phone),
      mobile: opt(values.mobile),
      birthDate: opt(values.birthDate),
      gender: values.gender || undefined,
      maritalStatus: values.maritalStatus || undefined,
      nationality: opt(values.nationality),
      bloodType: opt(values.bloodType),
      address: opt(values.address),
      city: opt(values.city),
      stateProvince: opt(values.stateProvince),
      country: opt(values.country),
      emergencyContactName: opt(values.emergencyContactName),
      emergencyContactPhone: opt(values.emergencyContactPhone),
      hireDate: values.hireDate,
      departmentId: values.departmentId || undefined,
      positionId: values.positionId || undefined,
      eps: opt(values.eps),
      pensionFund: opt(values.pensionFund),
      severanceFund: opt(values.severanceFund),
      compensationFund: opt(values.compensationFund),
      arl: opt(values.arl),
      arlRiskClass: values.arlRiskClass,
    };
    const contract = {
      type: values.contractType,
      baseSalary: values.baseSalary,
      startDate: values.startDate,
      isIntegralSalary: values.isIntegralSalary,
      transportAllowance: values.transportAllowance,
    };

    try {
      if (isEdit) {
        await updateEmployee.mutateAsync({ ...commonFields, status: values.status, contract });
        toast.success('Empleado actualizado correctamente');
      } else {
        await createEmployee.mutateAsync({ ...commonFields, contract });
        toast.success('Empleado creado correctamente');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const isPending = createEmployee.isPending || updateEmployee.isPending;
  const activeOptions = <T extends { isActive: boolean }>(o?: T[]) => o?.filter((x) => x.isActive);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar empleado' : 'Nuevo empleado'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualiza la información del colaborador.'
              : 'Completa la información para registrar un nuevo colaborador.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="personal">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="contacto">Contacto</TabsTrigger>
              <TabsTrigger value="laboral">Laboral</TabsTrigger>
              <TabsTrigger value="seguridad">Seg. Social</TabsTrigger>
              <TabsTrigger value="contrato">Contrato</TabsTrigger>
            </TabsList>

            {/* ---------- PERSONAL ---------- */}
            <TabsContent value="personal" className="space-y-4">
              <PhotoUpload
                value={watch('photoUrl')}
                onChange={(url) => setValue('photoUrl', url)}
                fallback={getInitials(watch('firstName'), watch('lastName'))}
              />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Tipo de documento">
                  <Select value={watch('documentType')} onValueChange={(v) => setValue('documentType', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeOptions(documentTypes)?.map((o) => (
                        <SelectItem key={o.id} value={o.code}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Número de documento" error={errors.documentNumber?.message}>
                  <Input {...register('documentNumber')} />
                </Field>
                <Field label="Lugar de expedición">
                  <Input {...register('issuePlace')} placeholder="Ciudad" />
                </Field>
                <Field label="Fecha de expedición">
                  <Input type="date" {...register('issueDate')} />
                </Field>
                <Field label="Grupo sanguíneo">
                  <Select value={watch('bloodType') || ''} onValueChange={(v) => setValue('bloodType', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_TYPES.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Primer nombre" error={errors.firstName?.message}>
                  <Input {...register('firstName')} />
                </Field>
                <Field label="Segundo nombre">
                  <Input {...register('middleName')} />
                </Field>
                <Field label="Primer apellido" error={errors.lastName?.message}>
                  <Input {...register('lastName')} />
                </Field>
                <Field label="Segundo apellido">
                  <Input {...register('secondLastName')} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Field label="Fecha nacimiento">
                  <Input type="date" {...register('birthDate')} />
                </Field>
                <Field label="Sexo">
                  <Select value={watch('gender') ?? ''} onValueChange={(v) => setValue('gender', v as FormValues['gender'])}>
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
                <Field label="Estado civil">
                  <Select
                    value={watch('maritalStatus') ?? ''}
                    onValueChange={(v) => setValue('maritalStatus', v as FormValues['maritalStatus'])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {MARITAL.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Nacionalidad">
                  <Input {...register('nationality')} />
                </Field>
              </div>
            </TabsContent>

            {/* ---------- CONTACTO ---------- */}
            <TabsContent value="contacto" className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Correo electrónico" error={errors.email?.message}>
                  <Input type="email" {...register('email')} />
                </Field>
                <Field label="Teléfono fijo">
                  <Input {...register('phone')} />
                </Field>
                <Field label="Celular">
                  <Input {...register('mobile')} />
                </Field>
              </div>
              <Field label="Dirección">
                <Input {...register('address')} />
              </Field>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Departamento">
                  <Select
                    value={watch('stateProvince') || ''}
                    onValueChange={(v) => setValue('stateProvince', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Ciudad / Municipio">
                  <Input list="city-suggestions" {...register('city')} placeholder="Escribe o elige" />
                  <datalist id="city-suggestions">
                    {(COLOMBIA[watch('stateProvince') ?? ''] ?? []).map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
                <Field label="País">
                  <Input list="country-suggestions" {...register('country')} />
                  <datalist id="country-suggestions">
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="mb-3 text-sm font-medium">Contacto de emergencia</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nombre">
                    <Input {...register('emergencyContactName')} />
                  </Field>
                  <Field label="Teléfono">
                    <Input {...register('emergencyContactPhone')} />
                  </Field>
                </div>
              </div>
            </TabsContent>

            {/* ---------- LABORAL ---------- */}
            <TabsContent value="laboral" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Fecha de ingreso" error={errors.hireDate?.message}>
                  <Input type="date" {...register('hireDate')} />
                </Field>
                <Field label="Estado">
                  <Select value={watch('status')} onValueChange={(v) => setValue('status', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeOptions(statuses)?.map((o) => (
                        <SelectItem key={o.id} value={o.code}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Área / Departamento">
                  <Select value={watch('departmentId') ?? ''} onValueChange={(v) => setValue('departmentId', v)}>
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
                <Field label="Cargo">
                  <Select value={watch('positionId') ?? ''} onValueChange={(v) => setValue('positionId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.code ? `${p.code} · ` : ''}
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </TabsContent>

            {/* ---------- SEGURIDAD SOCIAL ---------- */}
            <TabsContent value="seguridad" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="EPS (Salud)">
                  <Input {...register('eps')} placeholder="Ej: Sura EPS" />
                </Field>
                <Field label="Fondo de pensión">
                  <Input {...register('pensionFund')} placeholder="Ej: Porvenir" />
                </Field>
                <Field label="Fondo de cesantías">
                  <Input {...register('severanceFund')} placeholder="Ej: Porvenir" />
                </Field>
                <Field label="Caja de compensación">
                  <Input {...register('compensationFund')} placeholder="Ej: Compensar" />
                </Field>
                <Field label="ARL (entidad)">
                  <Input {...register('arl')} placeholder="Ej: Sura ARL" />
                </Field>
                <Field label="Nivel de riesgo ARL" error={errors.arlRiskClass?.message}>
                  <Select value={String(watch('arlRiskClass'))} onValueChange={(v) => setValue('arlRiskClass', Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Nivel I · Riesgo mínimo</SelectItem>
                      <SelectItem value="2">Nivel II · Riesgo bajo</SelectItem>
                      <SelectItem value="3">Nivel III · Riesgo medio</SelectItem>
                      <SelectItem value="4">Nivel IV · Riesgo alto</SelectItem>
                      <SelectItem value="5">Nivel V · Riesgo máximo</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </TabsContent>

            {/* ---------- CONTRATO ---------- */}
            <TabsContent value="contrato" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo de contrato">
                  <Select value={watch('contractType')} onValueChange={(v) => setValue('contractType', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeOptions(contractTypes)?.map((o) => (
                        <SelectItem key={o.id} value={o.code}>
                          {o.label}
                        </SelectItem>
                      ))}
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
                <Switch checked={watch('isIntegralSalary')} onCheckedChange={(c) => setValue('isIntegralSalary', c)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Auxilio de transporte</p>
                  <p className="text-xs text-muted-foreground">Aplica hasta 2 SMMLV</p>
                </div>
                <Switch checked={watch('transportAllowance')} onCheckedChange={(c) => setValue('transportAllowance', c)} />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Guardar empleado'}
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
