import { NextFunction, Request, Response } from 'express';

type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Envuelve un controlador asíncrono y reenvía cualquier error al
 * middleware de manejo de errores, evitando repetir try/catch.
 */
export const asyncHandler =
  (fn: AsyncController) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
