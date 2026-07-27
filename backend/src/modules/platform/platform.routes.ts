import { NextFunction, Request, Response, Router } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { isPlatformOwner, PLATFORM_ORG_NIT } from '../../config/env';
import { authenticate } from '../../core/middlewares/auth.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ok } from '../../core/utils/apiResponse';
import { AppError, ForbiddenError } from '../../core/errors/AppError';
import { signAccessToken, signRefreshToken } from '../../core/utils/jwt';

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

// Excluye la organización interna de la plataforma de listados y conteos.
const realOrgWhere = { nit: { not: PLATFORM_ORG_NIT } };

router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const realOrgIds = (
      await prisma.organization.findMany({ where: realOrgWhere, select: { id: true } })
    ).map((o) => o.id);

    const [organizations, users, employees, activeEmployees] = await Promise.all([
      prisma.organization.count({ where: realOrgWhere }),
      prisma.user.count({ where: { organizationId: { in: realOrgIds } } }),
      prisma.employee.count({ where: { organizationId: { in: realOrgIds } } }),
      prisma.employee.count({
        where: { organizationId: { in: realOrgIds }, status: 'ACTIVE' },
      }),
    ]);
    return ok(res, { organizations, users, employees, activeEmployees });
  }),
);

router.get(
  '/organizations',
  asyncHandler(async (_req, res) => {
    const orgs = await prisma.organization.findMany({
      where: realOrgWhere,
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

/** Busca una empresa real (no la organización interna de la plataforma). */
async function findRealOrg(id: string) {
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org || org.nit === PLATFORM_ORG_NIT) {
    throw new AppError('Empresa no encontrada.', 404);
  }
  return org;
}

/** Activa/desactiva una empresa (bloquea o habilita sus accesos). */
router.patch(
  '/organizations/:id',
  asyncHandler(async (req, res) => {
    await findRealOrg(req.params.id);
    const isActive = Boolean(req.body?.isActive);
    const org = await prisma.organization.update({
      where: { id: req.params.id },
      data: { isActive },
    });
    return ok(res, { id: org.id, isActive: org.isActive });
  }),
);

/** Elimina una empresa por completo (en cascada: usuarios, empleados, etc.). */
router.delete(
  '/organizations/:id',
  asyncHandler(async (req, res) => {
    await findRealOrg(req.params.id);
    await prisma.organization.delete({ where: { id: req.params.id } });
    return ok(res, { id: req.params.id, deleted: true });
  }),
);

/**
 * Entra como soporte a una empresa (impersonación). Emite tokens con la
 * identidad de un administrador de la empresa para poder brindar soporte.
 */
router.post(
  '/organizations/:id/impersonate',
  asyncHandler(async (req, res) => {
    const org = await findRealOrg(req.params.id);

    // Prefiere un administrador; si no hay, cualquier usuario activo.
    const target =
      (await prisma.user.findFirst({
        where: {
          organizationId: org.id,
          isActive: true,
          role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
        },
        orderBy: { createdAt: 'asc' },
      })) ??
      (await prisma.user.findFirst({
        where: { organizationId: org.id, isActive: true },
        orderBy: { createdAt: 'asc' },
      }));

    if (!target) {
      throw new AppError('La empresa no tiene usuarios activos para ingresar como soporte.', 409);
    }

    const payload = {
      sub: target.id,
      organizationId: target.organizationId,
      role: target.role,
      email: target.email,
    };

    return ok(res, {
      user: {
        id: target.id,
        email: target.email,
        firstName: target.firstName,
        lastName: target.lastName,
        role: target.role,
        organizationId: target.organizationId,
        avatarUrl: target.avatarUrl,
        isPlatformOwner: false,
        impersonating: { organizationName: org.name },
      },
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    });
  }),
);

export const platformRoutes = router;
