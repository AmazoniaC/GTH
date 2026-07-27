import { z } from 'zod';
import { Gender } from '@prisma/client';

export const employeeParam = z.object({
  params: z.object({ employeeId: z.string().cuid() }),
});

export const idParam = z.object({
  params: z.object({ id: z.string().cuid() }),
});

const body = {
  relationship: z.string().min(1, 'El parentesco es obligatorio.'),
  firstName: z.string().min(2, 'El nombre es obligatorio.'),
  lastName: z.string().min(2, 'El apellido es obligatorio.'),
  documentType: z.string().optional().nullable(),
  documentNumber: z.string().optional().nullable(),
  birthDate: z.coerce.date().optional().nullable(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  isBeneficiary: z.boolean().default(true),
  notes: z.string().optional().nullable(),
};

export const createDependentSchema = z.object({
  params: z.object({ employeeId: z.string().cuid() }),
  body: z.object(body),
});

export const updateDependentSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object(body).partial(),
});

export type CreateDependentInput = z.infer<typeof createDependentSchema>['body'];
export type UpdateDependentInput = z.infer<typeof updateDependentSchema>['body'];
