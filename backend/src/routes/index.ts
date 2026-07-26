import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes';
import { userRoutes } from '../modules/users/user.routes';
import { employeeRoutes } from '../modules/employees/employee.routes';
import { payrollRoutes } from '../modules/payroll/payroll.routes';
import { catalogRoutes } from '../modules/catalog/catalog.routes';
import { dashboardRoutes } from '../modules/dashboard/dashboard.routes';
import { documentRoutes } from '../modules/documents/document.routes';

/**
 * Registro central de módulos. Para añadir un nuevo módulo en el futuro
 * basta con crear su carpeta en `modules/` y registrar su router aquí,
 * sin tocar el resto de la arquitectura.
 */
const router = Router();

router.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'gth-api', timestamp: new Date().toISOString() }),
);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/employees', employeeRoutes);
router.use('/payroll', payrollRoutes);
router.use('/catalog', catalogRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/documents', documentRoutes);

export const apiRouter = router;
