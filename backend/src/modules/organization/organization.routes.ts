import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ok } from '../../core/utils/apiResponse';
import { NotFoundError } from '../../core/errors/AppError';

const router = Router();
router.use(authenticate);

const orgSelect = {
  id: true,
  name: true,
  nit: true,
  legalName: true,
  legalRepresentative: true,
  address: true,
  city: true,
  phone: true,
  email: true,
  website: true,
  logoUrl: true,
};

const updateSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    nit: z.string().min(3).optional(),
    legalName: z.string().optional().nullable(),
    legalRepresentative: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal('')),
    website: z.string().optional().nullable(),
    logoUrl: z.string().optional().nullable(),
  }),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const org = await prisma.organization.findUnique({
      where: { id: req.auth!.organizationId },
      select: orgSelect,
    });
    if (!org) throw new NotFoundError('Empresa');
    return ok(res, org);
  }),
);

router.put(
  '/',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const org = await prisma.organization.update({
      where: { id: req.auth!.organizationId },
      data: req.body,
      select: orgSelect,
    });
    return ok(res, org);
  }),
);

export const organizationRoutes = router;
