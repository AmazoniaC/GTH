import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { resumeService } from './resume.service';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { created, ok } from '../../core/utils/apiResponse';

const router = Router();
router.use(authenticate);
const managers = [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.SUPER_ADMIN];

const empParam = z.object({ params: z.object({ employeeId: z.string().cuid() }) });
const idParam = z.object({ params: z.object({ id: z.string().cuid() }) });

const educationBody = z.object({
  body: z.object({
    level: z.string().min(1),
    institution: z.string().min(1),
    title: z.string().optional().nullable(),
    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
    isCompleted: z.boolean().optional(),
  }),
});

const experienceBody = z.object({
  body: z.object({
    company: z.string().min(1),
    position: z.string().min(1),
    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
    isCurrent: z.boolean().optional(),
    responsibilities: z.string().optional().nullable(),
  }),
});

// Educación
router.get('/employees/:employeeId/educations', validate(empParam), asyncHandler(async (req, res) =>
  ok(res, await resumeService.listEducation(req.params.employeeId, req.auth!.organizationId)),
));
router.post('/employees/:employeeId/educations', authorize(...managers), validate(educationBody), asyncHandler(async (req, res) =>
  created(res, await resumeService.createEducation(req.params.employeeId, req.auth!.organizationId, req.body)),
));
router.put('/educations/:id', authorize(...managers), validate(idParam), asyncHandler(async (req, res) =>
  ok(res, await resumeService.updateEducation(req.params.id, req.auth!.organizationId, req.body)),
));
router.delete('/educations/:id', authorize(...managers), validate(idParam), asyncHandler(async (req, res) =>
  ok(res, await resumeService.deleteEducation(req.params.id, req.auth!.organizationId)),
));

// Experiencia
router.get('/employees/:employeeId/experiences', validate(empParam), asyncHandler(async (req, res) =>
  ok(res, await resumeService.listExperience(req.params.employeeId, req.auth!.organizationId)),
));
router.post('/employees/:employeeId/experiences', authorize(...managers), validate(experienceBody), asyncHandler(async (req, res) =>
  created(res, await resumeService.createExperience(req.params.employeeId, req.auth!.organizationId, req.body)),
));
router.put('/experiences/:id', authorize(...managers), validate(idParam), asyncHandler(async (req, res) =>
  ok(res, await resumeService.updateExperience(req.params.id, req.auth!.organizationId, req.body)),
));
router.delete('/experiences/:id', authorize(...managers), validate(idParam), asyncHandler(async (req, res) =>
  ok(res, await resumeService.deleteExperience(req.params.id, req.auth!.organizationId)),
));

export const resumeRoutes = router;
