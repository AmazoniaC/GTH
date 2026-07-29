import { Router } from 'express';
import { employeeController } from './employee.controller';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { requireModule } from '../../core/middlewares/module.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import {
  createEmployeeSchema,
  idParamSchema,
  listEmployeesSchema,
  updateEmployeeSchema,
} from './employee.schema';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(requireModule('EMPLOYEES'));

const managers = [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.SUPER_ADMIN];

router.get('/', validate(listEmployeesSchema), asyncHandler(employeeController.list));
router.get('/select', asyncHandler(employeeController.selectList));
router.get('/org-chart', asyncHandler(employeeController.orgChart));
router.get('/export', asyncHandler(employeeController.exportAll));
router.get('/by-document/:documentNumber', asyncHandler(employeeController.getByDocument));
router.get('/:id', validate(idParamSchema), asyncHandler(employeeController.getById));
router.post(
  '/',
  authorize(...managers),
  validate(createEmployeeSchema),
  asyncHandler(employeeController.create),
);
router.put(
  '/:id',
  authorize(...managers),
  validate(updateEmployeeSchema),
  asyncHandler(employeeController.update),
);
router.delete(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate(idParamSchema),
  asyncHandler(employeeController.remove),
);

export const employeeRoutes = router;
