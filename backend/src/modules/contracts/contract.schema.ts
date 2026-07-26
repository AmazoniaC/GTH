import { z } from 'zod';
import { PaymentFrequency } from '@prisma/client';

export const employeeParam = z.object({
  params: z.object({ employeeId: z.string().cuid() }),
});

export const idParam = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export const addContractSchema = z.object({
  params: z.object({ employeeId: z.string().cuid() }),
  body: z.object({
    type: z.string().min(1),
    paymentFrequency: z.nativeEnum(PaymentFrequency).default(PaymentFrequency.MONTHLY),
    baseSalary: z.number().positive('El salario debe ser mayor a 0.'),
    isIntegralSalary: z.boolean().default(false),
    transportAllowance: z.boolean().default(true),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
    probationEndDate: z.coerce.date().optional().nullable(),
    notes: z.string().optional().nullable(),
    // Motivo de terminación del contrato anterior (si aplica).
    previousEndReason: z.string().optional().nullable(),
  }),
});

export const updateContractSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    type: z.string().min(1).optional(),
    paymentFrequency: z.nativeEnum(PaymentFrequency).optional(),
    baseSalary: z.number().positive().optional(),
    isIntegralSalary: z.boolean().optional(),
    transportAllowance: z.boolean().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional().nullable(),
    probationEndDate: z.coerce.date().optional().nullable(),
    endReason: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const addSalaryChangeSchema = z.object({
  params: z.object({ employeeId: z.string().cuid() }),
  body: z.object({
    newSalary: z.number().positive('El salario debe ser mayor a 0.'),
    effectiveDate: z.coerce.date(),
    reason: z.string().optional().nullable(),
  }),
});

export type AddContractInput = z.infer<typeof addContractSchema>['body'];
export type UpdateContractInput = z.infer<typeof updateContractSchema>['body'];
export type AddSalaryChangeInput = z.infer<typeof addSalaryChangeSchema>['body'];
