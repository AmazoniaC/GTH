import { z } from 'zod';
import { PayrollPeriodType, PayrollStatus } from '@prisma/client';

export const createPeriodSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'El nombre del periodo es obligatorio.'),
    type: z.nativeEnum(PayrollPeriodType).default(PayrollPeriodType.MONTHLY),
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
    paymentDate: z.coerce.date().optional().nullable(),
    workedDays: z.number().int().min(1).max(30).default(30),
  }),
});

export const updatePeriodStatusSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    status: z.nativeEnum(PayrollStatus),
  }),
});

export const listPeriodsSchema = z.object({
  query: z.object({
    year: z.coerce.number().int().optional(),
    status: z.nativeEnum(PayrollStatus).optional(),
  }),
});

export const simulateSchema = z.object({
  body: z.object({
    baseSalary: z.number().positive(),
    workedDays: z.number().int().min(1).max(30).default(30),
    hasTransportAllowance: z.boolean().default(true),
    isIntegralSalary: z.boolean().default(false),
    arlRiskClass: z.number().int().min(1).max(5).default(1),
    year: z.number().int().optional(),
  }),
});

export const upsertConfigSchema = z.object({
  body: z.object({
    year: z.number().int().min(2000).max(2100),
    minimumWage: z.number().positive(),
    transportAllowance: z.number().min(0),
    uvt: z.number().positive(),
    healthEmployeeRate: z.number().min(0).max(1).optional(),
    healthEmployerRate: z.number().min(0).max(1).optional(),
    pensionEmployeeRate: z.number().min(0).max(1).optional(),
    pensionEmployerRate: z.number().min(0).max(1).optional(),
    senaRate: z.number().min(0).max(1).optional(),
    icbfRate: z.number().min(0).max(1).optional(),
    compensationFundRate: z.number().min(0).max(1).optional(),
    severanceRate: z.number().min(0).max(1).optional(),
    severanceInterestRate: z.number().min(0).max(1).optional(),
    serviceBonusRate: z.number().min(0).max(1).optional(),
    vacationRate: z.number().min(0).max(1).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export type CreatePeriodInput = z.infer<typeof createPeriodSchema>['body'];
export type SimulateInput = z.infer<typeof simulateSchema>['body'];
export type UpsertConfigInput = z.infer<typeof upsertConfigSchema>['body'];
