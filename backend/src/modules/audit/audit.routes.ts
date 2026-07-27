import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { auditService } from './audit.service';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ok } from '../../core/utils/apiResponse';

const router = Router();
router.use(authenticate);

const listSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    entity: z.string().optional(),
    action: z.string().optional(),
  }),
});

router.get(
  '/',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(listSchema),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as { page: number; pageSize: number; entity?: string; action?: string };
    const { items, total } = await auditService.list(req.auth!.organizationId, q);
    return ok(res, items, {
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.ceil(total / q.pageSize) || 1,
    });
  }),
);

export const auditRoutes = router;
