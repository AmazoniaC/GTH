import { NextFunction, Request, Response, Router } from 'express';
import { prisma } from '../../config/prisma';
import { isPlatformOwner } from '../../config/env';
import { authenticate } from '../../core/middlewares/auth.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ok } from '../../core/utils/apiResponse';
import { ForbiddenError } from '../../core/errors/AppError';

const router = Router();
router.use(authenticate);

/** Restringe el acceso al dueño de plataforma (configurado por correo). */
function requirePlatformOwner(req: Request, _res: Response, next: NextFunction) {
  if (!isPlatformOwner(req.auth?.email)) {
    throw new ForbiddenError('Acceso reservado al administrador de la plataforma.');
  }
  next();
}
router.use(requirePlatformOwner);

router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const [organizations, users, employees, activeEmployees] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
    ]);
    return ok(res, { organizations, users, employees, activeEmployees });
  }),
);

router.get(
  '/organizations',
  asyncHandler(async (_req, res) => {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        nit: true,
        city: true,
        email: true,
        isActive: true,
        createdAt: true,
        _count: { select: { users: true, employees: true } },
      },
    });
    return ok(res, orgs);
  }),
);

export const platformRoutes = router;
