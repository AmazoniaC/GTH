import { z } from 'zod';

const lineSchema = z.object({
  concept: z.string().min(1),
  amount: z.coerce.number(),
});

const computeBody = {
  employeeId: z.string().cuid(),
  terminationDate: z.coerce.date(),
  reason: z.string().min(1, 'El motivo del retiro es obligatorio.'),
  cesantiasFrom: z.coerce.date().optional().nullable(),
  primaFrom: z.coerce.date().optional().nullable(),
  pendingSalaryDays: z.coerce.number().int().min(0).max(31).optional(),
  extraEarnings: z.array(lineSchema).optional(),
  deductions: z.array(lineSchema).optional(),
  notes: z.string().optional().nullable(),
};

export const computeLiquidationSchema = z.object({ body: z.object(computeBody) });

export const createLiquidationSchema = z.object({
  body: z.object({ ...computeBody, markTerminated: z.boolean().optional() }),
});

export const idParamSchema = z.object({ params: z.object({ id: z.string().cuid() }) });

export type ComputeLiquidationInput = z.infer<typeof computeLiquidationSchema>['body'];
export type CreateLiquidationInput = z.infer<typeof createLiquidationSchema>['body'];
