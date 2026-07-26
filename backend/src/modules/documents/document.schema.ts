import { z } from 'zod';

export const listDocumentsSchema = z.object({
  query: z.object({ employeeId: z.string().cuid() }),
});

export const createDocumentSchema = z.object({
  body: z.object({
    employeeId: z.string().cuid(),
    type: z.string().min(1),
    name: z.string().min(1, 'El nombre es obligatorio.'),
    fileName: z.string().min(1),
    mimeType: z.string().min(1),
    size: z.number().int().nonnegative(),
    content: z.string().min(1, 'El archivo es obligatorio.'),
    issueDate: z.coerce.date().optional().nullable(),
    expiryDate: z.coerce.date().optional().nullable(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>['body'];
