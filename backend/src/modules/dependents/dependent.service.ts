import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../core/errors/AppError';
import { auditService, Actor } from '../audit/audit.service';
import type { CreateDependentInput, UpdateDependentInput } from './dependent.schema';

export class DependentService {
  private async ensureEmployee(employeeId: string, organizationId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!employee) throw new NotFoundError('Empleado');
    return employee;
  }

  private async ensureDependent(id: string, organizationId: string) {
    const dependent = await prisma.dependent.findFirst({
      where: { id, employee: { organizationId } },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
    if (!dependent) throw new NotFoundError('Beneficiario');
    return dependent;
  }

  async list(employeeId: string, organizationId: string) {
    await this.ensureEmployee(employeeId, organizationId);
    return prisma.dependent.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(
    employeeId: string,
    organizationId: string,
    input: CreateDependentInput,
    actor?: Actor,
  ) {
    const employee = await this.ensureEmployee(employeeId, organizationId);
    const created = await prisma.dependent.create({
      data: {
        employeeId,
        relationship: input.relationship,
        firstName: input.firstName,
        lastName: input.lastName,
        documentType: input.documentType ?? null,
        documentNumber: input.documentNumber ?? null,
        birthDate: input.birthDate ?? null,
        gender: input.gender ?? null,
        isBeneficiary: input.isBeneficiary,
        notes: input.notes ?? null,
      },
    });
    await auditService.record({
      organizationId,
      actor,
      action: 'CREATE',
      entity: 'Dependent',
      entityId: created.id,
      entityLabel: `${input.firstName} ${input.lastName} (${employee.firstName} ${employee.lastName})`,
    });
    return created;
  }

  async update(id: string, organizationId: string, input: UpdateDependentInput, actor?: Actor) {
    const existing = await this.ensureDependent(id, organizationId);
    const data: Prisma.DependentUpdateInput = {};
    if (input.relationship !== undefined) data.relationship = input.relationship;
    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (input.documentType !== undefined) data.documentType = input.documentType;
    if (input.documentNumber !== undefined) data.documentNumber = input.documentNumber;
    if (input.birthDate !== undefined) data.birthDate = input.birthDate;
    if (input.gender !== undefined) data.gender = input.gender;
    if (input.isBeneficiary !== undefined) data.isBeneficiary = input.isBeneficiary;
    if (input.notes !== undefined) data.notes = input.notes;

    const updated = await prisma.dependent.update({ where: { id }, data });
    await auditService.record({
      organizationId,
      actor,
      action: 'UPDATE',
      entity: 'Dependent',
      entityId: id,
      entityLabel: `${updated.firstName} ${updated.lastName} (${existing.employee.firstName} ${existing.employee.lastName})`,
    });
    return updated;
  }

  async remove(id: string, organizationId: string, actor?: Actor) {
    const existing = await this.ensureDependent(id, organizationId);
    await prisma.dependent.delete({ where: { id } });
    await auditService.record({
      organizationId,
      actor,
      action: 'DELETE',
      entity: 'Dependent',
      entityId: id,
      entityLabel: `${existing.firstName} ${existing.lastName}`,
    });
    return { id };
  }
}

export const dependentService = new DependentService();
