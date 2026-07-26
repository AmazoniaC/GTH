import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

/**
 * Valida `body`, `query` y `params` de la petición contra un esquema Zod.
 * Si es válido, reemplaza los valores por los ya parseados/tipados.
 */
export const validate =
  (schema: Schema) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      const data = parsed as { body?: unknown; query?: unknown; params?: unknown };
      if (data.body !== undefined) req.body = data.body;
      if (data.query !== undefined) Object.assign(req.query, data.query);
      if (data.params !== undefined) Object.assign(req.params, data.params);
      next();
    } catch (error) {
      next(error);
    }
  };
