import { z } from 'zod';
import { AbsenceStatus } from '@prisma/client';

const bodyBase = {
  employeeId: z.string().cuid(),
  type: z.string().min(1, 'El tipo de ausencia es obligatorio.'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.nativeEnum(AbsenceStatus).optional(),
  entity: z.string().optional().nullable(),
  supportNumber: z.string().optional().nullable(),
  diagnosis: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  documentUrl: z.string().optional().nullable(),
};

export const createAbsenceSchema = z.object({
  body: z
    .object(bodyBase)
    .refine((v) => v.endDate >= v.startDate, {
      message: 'La fecha de fin no puede ser anterior a la de inicio.',
      path: ['endDate'],
    }),
});

export const updateAbsenceSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z
    .object({ ...bodyBase, employeeId: z.string().cuid().optional() })
    .partial()
    .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
      message: 'La fecha de fin no puede ser anterior a la de inicio.',
      path: ['endDate'],
    }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export const listAbsencesSchema = z.object({
  query: z.object({
    employeeId: z.string().cuid().optional(),
    type: z.string().optional(),
    status: z.nativeEnum(AbsenceStatus).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
});

export const balanceParamSchema = z.object({
  params: z.object({ employeeId: z.string().cuid() }),
});

export const createAdjustmentSchema = z.object({
  body: z.object({
    employeeId: z.string().cuid(),
    days: z.coerce.number().refine((n) => n !== 0, 'Los días no pueden ser cero.'),
    reason: z.string().optional().nullable(),
    effectiveDate: z.coerce.date().optional(),
  }),
});

export const reviewSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    decision: z.enum(['APPROVE', 'REJECT']),
    note: z.string().optional().nullable(),
  }),
});

export const createRequestSchema = z.object({
  body: z
    .object({
      type: z.string().min(1, 'El tipo es obligatorio.'),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      reason: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
    .refine((v) => v.endDate >= v.startDate, {
      message: 'La fecha de fin no puede ser anterior a la de inicio.',
      path: ['endDate'],
    }),
});

export type ReviewInput = z.infer<typeof reviewSchema>['body'];
export type CreateRequestInput = z.infer<typeof createRequestSchema>['body'];
export type CreateAbsenceInput = z.infer<typeof createAbsenceSchema>['body'];
export type UpdateAbsenceInput = z.infer<typeof updateAbsenceSchema>['body'];
export type ListAbsencesQuery = z.infer<typeof listAbsencesSchema>['query'];
export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>['body'];
