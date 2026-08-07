import { Prisma } from '@prisma/client';

/**
 * Proyecciones Prisma reutilizables. Centralizan los `select` comunes para
 * no repetirlos (y mantenerlos consistentes) entre módulos.
 */

/** Datos mínimos de un empleado para listados y relaciones. */
export const employeeBriefSelect = {
  select: { id: true, firstName: true, lastName: true, documentNumber: true, photoUrl: true },
} satisfies { select: Prisma.EmployeeSelect };
