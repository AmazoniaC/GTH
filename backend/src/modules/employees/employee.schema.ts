import { z } from 'zod';
import { Gender, MaritalStatus, PaymentFrequency } from '@prisma/client';

const MIN_AGE = 18;
const MAX_AGE = 100;

function ageYears(d: Date): number {
  const now = new Date();
  let a = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) a -= 1;
  return a;
}

/** Validaciones cruzadas de fechas del empleado (nacimiento, ingreso, expedición). */
function refineEmployeeDates(
  v: { birthDate?: Date | null; hireDate?: Date | null; issueDate?: Date | null },
  ctx: z.RefinementCtx,
) {
  const today = new Date();
  if (v.birthDate) {
    if (v.birthDate >= today) {
      ctx.addIssue({ code: 'custom', path: ['birthDate'], message: 'La fecha de nacimiento debe ser pasada.' });
    } else {
      const age = ageYears(v.birthDate);
      if (age < MIN_AGE)
        ctx.addIssue({ code: 'custom', path: ['birthDate'], message: `El empleado debe ser mayor de edad (${MIN_AGE} años).` });
      if (age > MAX_AGE)
        ctx.addIssue({ code: 'custom', path: ['birthDate'], message: 'La fecha de nacimiento no es válida.' });
    }
  }
  if (v.hireDate) {
    if (v.hireDate > today)
      ctx.addIssue({ code: 'custom', path: ['hireDate'], message: 'La fecha de ingreso no puede ser futura.' });
    if (v.hireDate.getUTCFullYear() < 1950)
      ctx.addIssue({ code: 'custom', path: ['hireDate'], message: 'La fecha de ingreso no es válida.' });
  }
  if (v.issueDate) {
    if (v.issueDate > today)
      ctx.addIssue({ code: 'custom', path: ['issueDate'], message: 'La fecha de expedición no puede ser futura.' });
    if (v.birthDate && v.issueDate < v.birthDate)
      ctx.addIssue({ code: 'custom', path: ['issueDate'], message: 'La expedición no puede ser anterior al nacimiento.' });
  }
}

// Tipo de documento y tipo de contrato son catálogos editables (texto libre
// validado contra las opciones configuradas en Configuración).
const contractSchema = z
  .object({
    type: z.string().min(1).default('INDEFINITE'),
    paymentFrequency: z.nativeEnum(PaymentFrequency).default(PaymentFrequency.MONTHLY),
    baseSalary: z.number().positive('El salario debe ser mayor a 0.'),
    isIntegralSalary: z.boolean().default(false),
    transportAllowance: z.boolean().default(true),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
    probationEndDate: z.coerce.date().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine((v) => !v.endDate || v.endDate >= v.startDate, {
    message: 'La fecha de fin del contrato no puede ser anterior al inicio.',
    path: ['endDate'],
  });

const employeeBase = {
  documentType: z.string().min(1).default('CC'),
  documentNumber: z.string().min(3, 'Número de documento inválido.'),
  photoUrl: z.string().optional().nullable(),
  employeeCode: z.string().min(1).optional(),
  issuePlace: z.string().optional().nullable(),
  issueDate: z.coerce.date().optional().nullable(),
  firstName: z.string().min(2, 'El nombre es obligatorio.'),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(2, 'El apellido es obligatorio.'),
  secondLastName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  birthDate: z.coerce.date().optional().nullable(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  maritalStatus: z.nativeEnum(MaritalStatus).optional().nullable(),
  nationality: z.string().optional().nullable(),
  bloodType: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  stateProvince: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  costCenter: z.string().optional().nullable(),
  workLocation: z.string().optional().nullable(),
  hireDate: z.coerce.date(),
  status: z.string().min(1).default('ACTIVE'),
  eps: z.string().optional().nullable(),
  pensionFund: z.string().optional().nullable(),
  severanceFund: z.string().optional().nullable(),
  compensationFund: z.string().optional().nullable(),
  arl: z.string().optional().nullable(),
  arlRiskClass: z.number().int().min(1).max(5).default(1),
  bankName: z.string().optional().nullable(),
  bankAccountType: z.string().optional().nullable(),
  bankAccountNumber: z.string().optional().nullable(),
  customFields: z.record(z.any()).optional().nullable(),
  dataConsent: z.boolean().optional(),
};

export const createEmployeeSchema = z.object({
  body: z
    .object({
      ...employeeBase,
      contract: contractSchema,
    })
    .superRefine(refineEmployeeDates),
});

const contractUpdateSchema = z
  .object({
    type: z.string().min(1),
    paymentFrequency: z.nativeEnum(PaymentFrequency),
    baseSalary: z.number().positive('El salario debe ser mayor a 0.'),
    isIntegralSalary: z.boolean(),
    transportAllowance: z.boolean(),
    startDate: z.coerce.date(),
  })
  .partial();

export const updateEmployeeSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z
    .object({ ...employeeBase })
    .partial()
    .extend({ contract: contractUpdateSchema.optional() })
    .superRefine(refineEmployeeDates),
});

export const listEmployeesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().optional(),
    status: z.string().optional(),
    departmentId: z.string().optional(),
    positionId: z.string().optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>['body'];
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>['body'];
export type ListEmployeesQuery = z.infer<typeof listEmployeesSchema>['query'];
