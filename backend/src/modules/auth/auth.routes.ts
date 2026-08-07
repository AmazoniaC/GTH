import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../core/middlewares/validate.middleware';
import { authenticate } from '../../core/middlewares/auth.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { authLimiter } from '../../core/middlewares/rate-limit.middleware';
import { loginSchema, registerSchema, refreshSchema } from './auth.schema';

const router = Router();

// El auto-registro público está deshabilitado: las empresas las crea el
// dueño de la plataforma desde el panel de Plataforma. Se mantiene el
// esquema por compatibilidad, pero la ruta ya no se expone.
void registerSchema;
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', authLimiter, validate(refreshSchema), asyncHandler(authController.refresh));
router.get('/me', authenticate, asyncHandler(authController.me));

export const authRoutes = router;
