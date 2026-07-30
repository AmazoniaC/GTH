import { Router } from 'express';
import { z } from 'zod';
import { selfServiceService } from './selfservice.service';
import { authenticate } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ok, created } from '../../core/utils/apiResponse';
import { createRequestSchema, reviewSchema } from '../absences/absence.schema';

const router = Router();
router.use(authenticate);

const contactSchema = z.object({
  body: z.object({
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
  }),
});

router.get('/employee', asyncHandler(async (req, res) =>
  ok(res, await selfServiceService.getProfile(req.auth!.sub)),
));
router.patch('/employee', validate(contactSchema), asyncHandler(async (req, res) =>
  ok(res, await selfServiceService.updateContact(req.auth!.sub, req.body)),
));
router.get('/documents', asyncHandler(async (req, res) =>
  ok(res, await selfServiceService.getDocuments(req.auth!.sub)),
));
router.get('/documents/:id/download', asyncHandler(async (req, res) =>
  ok(res, await selfServiceService.getDocumentContent(req.auth!.sub, req.params.id)),
));
router.get('/payslips', asyncHandler(async (req, res) =>
  ok(res, await selfServiceService.getPayslips(req.auth!.sub)),
));
router.get('/absences', asyncHandler(async (req, res) =>
  ok(res, await selfServiceService.getAbsences(req.auth!.sub)),
));
router.get('/vacation-balance', asyncHandler(async (req, res) =>
  ok(res, await selfServiceService.getVacationBalance(req.auth!.sub)),
));

// Solicitudes de ausencia (autoservicio del empleado).
router.post(
  '/absence-requests',
  validate(createRequestSchema),
  asyncHandler(async (req, res) =>
    created(
      res,
      await selfServiceService.requestAbsence(req.auth!.sub, req.auth!.organizationId, req.body),
    ),
  ),
);
router.delete('/absence-requests/:id', asyncHandler(async (req, res) =>
  ok(res, await selfServiceService.cancelAbsenceRequest(req.auth!.sub, req.auth!.organizationId, req.params.id)),
));

// Aprobaciones del jefe directo (equipo a cargo).
router.get('/team/approvals', asyncHandler(async (req, res) =>
  ok(res, await selfServiceService.teamApprovals(req.auth!.sub, req.auth!.organizationId)),
));
router.patch(
  '/team/approvals/:id/review',
  validate(reviewSchema),
  asyncHandler(async (req, res) =>
    ok(
      res,
      await selfServiceService.reviewTeamRequest(
        req.auth!.sub,
        req.auth!.organizationId,
        req.params.id,
        req.body.decision,
        req.body.note,
      ),
    ),
  ),
);
router.get('/is-manager', asyncHandler(async (req, res) =>
  ok(res, { isManager: await selfServiceService.isManager(req.auth!.sub) }),
));

export const selfServiceRoutes = router;
