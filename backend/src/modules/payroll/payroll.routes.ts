import { Router } from 'express';
import { payrollController } from './payroll.controller';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { requireModule } from '../../core/middlewares/module.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { UserRole } from '@prisma/client';
import {
  createPeriodSchema,
  idParamSchema,
  listPeriodsSchema,
  simulateSchema,
  updatePeriodStatusSchema,
  upsertConfigSchema,
} from './payroll.schema';

const router = Router();
router.use(authenticate);
router.use(requireModule('PAYROLL'));

const payrollManagers = [UserRole.ADMIN, UserRole.PAYROLL_MANAGER, UserRole.SUPER_ADMIN];

// Configuración legal
router.get('/config', asyncHandler(payrollController.getConfig));
router.put(
  '/config',
  authorize(...payrollManagers),
  validate(upsertConfigSchema),
  asyncHandler(payrollController.upsertConfig),
);

// Simulador de nómina
router.post('/simulate', validate(simulateSchema), asyncHandler(payrollController.simulate));

// Periodos de nómina
router.get('/periods', validate(listPeriodsSchema), asyncHandler(payrollController.listPeriods));
router.get('/periods/:id', validate(idParamSchema), asyncHandler(payrollController.getPeriod));
router.get(
  '/periods/:id/payslips-print',
  validate(idParamSchema),
  asyncHandler(payrollController.periodForPrint),
);
router.post(
  '/periods',
  authorize(...payrollManagers),
  validate(createPeriodSchema),
  asyncHandler(payrollController.createPeriod),
);
router.patch(
  '/periods/:id/status',
  authorize(...payrollManagers),
  validate(updatePeriodStatusSchema),
  asyncHandler(payrollController.updatePeriodStatus),
);
router.delete(
  '/periods/:id',
  authorize(...payrollManagers),
  validate(idParamSchema),
  asyncHandler(payrollController.deletePeriod),
);

// Desprendible individual
router.get('/payslips/:id', validate(idParamSchema), asyncHandler(payrollController.getPayslip));

export const payrollRoutes = router;
