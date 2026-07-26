import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../core/middlewares/auth.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ok } from '../../core/utils/apiResponse';

const router = Router();
router.use(authenticate);

/** Métricas agregadas para el panel principal. */
router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const organizationId = req.auth!.organizationId;

    const [total, active, onLeave, terminated, departments, byDepartment, lastPeriod] =
      await Promise.all([
        prisma.employee.count({ where: { organizationId } }),
        prisma.employee.count({ where: { organizationId, status: 'ACTIVE' } }),
        prisma.employee.count({ where: { organizationId, status: 'ON_LEAVE' } }),
        prisma.employee.count({ where: { organizationId, status: 'TERMINATED' } }),
        prisma.department.count({ where: { organizationId } }),
        prisma.employee.groupBy({
          by: ['departmentId'],
          where: { organizationId },
          _count: { _all: true },
        }),
        prisma.payrollPeriod.findFirst({
          where: { organizationId },
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        }),
      ]);

    // Enriquecemos el conteo por departamento con su nombre.
    const deptMap = new Map(
      (await prisma.department.findMany({ where: { organizationId } })).map((d) => [d.id, d.name]),
    );
    const employeesByDepartment = byDepartment.map((row) => ({
      departmentId: row.departmentId,
      department: row.departmentId ? deptMap.get(row.departmentId) ?? 'Sin asignar' : 'Sin asignar',
      count: row._count._all,
    }));

    // Últimos 6 periodos de nómina para tendencia.
    const recentPeriods = await prisma.payrollPeriod.findMany({
      where: { organizationId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 6,
      select: { name: true, month: true, year: true, totalNet: true, totalEmployerCost: true },
    });

    return ok(res, {
      employees: { total, active, onLeave, terminated },
      departments,
      lastPayroll: lastPeriod
        ? {
            name: lastPeriod.name,
            totalNet: lastPeriod.totalNet,
            totalEmployerCost: lastPeriod.totalEmployerCost,
            status: lastPeriod.status,
          }
        : null,
      employeesByDepartment,
      payrollTrend: recentPeriods.reverse(),
    });
  }),
);

export const dashboardRoutes = router;
