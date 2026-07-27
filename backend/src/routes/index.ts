import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes';
import { userRoutes } from '../modules/users/user.routes';
import { employeeRoutes } from '../modules/employees/employee.routes';
import { payrollRoutes } from '../modules/payroll/payroll.routes';
import { catalogRoutes } from '../modules/catalog/catalog.routes';
import { dashboardRoutes } from '../modules/dashboard/dashboard.routes';
import { documentRoutes } from '../modules/documents/document.routes';
import { contractRoutes } from '../modules/contracts/contract.routes';
import { alertsRoutes } from '../modules/alerts/alerts.routes';
import { dependentRoutes } from '../modules/dependents/dependent.routes';
import { auditRoutes } from '../modules/audit/audit.routes';
import { importRoutes } from '../modules/import/import.routes';

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
router.use('/alerts', alertsRoutes);
router.use('/audit', auditRoutes);
router.use('/import', importRoutes);
// Rutas con paths absolutos propios (empleados/:id/sub-recursos).
router.use('/', contractRoutes);
router.use('/', dependentRoutes);

export const apiRouter = router;
