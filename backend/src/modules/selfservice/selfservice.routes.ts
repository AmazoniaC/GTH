import { Router } from 'express';
import { z } from 'zod';
import { selfServiceService } from './selfservice.service';
import { authenticate } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ok } from '../../core/utils/apiResponse';

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

export const selfServiceRoutes = router;
