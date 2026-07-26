import { Response } from 'express';

interface Meta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

/** Respuesta exitosa estándar de la API. */
export function ok<T>(res: Response, data: T, meta?: Meta, statusCode = 200) {
  return res.status(statusCode).json({
    status: 'success',
    data,
    ...(meta ? { meta } : {}),
  });
}

export function created<T>(res: Response, data: T) {
  return ok(res, data, undefined, 201);
}
