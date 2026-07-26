import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError, ConflictError, NotFoundError } from '../../core/errors/AppError';
import {
  CATALOG_CATEGORIES,
  CatalogCategory,
  DEFAULT_OPTIONS,
} from './catalog.constants';

/**
 * Servicio de catálogos organizacionales: departamentos, cargos y opciones
 * configurables (tipos de documento, tipos de contrato, estados).
 */
export class CatalogService {
  // ================= Opciones configurables =================

  /** Provisiona las opciones por defecto para una organización (idempotente). */
  async ensureDefaults(organizationId: string) {
    const count = await prisma.catalogOption.count({ where: { organizationId } });
    if (count > 0) return;

    const rows: Prisma.CatalogOptionCreateManyInput[] = [];
    for (const category of CATALOG_CATEGORIES) {
      DEFAULT_OPTIONS[category].forEach((opt, index) => {
        rows.push({
          organizationId,
          category,
          code: opt.code,
          label: opt.label,
          order: index,
          isSystem: opt.isSystem ?? false,
        });
      });
    }
    await prisma.catalogOption.createMany({ data: rows, skipDuplicates: true });
  }

  async listOptions(organizationId: string, category?: string) {
    await this.ensureDefaults(organizationId);
    return prisma.catalogOption.findMany({
      where: { organizationId, ...(category ? { category } : {}) },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });
  }

  async createOption(
    organizationId: string,
    data: { category: CatalogCategory; code: string; label: string },
  ) {
    const exists = await prisma.catalogOption.findFirst({
      where: { organizationId, category: data.category, code: data.code },
    });
    if (exists) throw new ConflictError('Ya existe una opción con ese código.');

    const max = await prisma.catalogOption.aggregate({
      where: { organizationId, category: data.category },
      _max: { order: true },
    });
    return prisma.catalogOption.create({
      data: {
        organizationId,
        category: data.category,
        code: data.code,
        label: data.label,
        order: (max._max.order ?? 0) + 1,
      },
    });
  }

  async updateOption(
    id: string,
    organizationId: string,
    data: { code?: string; label?: string; isActive?: boolean },
  ) {
    const option = await this.ensureOption(id, organizationId);
    const newCode = data.code?.trim().toUpperCase();

    // Cambiar el código requiere actualizar en cascada los registros que lo usan.
    if (newCode && newCode !== option.code) {
      if (option.isSystem) {
        throw new AppError('El código de una opción del sistema no se puede cambiar.', 422);
      }
      const collision = await prisma.catalogOption.findFirst({
        where: { organizationId, category: option.category, code: newCode },
      });
      if (collision) throw new ConflictError('Ya existe una opción con ese código.');

      await prisma.$transaction(async (tx) => {
        if (option.category === 'DOCUMENT_TYPE') {
          await tx.employee.updateMany({
            where: { organizationId, documentType: option.code },
            data: { documentType: newCode },
          });
        } else if (option.category === 'EMPLOYEE_STATUS') {
          await tx.employee.updateMany({
            where: { organizationId, status: option.code },
            data: { status: newCode },
          });
        } else if (option.category === 'CONTRACT_TYPE') {
          const emps = await tx.employee.findMany({
            where: { organizationId },
            select: { id: true },
          });
          await tx.contract.updateMany({
            where: { type: option.code, employeeId: { in: emps.map((e) => e.id) } },
            data: { type: newCode },
          });
        }
        await tx.catalogOption.update({
          where: { id },
          data: {
            code: newCode,
            ...(data.label !== undefined ? { label: data.label } : {}),
            ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
          },
        });
      });
      return prisma.catalogOption.findUnique({ where: { id } });
    }

    return prisma.catalogOption.update({
      where: { id },
      data: {
        ...(data.label !== undefined ? { label: data.label } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  async deleteOption(id: string, organizationId: string) {
    const option = await this.ensureOption(id, organizationId);
    if (option.isSystem) {
      throw new AppError('Esta opción es del sistema y no se puede eliminar.', 422);
    }
    await prisma.catalogOption.delete({ where: { id } });
    return { id };
  }

  private async ensureOption(id: string, organizationId: string) {
    const option = await prisma.catalogOption.findFirst({ where: { id, organizationId } });
    if (!option) throw new NotFoundError('Opción');
    return option;
  }

  // ================= Departamentos =================

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

  async updateDepartment(
    id: string,
    organizationId: string,
    data: { name?: string; description?: string },
  ) {
    await this.ensureDepartment(id, organizationId);
    return prisma.department.update({ where: { id }, data });
  }

  async deleteDepartment(id: string, organizationId: string) {
    await this.ensureDepartment(id, organizationId);
    await prisma.department.delete({ where: { id } });
    return { id };
  }

  // ================= Cargos =================

  async listPositions(organizationId: string) {
    await this.ensurePositionCodes(organizationId);
    return prisma.position.findMany({
      where: { organizationId },
      orderBy: { code: 'asc' },
      include: { department: true, _count: { select: { employees: true } } },
    });
  }

  async createPosition(
    organizationId: string,
    data: { title: string; description?: string; departmentId?: string | null; code?: string },
  ) {
    const code = data.code?.trim() || (await this.nextPositionCode(organizationId));
    const taken = await prisma.position.findFirst({ where: { organizationId, code } });
    if (taken) throw new ConflictError('Ya existe un cargo con ese ID.');

    const payload: Prisma.PositionCreateInput = {
      organization: { connect: { id: organizationId } },
      code,
      title: data.title,
      description: data.description,
      ...(data.departmentId ? { department: { connect: { id: data.departmentId } } } : {}),
    };
    return prisma.position.create({ data: payload, include: { department: true } });
  }

  async updatePosition(
    id: string,
    organizationId: string,
    data: { title?: string; description?: string; departmentId?: string | null; code?: string },
  ) {
    await this.ensurePosition(id, organizationId);
    const update: Prisma.PositionUpdateInput = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.description !== undefined) update.description = data.description;
    if (data.code !== undefined && data.code.trim()) update.code = data.code.trim();
    if (data.departmentId !== undefined) {
      update.department = data.departmentId
        ? { connect: { id: data.departmentId } }
        : { disconnect: true };
    }
    return prisma.position.update({ where: { id }, data: update, include: { department: true } });
  }

  async deletePosition(id: string, organizationId: string) {
    await this.ensurePosition(id, organizationId);
    await prisma.position.delete({ where: { id } });
    return { id };
  }

  /** Genera el siguiente código de cargo (CAR-001, CAR-002, ...). */
  private async nextPositionCode(organizationId: string): Promise<string> {
    const count = await prisma.position.count({ where: { organizationId } });
    let n = count + 1;
    // Evita colisiones si algún código ya fue asignado manualmente.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const code = `CAR-${String(n).padStart(3, '0')}`;
      const exists = await prisma.position.findFirst({ where: { organizationId, code } });
      if (!exists) return code;
      n += 1;
    }
  }

  /** Asigna códigos a los cargos que aún no lo tengan. */
  private async ensurePositionCodes(organizationId: string) {
    const missing = await prisma.position.findMany({
      where: { organizationId, code: null },
      orderBy: { createdAt: 'asc' },
    });
    for (const position of missing) {
      const code = await this.nextPositionCode(organizationId);
      await prisma.position.update({ where: { id: position.id }, data: { code } });
    }
  }

  private async ensureDepartment(id: string, organizationId: string) {
    const found = await prisma.department.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundError('Departamento');
    return found;
  }

  private async ensurePosition(id: string, organizationId: string) {
    const found = await prisma.position.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundError('Cargo');
    return found;
  }
}

export const catalogService = new CatalogService();
