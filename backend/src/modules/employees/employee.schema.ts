import { z } from 'zod';
import { Gender, MaritalStatus, PaymentFrequency } from '@prisma/client';

// Tipo de documento y tipo de contrato son catálogos editables (texto libre
// validado contra las opciones configuradas en Configuración).
const contractSchema = z.object({
  type: z.string().min(1).default('INDEFINITE'),
  paymentFrequency: z.nativeEnum(PaymentFrequency).default(PaymentFrequency.MONTHLY),
  baseSalary: z.number().positive('El salario debe ser mayor a 0.'),
  isIntegralSalary: z.boolean().default(false),
  transportAllowance: z.boolean().default(true),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
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
};

export const createEmployeeSchema = z.object({
  body: z.object({
    ...employeeBase,
    contract: contractSchema,
  }),
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
    .extend({ contract: contractUpdateSchema.optional() }),
});

export const listEmployeesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().optional(),
    status: z.string().optional(),
    departmentId: z.string().optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>['body'];
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>['body'];
export type ListEmployeesQuery = z.infer<typeof listEmployeesSchema>['query'];
