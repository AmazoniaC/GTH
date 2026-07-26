import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { documentController } from './document.controller';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { createDocumentSchema, idParamSchema, listDocumentsSchema } from './document.schema';

const router = Router();
router.use(authenticate);

const managers = [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.SUPER_ADMIN];

router.get('/', validate(listDocumentsSchema), asyncHandler(documentController.list));
router.get('/:id/download', validate(idParamSchema), asyncHandler(documentController.download));
router.post(
  '/',
  authorize(...managers),
  validate(createDocumentSchema),
  asyncHandler(documentController.create),
);
router.delete(
  '/:id',
  authorize(...managers),
  validate(idParamSchema),
  asyncHandler(documentController.remove),
);

export const documentRoutes = router;
