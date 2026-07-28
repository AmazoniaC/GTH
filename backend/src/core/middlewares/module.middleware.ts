import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError';
import type { ModuleKey } from '../../config/modules';

/**
 * Bloquea el acceso a un módulo si la empresa (organización) no lo tiene
 * activo. El dueño de la plataforma asigna los módulos por empresa.
 */
export function requireModule(moduleKey: ModuleKey) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(new UnauthorizedError());
    const org = await prisma.organization.findUnique({
      where: { id: req.auth.organizationId },
      select: { modules: true },
    });
    if (!org || !org.modules.includes(moduleKey)) {
      return next(new ForbiddenError('Este módulo no está activo para tu empresa.'));
    }
    next();
  };
}
