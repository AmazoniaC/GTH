import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { contractController } from './contract.controller';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import {
  addContractSchema,
  addSalaryChangeSchema,
  employeeParam,
  idParam,
  updateContractSchema,
} from './contract.schema';

const router = Router();
router.use(authenticate);

const managers = [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.SUPER_ADMIN];

// Historial de contratos por empleado
router.get(
  '/employees/:employeeId/contracts',
  validate(employeeParam),
  asyncHandler(contractController.list),
);
router.post(
  '/employees/:employeeId/contracts',
  authorize(...managers),
  validate(addContractSchema),
  asyncHandler(contractController.add),
);

// Historial salarial por empleado
router.get(
  '/employees/:employeeId/salary-history',
  validate(employeeParam),
  asyncHandler(contractController.salaryHistory),
);
router.post(
  '/employees/:employeeId/salary-changes',
  authorize(...managers),
  validate(addSalaryChangeSchema),
  asyncHandler(contractController.addSalaryChange),
);

// Contrato individual
router.put(
  '/contracts/:id',
  authorize(...managers),
  validate(updateContractSchema),
  asyncHandler(contractController.update),
);
router.delete(
  '/contracts/:id',
  authorize(...managers),
  validate(idParam),
  asyncHandler(contractController.remove),
);

export const contractRoutes = router;
