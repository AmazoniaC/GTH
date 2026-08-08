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

  /** Periodo con desprendibles, conceptos y las entidades de seguridad social
   * de cada empleado (para liquidar la PILA). */
  periodForPila(id: string, organizationId: string) {
    return prisma.payrollPeriod.findFirst({
      where: { id, organizationId },
      include: {
        organization: { select: { name: true, legalName: true, nit: true } },
        payslips: {
          include: {
            items: { select: { code: true, amount: true } },
            employee: {
              select: {
                firstName: true,
                lastName: true,
                documentType: true,
                documentNumber: true,
                eps: true,
                pensionFund: true,
                arl: true,
                compensationFund: true,
                arlRiskClass: true,
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

  /**
   * Crea el periodo junto a todos sus desprendibles de forma atómica.
   *
   * Si se le pasa un cliente de transacción (`tx`) se ejecuta dentro de esa
   * transacción; en caso contrario abre la suya propia. Esto permite que el
   * servicio agrupe en una sola transacción la reserva de consecutivos, la
   * creación del periodo y el marcado de novedades aplicadas.
   */
  createPeriodWithPayslips(
    period: Prisma.PayrollPeriodCreateInput,
    payslips: (periodId: string) => Prisma.PayslipCreateManyInput[],
    items: (payslipMap: Map<string, string>) => Prisma.PayslipItemCreateManyInput[],
    totals: { totalEarnings: number; totalDeductions: number; totalNet: number; totalEmployerCost: number },
    tx?: Prisma.TransactionClient,
  ) {
    const run = async (client: Prisma.TransactionClient) => {
      const createdPeriod = await client.payrollPeriod.create({ data: period });

      const payslipRows = payslips(createdPeriod.id);
      // Necesitamos IDs; creamos uno a uno para mapear employeeId -> payslipId.
      const employeeToPayslip = new Map<string, string>();
      for (const row of payslipRows) {
        const created = await client.payslip.create({ data: row });
        employeeToPayslip.set(created.employeeId, created.id);
      }

      const itemRows = items(employeeToPayslip);
      if (itemRows.length) {
        await client.payslipItem.createMany({ data: itemRows });
      }

      return client.payrollPeriod.update({
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
    };
    return tx ? run(tx) : prisma.$transaction(run);
  }
}

export const payrollRepository = new PayrollRepository();
