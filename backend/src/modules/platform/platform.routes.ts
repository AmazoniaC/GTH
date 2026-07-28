import { NextFunction, Request, Response, Router } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { isPlatformOwner, PLATFORM_ORG_NIT } from '../../config/env';
import { authenticate } from '../../core/middlewares/auth.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ok } from '../../core/utils/apiResponse';
import { AppError, ConflictError, ForbiddenError } from '../../core/errors/AppError';
import { signAccessToken, signRefreshToken } from '../../core/utils/jwt';
import { hashPassword } from '../../core/utils/password';
import { DEFAULT_MODULES, sanitizeModules } from '../../config/modules';

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
        modules: true,
        maxEmployees: true,
        createdAt: true,
        _count: { select: { users: true, employees: true } },
      },
    });
    return ok(res, orgs);
  }),
);

/** Crea una nueva empresa junto con su usuario administrador. */
router.post(
  '/organizations',
  asyncHandler(async (req, res) => {
    const {
      organizationName,
      nit,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword,
      maxEmployees,
      modules,
    } = req.body ?? {};

    if (!organizationName || !nit || !adminEmail || !adminPassword) {
      throw new AppError('Faltan datos obligatorios de la empresa o del administrador.', 400);
    }
    if (String(adminPassword).length < 6) {
      throw new AppError('La contraseña del administrador debe tener al menos 6 caracteres.', 400);
    }

    const email = String(adminEmail).trim().toLowerCase();
    if (await prisma.user.findUnique({ where: { email } })) {
      throw new ConflictError('El correo del administrador ya está registrado.');
    }
    if (await prisma.organization.findUnique({ where: { nit: String(nit).trim() } })) {
      throw new ConflictError('El NIT ya está registrado.');
    }

    const selectedModules = Array.isArray(modules) ? sanitizeModules(modules) : DEFAULT_MODULES;
    const limit =
      maxEmployees === null || maxEmployees === undefined || maxEmployees === ''
        ? null
        : Math.max(0, Number(maxEmployees)) || null;
    const passwordHash = await hashPassword(String(adminPassword));

    const org = await prisma.organization.create({
      data: {
        name: String(organizationName).trim(),
        nit: String(nit).trim(),
        modules: selectedModules,
        maxEmployees: limit,
        users: {
          create: {
            email,
            password: passwordHash,
            firstName: String(adminFirstName ?? 'Administrador').trim(),
            lastName: String(adminLastName ?? '').trim(),
            role: UserRole.ADMIN,
          },
        },
      },
      select: {
        id: true,
        name: true,
        nit: true,
        city: true,
        email: true,
        isActive: true,
        modules: true,
        maxEmployees: true,
        createdAt: true,
        _count: { select: { users: true, employees: true } },
      },
    });
    return ok(res, org, undefined, 201);
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

/**
 * Actualiza la configuración de una empresa: estado (activa/inactiva),
 * nombre, módulos activos y límite de empleados. Solo se tocan los campos
 * enviados en el cuerpo.
 */
router.patch(
  '/organizations/:id',
  asyncHandler(async (req, res) => {
    await findRealOrg(req.params.id);
    const body = req.body ?? {};
    const data: Record<string, unknown> = {};

    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (Array.isArray(body.modules)) data.modules = sanitizeModules(body.modules);
    if (body.maxEmployees !== undefined) {
      data.maxEmployees =
        body.maxEmployees === null || body.maxEmployees === ''
          ? null
          : Math.max(0, Number(body.maxEmployees)) || null;
    }

    const org = await prisma.organization.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true,
        name: true,
        nit: true,
        city: true,
        email: true,
        isActive: true,
        modules: true,
        maxEmployees: true,
        createdAt: true,
        _count: { select: { users: true, employees: true } },
      },
    });
    return ok(res, org);
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
