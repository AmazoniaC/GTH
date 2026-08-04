import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

/** Repositorio del módulo de Nómina (periodos, desprendibles y parámetros). */
export class PayrollRepository {
  // -------- Configuración legal --------
  findConfig(organizationId: string, year: number) {
    return prisma.payrollConfig.findUnique({
      where: { organizationId_year: { organizationId, year } },
    });
  }

  findLatestConfig(organizationId: string) {
    return prisma.payrollConfig.findFirst({
      where: { organizationId, isActive: true },
      orderBy: { year: 'desc' },
    });
  }

  upsertConfig(organizationId: string, year: number, data: Prisma.PayrollConfigCreateInput) {
    return prisma.payrollConfig.upsert({
      where: { organizationId_year: { organizationId, year } },
      create: data,
      update: data,
    });
  }

  // -------- Periodos --------
  findPeriods(organizationId: string, where: Prisma.PayrollPeriodWhereInput) {
    return prisma.payrollPeriod.findMany({
      where: { organizationId, ...where },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { _count: { select: { payslips: true } } },
    });
  }

  findPeriodById(id: string, organizationId: string) {
    return prisma.payrollPeriod.findFirst({
      where: { id, organizationId },
      include: {
        payslips: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                documentNumber: true,
              },
            },
          },
          orderBy: { employee: { firstName: 'asc' } },
        },
      },
    });
  }

  /** Periodo con TODOS los desprendibles + sus conceptos y datos de empresa. */
  periodForPrint(id: string, organizationId: string) {
    return prisma.payrollPeriod.findFirst({
      where: { id, organizationId },
      include: {
        organization: {
          select: {
            name: true,
            legalName: true,
            nit: true,
            address: true,
            city: true,
            phone: true,
            email: true,
            logoUrl: true,
          },
        },
        payslips: {
          include: {
            items: true,
            employee: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                employeeCode: true,
                documentNumber: true,
                position: { select: { title: true } },
                department: { select: { name: true } },
              },
            },
          },
          orderBy: { employee: { firstName: 'asc' } },
        },
      },
    });
  }

  findPeriodByPeriodKey(organizationId: string, year: number, month: number, type: string) {
    return prisma.payrollPeriod.findFirst({
      where: { organizationId, year, month, type: type as never },
    });
  }

  updatePeriodStatus(id: string, status: Prisma.PayrollPeriodUpdateInput['status']) {
    return prisma.payrollPeriod.update({ where: { id }, data: { status } });
  }

  deletePeriod(id: string) {
    return prisma.payrollPeriod.delete({ where: { id } });
  }

  // -------- Desprendible individual --------
  findPayslipById(id: string, organizationId: string) {
    return prisma.payslip.findFirst({
      where: { id, period: { organizationId } },
      include: {
        items: true,
        employee: {
          include: { department: true, position: true },
        },
        period: true,
      },
    });
  }

  // -------- Empleados activos con contrato vigente --------
  activeEmployeesWithContract(organizationId: string) {
    return prisma.employee.findMany({
      where: { organizationId, status: 'ACTIVE' },
      include: {
        contracts: { where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  /** Crea el periodo junto a todos sus desprendibles en una transacción. */
  createPeriodWithPayslips(
    period: Prisma.PayrollPeriodCreateInput,
    payslips: (periodId: string) => Prisma.PayslipCreateManyInput[],
    items: (payslipMap: Map<string, string>) => Prisma.PayslipItemCreateManyInput[],
    totals: { totalEarnings: number; totalDeductions: number; totalNet: number; totalEmployerCost: number },
  ) {
    return prisma.$transaction(async (tx) => {
      const createdPeriod = await tx.payrollPeriod.create({ data: period });

      const payslipRows = payslips(createdPeriod.id);
      // Necesitamos IDs; creamos uno a uno para mapear employeeId -> payslipId.
      const employeeToPayslip = new Map<string, string>();
      for (const row of payslipRows) {
        const created = await tx.payslip.create({ data: row });
        employeeToPayslip.set(created.employeeId, created.id);
      }

      const itemRows = items(employeeToPayslip);
      if (itemRows.length) {
        await tx.payslipItem.createMany({ data: itemRows });
      }

      return tx.payrollPeriod.update({
        where: { id: createdPeriod.id },
        data: {
          totalEarnings: totals.totalEarnings,
          totalDeductions: totals.totalDeductions,
          totalNet: totals.totalNet,
          totalEmployerCost: totals.totalEmployerCost,
          status: 'PROCESSED',
        },
        include: { _count: { select: { payslips: true } } },
      });
    });
  }
}

export const payrollRepository = new PayrollRepository();
