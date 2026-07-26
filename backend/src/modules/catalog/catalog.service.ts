import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../core/errors/AppError';

/**
 * Servicio de catálogos organizacionales: departamentos y cargos.
 * Alimenta los selectores del módulo de Empleados.
 */
export class CatalogService {
  listDepartments(organizationId: string) {
    return prisma.department.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { employees: true } } },
    });
  }

  createDepartment(organizationId: string, data: { name: string; description?: string }) {
    return prisma.department.create({
      data: { organizationId, name: data.name, description: data.description },
    });
  }

  async updateDepartment(id: string, organizationId: string, data: { name?: string; description?: string }) {
    await this.ensureDepartment(id, organizationId);
    return prisma.department.update({ where: { id }, data });
  }

  async deleteDepartment(id: string, organizationId: string) {
    await this.ensureDepartment(id, organizationId);
    await prisma.department.delete({ where: { id } });
    return { id };
  }

  listPositions(organizationId: string) {
    return prisma.position.findMany({
      where: { organizationId },
      orderBy: { title: 'asc' },
      include: { department: true, _count: { select: { employees: true } } },
    });
  }

  createPosition(
    organizationId: string,
    data: { title: string; description?: string; departmentId?: string | null },
  ) {
    const payload: Prisma.PositionCreateInput = {
      organization: { connect: { id: organizationId } },
      title: data.title,
      description: data.description,
      ...(data.departmentId ? { department: { connect: { id: data.departmentId } } } : {}),
    };
    return prisma.position.create({ data: payload });
  }

  async deletePosition(id: string, organizationId: string) {
    const found = await prisma.position.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundError('Cargo');
    await prisma.position.delete({ where: { id } });
    return { id };
  }

  private async ensureDepartment(id: string, organizationId: string) {
    const found = await prisma.department.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundError('Departamento');
    return found;
  }
}

export const catalogService = new CatalogService();
