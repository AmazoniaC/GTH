import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { reportService } from './report.service';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ok } from '../../core/utils/apiResponse';

const router = Router();
router.use(authenticate);
// Función base: disponible para RRHH, nómina y administradores (no empleados).
router.use(authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL_MANAGER));

const org = (req: { auth?: { organizationId: string } }) => req.auth!.organizationId;

router.get('/headcount', asyncHandler(async (req, res) => ok(res, await reportService.headcount(org(req)))));

router.get(
  '/payroll',
  asyncHandler(async (req, res) => {
    const year = Number(req.query.year) || new Date().getFullYear();
    return ok(res, await reportService.payroll(org(req), year));
  }),
);

router.get(
  '/absenteeism',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const from = req.query.from ? new Date(String(req.query.from)) : new Date(now.getFullYear(), 0, 1);
    const to = req.query.to ? new Date(String(req.query.to)) : now;
    return ok(res, await reportService.absenteeism(org(req), from, to));
  }),
);

router.get('/compliance', asyncHandler(async (req, res) => ok(res, await reportService.compliance(org(req)))));

export const reportRoutes = router;
