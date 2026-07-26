import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const createUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'El nombre es obligatorio.'),
    lastName: z.string().min(2, 'El apellido es obligatorio.'),
    email: z.string().email('Correo electrónico inválido.'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
    role: z.nativeEnum(UserRole),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    role: z.nativeEnum(UserRole).optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(6).optional().or(z.literal('')),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    password: z.string().min(6).optional().or(z.literal('')),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
