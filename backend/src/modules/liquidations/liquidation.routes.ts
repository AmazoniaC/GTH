import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { liquidationController } from './liquidation.controller';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { requireModule } from '../../core/middlewares/module.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import {
  computeLiquidationSchema,
  createLiquidationSchema,
  idParamSchema,
} from './liquidation.schema';

const router = Router();
router.use(authenticate);
router.use(requireModule('PAYROLL'));

const managers = [UserRole.ADMIN, UserRole.PAYROLL_MANAGER, UserRole.SUPER_ADMIN];

router.get('/reasons', asyncHandler(liquidationController.reasons));
router.get('/', asyncHandler(liquidationController.list));
router.post(
  '/compute',
  authorize(...managers),
  validate(computeLiquidationSchema),
  asyncHandler(liquidationController.compute),
);
router.post(
  '/',
  authorize(...managers),
  validate(createLiquidationSchema),
  asyncHandler(liquidationController.create),
);
router.get('/:id', validate(idParamSchema), asyncHandler(liquidationController.getById));
router.delete(
  '/:id',
  authorize(...managers),
  validate(idParamSchema),
  asyncHandler(liquidationController.remove),
);

export const liquidationRoutes = router;
