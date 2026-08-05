import { z } from 'zod';
import { NoveltyKind } from '@prisma/client';

const body = {
  employeeId: z.string().cuid(),
  kind: z.nativeEnum(NoveltyKind),
  code: z.string().min(1),
  concept: z.string().optional().nullable(),
  amount: z.coerce.number().optional(),
  hours: z.coerce.number().positive().optional(),
  recurring: z.boolean().default(false),
  installments: z.coerce.number().int().positive().optional().nullable(),
  year: z.coerce.number().int().optional().nullable(),
  month: z.coerce.number().int().min(1).max(12).optional().nullable(),
  notes: z.string().optional().nullable(),
};

export const createNoveltySchema = z.object({ body: z.object(body) });

export const updateNoveltySchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    concept: z.string().optional(),
    amount: z.coerce.number().optional(),
    isActive: z.boolean().optional(),
    installments: z.coerce.number().int().positive().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const idParamSchema = z.object({ params: z.object({ id: z.string().cuid() }) });

export const listNoveltiesSchema = z.object({
  query: z.object({
    employeeId: z.string().cuid().optional(),
    kind: z.nativeEnum(NoveltyKind).optional(),
    active: z.enum(['true', 'false']).optional(),
  }),
});

export type CreateNoveltyInput = z.infer<typeof createNoveltySchema>['body'];
export type UpdateNoveltyInput = z.infer<typeof updateNoveltySchema>['body'];
export type ListNoveltiesQuery = z.infer<typeof listNoveltiesSchema>['query'];
