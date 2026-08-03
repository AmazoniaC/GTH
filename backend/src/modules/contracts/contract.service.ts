import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError, NotFoundError } from '../../core/errors/AppError';
import type { AddContractInput, AddSalaryChangeInput, UpdateContractInput } from './contract.schema';

const num = (d: Prisma.Decimal | number): number =>
  typeof d === 'number' ? d : Number(d.toString());

/**
 * Servicio de contratos e historial salarial. Cada nuevo contrato cierra el
 * anterior (historial contractual) y todo cambio de salario queda registrado
 * en `SalaryChange` para trazabilidad.
 */
export class ContractService {
  private async ensureEmployee(employeeId: string, organizationId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      select: { id: true },
    });
    if (!employee) throw new NotFoundError('Empleado');
    return employee;
  }

  private async ensureContract(id: string, organizationId: string) {
    const contract = await prisma.contract.findFirst({
      where: { id, employee: { organizationId } },
    });
    if (!contract) throw new NotFoundError('Contrato');
    return contract;
  }

  listContracts(employeeId: string, organizationId: string) {
    return this.ensureEmployee(employeeId, organizationId).then(() =>
      prisma.contract.findMany({
        where: { employeeId },
        orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
      }),
    );
  }

  listSalaryChanges(employeeId: string, organizationId: string) {
    return this.ensureEmployee(employeeId, organizationId).then(() =>
      prisma.salaryChange.findMany({
        where: { employeeId },
        orderBy: { effectiveDate: 'desc' },
      }),
    );
  }

  /** Crea un nuevo contrato y cierra el vigente (historial). */
  async addContract(employeeId: string, organizationId: string, input: AddContractInput) {
    await this.ensureEmployee(employeeId, organizationId);

    return prisma.$transaction(async (tx) => {
      const current = await tx.contract.findFirst({
        where: { employeeId, isActive: true },
        orderBy: { startDate: 'desc' },
      });

      if (current) {
        // El contrato anterior termina el día antes del inicio del nuevo.
        const end = new Date(input.startDate);
        end.setDate(end.getDate() - 1);
        await tx.contract.update({
          where: { id: current.id },
          data: {
            isActive: false,
            endDate: current.endDate ?? end,
            endReason: input.previousEndReason ?? current.endReason ?? 'Nuevo contrato',
          },
        });
      }

      const created = await tx.contract.create({
        data: {
          employeeId,
          type: input.type,
          paymentFrequency: input.paymentFrequency,
          baseSalary: new Prisma.Decimal(input.baseSalary),
          isIntegralSalary: input.isIntegralSalary,
          transportAllowance: input.transportAllowance,
          startDate: input.startDate,
          endDate: input.endDate ?? null,
          probationEndDate: input.probationEndDate ?? null,
          notes: input.notes ?? null,
          isActive: true,
        },
      });

      // Registra el cambio salarial si difiere del contrato anterior.
      if (current && num(current.baseSalary) !== input.baseSalary) {
        await tx.salaryChange.create({
          data: {
            employeeId,
            previousSalary: current.baseSalary,
            newSalary: new Prisma.Decimal(input.baseSalary),
            effectiveDate: input.startDate,
            reason: 'Nuevo contrato',
          },
        });
      }

      // Si el empleado estaba retirado, el nuevo contrato lo reactiva y la
      // fecha de ingreso pasa a la del nuevo contrato (la antigüedad reinicia,
      // pues el periodo anterior ya fue liquidado). La fecha original queda
      // registrada en el historial de contratos.
      const employee = await tx.employee.findUnique({
        where: { id: employeeId },
        select: { status: true },
      });
      if (employee?.status === 'TERMINATED') {
        await tx.employee.update({
          where: { id: employeeId },
          data: { status: 'ACTIVE', terminationDate: null, hireDate: input.startDate },
        });
      }

      return created;
    });
  }

  async updateContract(id: string, organizationId: string, input: UpdateContractInput) {
    await this.ensureContract(id, organizationId);
    const data: Prisma.ContractUpdateInput = {};
    if (input.type !== undefined) data.type = input.type;
    if (input.paymentFrequency !== undefined) data.paymentFrequency = input.paymentFrequency;
    if (input.baseSalary !== undefined) data.baseSalary = new Prisma.Decimal(input.baseSalary);
    if (input.isIntegralSalary !== undefined) data.isIntegralSalary = input.isIntegralSalary;
    if (input.transportAllowance !== undefined) data.transportAllowance = input.transportAllowance;
    if (input.startDate !== undefined) data.startDate = input.startDate;
    if (input.endDate !== undefined) data.endDate = input.endDate;
    if (input.probationEndDate !== undefined) data.probationEndDate = input.probationEndDate;
    if (input.endReason !== undefined) data.endReason = input.endReason;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    return prisma.contract.update({ where: { id }, data });
  }

  async deleteContract(id: string, organizationId: string) {
    const contract = await this.ensureContract(id, organizationId);
    const count = await prisma.contract.count({ where: { employeeId: contract.employeeId } });
    if (count <= 1) {
      throw new AppError('No se puede eliminar el único contrato del empleado.', 422);
    }
    await prisma.contract.delete({ where: { id } });
    return { id };
  }

  /** Registra un aumento/ajuste salarial y actualiza el contrato vigente. */
  async addSalaryChange(employeeId: string, organizationId: string, input: AddSalaryChangeInput) {
    await this.ensureEmployee(employeeId, organizationId);
    const current = await prisma.contract.findFirst({
      where: { employeeId, isActive: true },
      orderBy: { startDate: 'desc' },
    });
    if (!current) throw new AppError('El empleado no tiene un contrato vigente.', 422);

    return prisma.$transaction(async (tx) => {
      const change = await tx.salaryChange.create({
        data: {
          employeeId,
          previousSalary: current.baseSalary,
          newSalary: new Prisma.Decimal(input.newSalary),
          effectiveDate: input.effectiveDate,
          reason: input.reason ?? null,
        },
      });
      await tx.contract.update({
        where: { id: current.id },
        data: { baseSalary: new Prisma.Decimal(input.newSalary) },
      });
      return change;
    });
  }
}

export const contractService = new ContractService();
