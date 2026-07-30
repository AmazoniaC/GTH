import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { absenceController } from './absence.controller';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { requireModule } from '../../core/middlewares/module.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import {
  balanceParamSchema,
  createAbsenceSchema,
  createAdjustmentSchema,
  idParamSchema,
  listAbsencesSchema,
  reviewSchema,
  updateAbsenceSchema,
} from './absence.schema';

const router = Router();
router.use(authenticate);
router.use(requireModule('EMPLOYEES'));

// Gestión reservada a RRHH/Admin.
const managers = [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.SUPER_ADMIN];

router.get('/', validate(listAbsencesSchema), asyncHandler(absenceController.list));

// Aprobaciones (RRHH/Admin): solicitudes pendientes de toda la empresa.
router.get('/approvals', authorize(...managers), asyncHandler(absenceController.approvals));
router.get('/pending-count', authorize(...managers), asyncHandler(absenceController.pendingCount));
router.patch(
  '/:id/review',
  authorize(...managers),
  validate(reviewSchema),
  asyncHandler(absenceController.review),
);

router.get(
  '/employees/:employeeId/balance',
  validate(balanceParamSchema),
  asyncHandler(absenceController.balance),
);

router.post(
  '/adjustments',
  authorize(...managers),
  validate(createAdjustmentSchema),
  asyncHandler(absenceController.addAdjustment),
);

router.post(
  '/',
  authorize(...managers),
  validate(createAbsenceSchema),
  asyncHandler(absenceController.create),
);

router.get('/:id', validate(idParamSchema), asyncHandler(absenceController.getById));

router.patch(
  '/:id',
  authorize(...managers),
  validate(updateAbsenceSchema),
  asyncHandler(absenceController.update),
);

router.delete(
  '/:id',
  authorize(...managers),
  validate(idParamSchema),
  asyncHandler(absenceController.remove),
);

export const absenceRoutes = router;
