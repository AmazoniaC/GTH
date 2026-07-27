import { Router } from 'express';
import { z } from 'zod';
import { catalogService } from './catalog.service';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ok, created } from '../../core/utils/apiResponse';
import { UserRole } from '@prisma/client';

const router = Router();
router.use(authenticate);

const managers = [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.SUPER_ADMIN];
const admins = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

const departmentSchema = z.object({
  body: z.object({ name: z.string().min(2), description: z.string().optional() }),
});

const positionSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    code: z.string().optional(),
    description: z.string().optional(),
    departmentId: z.string().optional().nullable(),
  }),
});

const CATEGORY_VALUES = [
  'DOCUMENT_TYPE', 'CONTRACT_TYPE', 'EMPLOYEE_STATUS', 'FILE_TYPE',
  'BLOOD_TYPE', 'NATIONALITY', 'COUNTRY', 'EPS', 'PENSION_FUND',
  'SEVERANCE_FUND', 'COMPENSATION_FUND', 'ARL', 'BANK', 'ACCOUNT_TYPE',
  'RELATIONSHIP', 'COST_CENTER', 'WORK_LOCATION', 'EDUCATION_LEVEL',
] as const;

const optionSchema = z.object({
  body: z.object({
    category: z.enum(CATEGORY_VALUES),
    code: z.string().min(1),
    label: z.string().min(1),
  }),
});

const optionUpdateSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    code: z.string().min(1).optional(),
    label: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
  }),
});

const idParam = z.object({ params: z.object({ id: z.string().cuid() }) });

// ---------- Opciones configurables ----------
router.get(
  '/options',
  asyncHandler(async (req, res) =>
    ok(res, await catalogService.listOptions(req.auth!.organizationId, req.query.category as string)),
  ),
);
router.post(
  '/options',
  authorize(...admins),
  validate(optionSchema),
  asyncHandler(async (req, res) =>
    created(res, await catalogService.createOption(req.auth!.organizationId, req.body)),
  ),
);
router.put(
  '/options/:id',
  authorize(...admins),
  validate(optionUpdateSchema),
  asyncHandler(async (req, res) =>
    ok(res, await catalogService.updateOption(req.params.id, req.auth!.organizationId, req.body)),
  ),
);
router.delete(
  '/options/:id',
  authorize(...admins),
  validate(idParam),
  asyncHandler(async (req, res) =>
    ok(res, await catalogService.deleteOption(req.params.id, req.auth!.organizationId)),
  ),
);

// ---------- Departamentos ----------
router.get(
  '/departments',
  asyncHandler(async (req, res) => ok(res, await catalogService.listDepartments(req.auth!.organizationId))),
);
router.post(
  '/departments',
  authorize(...managers),
  validate(departmentSchema),
  asyncHandler(async (req, res) =>
    created(res, await catalogService.createDepartment(req.auth!.organizationId, req.body)),
  ),
);
router.put(
  '/departments/:id',
  authorize(...managers),
  validate(idParam),
  asyncHandler(async (req, res) =>
    ok(res, await catalogService.updateDepartment(req.params.id, req.auth!.organizationId, req.body)),
  ),
);
router.delete(
  '/departments/:id',
  authorize(...managers),
  validate(idParam),
  asyncHandler(async (req, res) =>
    ok(res, await catalogService.deleteDepartment(req.params.id, req.auth!.organizationId)),
  ),
);

// ---------- Cargos ----------
router.get(
  '/positions',
  asyncHandler(async (req, res) => ok(res, await catalogService.listPositions(req.auth!.organizationId))),
);
router.post(
  '/positions',
  authorize(...managers),
  validate(positionSchema),
  asyncHandler(async (req, res) =>
    created(res, await catalogService.createPosition(req.auth!.organizationId, req.body)),
  ),
);
router.put(
  '/positions/:id',
  authorize(...managers),
  validate(idParam),
  asyncHandler(async (req, res) =>
    ok(res, await catalogService.updatePosition(req.params.id, req.auth!.organizationId, req.body)),
  ),
);
router.delete(
  '/positions/:id',
  authorize(...managers),
  validate(idParam),
  asyncHandler(async (req, res) =>
    ok(res, await catalogService.deletePosition(req.params.id, req.auth!.organizationId)),
  ),
);

export const catalogRoutes = router;
