import { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { JwtPayload, verifyAccessToken } from '../utils/jwt';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError';

// Extiende el tipo Request de Express para incluir el usuario autenticado.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

/**
 * Verifica el token JWT del header Authorization y adjunta el payload
 * a `req.auth`.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de acceso no proporcionado.');
  }
  const token = header.slice(7);
  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    throw new UnauthorizedError('Token de acceso inválido o expirado.');
  }
}

/**
 * Restringe el acceso a los roles indicados. Debe usarse después de
 * `authenticate`.
 */
export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw new UnauthorizedError();
    if (roles.length && !roles.includes(req.auth.role)) {
      throw new ForbiddenError();
    }
    next();
  };
