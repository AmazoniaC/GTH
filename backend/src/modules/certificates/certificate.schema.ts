import { z } from 'zod';

export const idParamSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export const createTemplateSchema = z.object({
  body: z.object({
    key: z.string().optional(),
    name: z.string().min(2, 'El nombre es obligatorio.'),
    body: z.string().min(1, 'El contenido es obligatorio.'),
    order: z.number().int().optional(),
  }),
});

export const updateTemplateSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    name: z.string().min(2).optional(),
    body: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
});

export const renderSchema = z.object({
  body: z.object({
    templateId: z.string().cuid(),
    employeeIds: z.array(z.string().cuid()).min(1, 'Selecciona al menos un empleado.'),
  }),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>['body'];
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>['body'];
export type RenderInput = z.infer<typeof renderSchema>['body'];
