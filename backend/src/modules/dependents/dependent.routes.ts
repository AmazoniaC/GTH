import { Router, Request } from 'express';
import { UserRole } from '@prisma/client';
import { dependentService } from './dependent.service';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { created, ok } from '../../core/utils/apiResponse';
import { createDependentSchema, employeeParam, idParam, updateDependentSchema } from './dependent.schema';
import type { Actor } from '../audit/audit.service';

const router = Router();
router.use(authenticate);

const managers = [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.SUPER_ADMIN];
const actorOf = (req: Request): Actor => ({ userId: req.auth!.sub, userName: req.auth!.email });

router.get(
  '/employees/:employeeId/dependents',
  validate(employeeParam),
  asyncHandler(async (req, res) =>
    ok(res, await dependentService.list(req.params.employeeId, req.auth!.organizationId)),
  ),
);
router.post(
  '/employees/:employeeId/dependents',
  authorize(...managers),
  validate(createDependentSchema),
  asyncHandler(async (req, res) =>
    created(
      res,
      await dependentService.create(
        req.params.employeeId,
        req.auth!.organizationId,
        req.body,
        actorOf(req),
      ),
    ),
  ),
);
router.put(
  '/dependents/:id',
  authorize(...managers),
  validate(updateDependentSchema),
  asyncHandler(async (req, res) =>
    ok(res, await dependentService.update(req.params.id, req.auth!.organizationId, req.body, actorOf(req))),
  ),
);
router.delete(
  '/dependents/:id',
  authorize(...managers),
  validate(idParam),
  asyncHandler(async (req, res) =>
    ok(res, await dependentService.remove(req.params.id, req.auth!.organizationId, actorOf(req))),
  ),
);

export const dependentRoutes = router;
