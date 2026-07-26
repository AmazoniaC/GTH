import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Correo electrónico inválido.'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    organizationName: z.string().min(2, 'El nombre de la empresa es obligatorio.'),
    nit: z.string().min(5, 'El NIT es obligatorio.'),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email('Correo electrónico inválido.'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10, 'Refresh token requerido.'),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RegisterInput = z.infer<typeof registerSchema>['body'];
