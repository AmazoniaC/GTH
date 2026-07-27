import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { customFieldService } from './customfield.service';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { created, ok } from '../../core/utils/apiResponse';

const router = Router();
router.use(authenticate);
const admins = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

const createSchema = z.object({
  body: z.object({
    label: z.string().min(1),
    type: z.enum(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT']),
    options: z.array(z.string()).optional(),
    section: z.string().optional(),
  }),
});

const updateSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    label: z.string().min(1).optional(),
    options: z.array(z.string()).optional(),
    section: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

const idParam = z.object({ params: z.object({ id: z.string().cuid() }) });

// Cualquier usuario autenticado puede leer las definiciones (para render).
router.get('/', asyncHandler(async (req, res) =>
  ok(res, await customFieldService.list(req.auth!.organizationId)),
));
router.post('/', authorize(...admins), validate(createSchema), asyncHandler(async (req, res) =>
  created(res, await customFieldService.create(req.auth!.organizationId, req.body)),
));
router.put('/:id', authorize(...admins), validate(updateSchema), asyncHandler(async (req, res) =>
  ok(res, await customFieldService.update(req.params.id, req.auth!.organizationId, req.body)),
));
router.delete('/:id', authorize(...admins), validate(idParam), asyncHandler(async (req, res) =>
  ok(res, await customFieldService.remove(req.params.id, req.auth!.organizationId)),
));

export const customFieldRoutes = router;
