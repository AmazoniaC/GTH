import { Router, Request } from 'express';
import { UserRole } from '@prisma/client';
import { importService } from './import.service';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { requireModule } from '../../core/middlewares/module.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ok } from '../../core/utils/apiResponse';
import { importEmployeesSchema } from './import.schema';
import { actorOf } from '../../core/utils/request';

const router = Router();
router.use(authenticate);
router.use(requireModule('EMPLOYEES'));

router.post(
  '/employees',
  authorize(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.SUPER_ADMIN),
  validate(importEmployeesSchema),
  asyncHandler(async (req, res) => {
    const result = await importService.importEmployees(
      req.auth!.organizationId,
      req.body.rows,
      actorOf(req),
    );
    return ok(res, result);
  }),
);

export const importRoutes = router;
