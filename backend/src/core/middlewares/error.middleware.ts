import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { env } from '../../config/env';

/**
 * Middleware central de manejo de errores. Traduce errores conocidos
 * (Zod, Prisma, AppError) a respuestas HTTP consistentes.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      status: 'error',
      message: 'Datos de entrada inválidos.',
      errors: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        status: 'error',
        message: 'Ya existe un registro con estos datos únicos.',
        details: err.meta?.target,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ status: 'error', message: 'Registro no encontrado.' });
    }
    // Tabla o columna inexistente: la base de datos está desactualizada.
    if (err.code === 'P2021' || err.code === 'P2022') {
      return res.status(500).json({
        status: 'error',
        message:
          'La base de datos está desactualizada. Ejecuta las migraciones: ' +
          'cd backend && npx prisma migrate dev',
      });
    }
  }

  // Cliente de Prisma desactualizado (validación de argumentos desconocidos).
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(500).json({
      status: 'error',
      message:
        'El cliente de la base de datos está desactualizado. Ejecuta: ' +
        'cd backend && npx prisma generate (o npx prisma migrate dev).',
    });
  }

  // eslint-disable-next-line no-console
  console.error('[UnhandledError]', err);

  return res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor.',
    ...(env.isProduction ? {} : { stack: (err as Error)?.stack }),
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ status: 'error', message: 'Ruta no encontrada.' });
}
