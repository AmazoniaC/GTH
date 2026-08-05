import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { noveltyController } from './novelty.controller';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { requireModule } from '../../core/middlewares/module.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import {
  createNoveltySchema,
  idParamSchema,
  listNoveltiesSchema,
  updateNoveltySchema,
} from './novelty.schema';

const router = Router();
router.use(authenticate);
router.use(requireModule('PAYROLL'));

const managers = [UserRole.ADMIN, UserRole.PAYROLL_MANAGER, UserRole.SUPER_ADMIN];

router.get('/catalog', asyncHandler(noveltyController.catalog));
router.get('/', validate(listNoveltiesSchema), asyncHandler(noveltyController.list));
router.post('/', authorize(...managers), validate(createNoveltySchema), asyncHandler(noveltyController.create));
router.put('/:id', authorize(...managers), validate(updateNoveltySchema), asyncHandler(noveltyController.update));
router.delete('/:id', authorize(...managers), validate(idParamSchema), asyncHandler(noveltyController.remove));

export const noveltyRoutes = router;
