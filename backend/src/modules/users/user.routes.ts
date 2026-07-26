import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { userController } from './user.controller';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import {
  createUserSchema,
  idParamSchema,
  updateProfileSchema,
  updateUserSchema,
} from './user.schema';

const router = Router();
router.use(authenticate);

const admins = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

// Cualquier usuario autenticado puede editar su propio perfil.
router.patch('/me', validate(updateProfileSchema), asyncHandler(userController.updateProfile));

// La gestión de cuentas queda reservada a administradores.
router.get('/', authorize(...admins), asyncHandler(userController.list));
router.post('/', authorize(...admins), validate(createUserSchema), asyncHandler(userController.create));
router.put('/:id', authorize(...admins), validate(updateUserSchema), asyncHandler(userController.update));
router.delete('/:id', authorize(...admins), validate(idParamSchema), asyncHandler(userController.remove));

export const userRoutes = router;
