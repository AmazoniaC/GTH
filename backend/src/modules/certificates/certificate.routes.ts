import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { certificateController } from './certificate.controller';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { requireModule } from '../../core/middlewares/module.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import {
  createTemplateSchema,
  idParamSchema,
  renderSchema,
  updateTemplateSchema,
} from './certificate.schema';

const router = Router();
router.use(authenticate);
router.use(requireModule('EMPLOYEES'));

// La gestión y generación de documentos es de RRHH/Admin.
const managers = [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.SUPER_ADMIN];

router.get('/variables', asyncHandler(certificateController.variables));
router.get('/templates', asyncHandler(certificateController.listTemplates));

router.post(
  '/templates',
  authorize(...managers),
  validate(createTemplateSchema),
  asyncHandler(certificateController.createTemplate),
);
router.put(
  '/templates/:id',
  authorize(...managers),
  validate(updateTemplateSchema),
  asyncHandler(certificateController.updateTemplate),
);
router.delete(
  '/templates/:id',
  authorize(...managers),
  validate(idParamSchema),
  asyncHandler(certificateController.removeTemplate),
);

router.post(
  '/render',
  authorize(...managers),
  validate(renderSchema),
  asyncHandler(certificateController.render),
);

export const certificateRoutes = router;
