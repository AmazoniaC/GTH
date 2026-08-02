import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError, NotFoundError } from '../../core/errors/AppError';
import { auditService, Actor } from '../audit/audit.service';
import { payrollService } from '../payroll/payroll.service';
import { absenceService } from '../absences/absence.service';
import {
  calculateLiquidation,
  TERMINATION_REASONS,
  type LiquidationResult,
} from './liquidation.calculator';
import type { ComputeLiquidationInput, CreateLiquidationInput } from './liquidation.schema';

const num = (d: Prisma.Decimal | number): number =>
  typeof d === 'number' ? d : Number(d.toString());

const THRESHOLD_TRANSPORT_WAGES = 2; // auxilio de transporte hasta 2 SMMLV

function maxDate(a: Date, b: Date): Date {
  return a.getTime() >= b.getTime() ? a : b;
}

export class LiquidationService {
  reasons() {
    return TERMINATION_REASONS;
  }

  private async loadContext(organizationId: string, input: ComputeLiquidationInput) {
    const employee = await prisma.employee.findFirst({
      where: { id: input.employeeId, organizationId },
      include: {
        position: { select: { title: true } },
        contracts: { where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!employee) throw new NotFoundError('Empleado');
    const contract = employee.contracts[0];
    if (!contract) throw new AppError('El empleado no tiene un contrato vigente para liquidar.', 422);

    const termination = input.terminationDate;
    const config = await payrollService.getConfigValues(organizationId, termination.getUTCFullYear());
    const baseSalary = num(contract.baseSalary);

    // Auxilio de transporte si el contrato lo contempla y el salario <= 2 SMMLV.
    const eligibleTransport =
      contract.transportAllowance &&
      !contract.isIntegralSalary &&
      baseSalary <= config.minimumWage * THRESHOLD_TRANSPORT_WAGES;
    const transportAllowance = eligibleTransport ? config.transportAllowance : 0;

    // Saldo de vacaciones pendientes (del módulo de ausencias).
    const balance = await absenceService.vacationBalance(input.employeeId, organizationId);

    // Fechas de corte por defecto (editables por RRHH).
    const year = termination.getUTCFullYear();
    const jan1 = new Date(Date.UTC(year, 0, 1));
    const semesterStart = new Date(Date.UTC(year, termination.getUTCMonth() < 6 ? 0 : 6, 1));
    const cesantiasFrom = input.cesantiasFrom ?? maxDate(employee.hireDate, jan1);
    const primaFrom = input.primaFrom ?? maxDate(employee.hireDate, semesterStart);

    const result = calculateLiquidation({
      baseSalary,
      transportAllowance,
      hireDate: employee.hireDate,
      terminationDate: termination,
      cesantiasFrom,
      primaFrom,
      vacationDays: Math.max(0, balance.available),
      pendingSalaryDays: input.pendingSalaryDays ?? 0,
      extraEarnings: input.extraEarnings,
      deductions: input.deductions,
    });

    return { employee, contract, baseSalary, transportAllowance, cesantiasFrom, primaFrom, balance, result };
  }

  /** Calcula la liquidación sin guardar (previsualización). */
  async compute(organizationId: string, input: ComputeLiquidationInput) {
    const ctx = await this.loadContext(organizationId, input);
    return this.present(ctx);
  }

  /** Calcula y guarda la liquidación; opcionalmente marca al empleado retirado. */
  async create(organizationId: string, input: CreateLiquidationInput, actor?: Actor) {
    const ctx = await this.loadContext(organizationId, input);
    const { employee, result } = ctx;

    const created = await prisma.liquidation.create({
      data: {
        organizationId,
        employeeId: employee.id,
        terminationDate: input.terminationDate,
        reason: input.reason,
        baseSalary: new Prisma.Decimal(ctx.baseSalary),
        transportAllowance: new Prisma.Decimal(ctx.transportAllowance),
        items: result.items as unknown as Prisma.InputJsonValue,
        totalEarnings: new Prisma.Decimal(result.totalEarnings),
        totalDeductions: new Prisma.Decimal(result.totalDeductions),
        netPay: new Prisma.Decimal(result.netPay),
        notes: input.notes ?? null,
      },
    });

    // Marca al empleado como retirado (por defecto) y cierra su contrato.
    if (input.markTerminated !== false) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { status: 'TERMINATED', terminationDate: input.terminationDate },
      });
      await prisma.contract.updateMany({
        where: { employeeId: employee.id, isActive: true },
        data: { isActive: false, endDate: input.terminationDate },
      });
    }

    await auditService.record({
      organizationId,
      actor,
      action: 'CREATE',
      entity: 'Liquidation',
      entityId: created.id,
      entityLabel: `${employee.firstName} ${employee.lastName} · Liquidación definitiva`,
    });

    return this.getById(created.id, organizationId);
  }

  list(organizationId: string) {
    return prisma.liquidation.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, documentNumber: true } },
      },
    });
  }

  async getById(id: string, organizationId: string) {
    const liq = await prisma.liquidation.findFirst({
      where: { id, organizationId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            documentNumber: true,
            documentType: true,
            hireDate: true,
            position: { select: { title: true } },
          },
        },
        organization: {
          select: { name: true, legalName: true, nit: true, city: true, legalRepresentative: true },
        },
      },
    });
    if (!liq) throw new NotFoundError('Liquidación');
    return liq;
  }

  async remove(id: string, organizationId: string, actor?: Actor) {
    await this.getById(id, organizationId);
    await prisma.liquidation.delete({ where: { id } });
    await auditService.record({
      organizationId,
      actor,
      action: 'DELETE',
      entity: 'Liquidation',
      entityId: id,
    });
    return { id };
  }

  private present(ctx: Awaited<ReturnType<LiquidationService['loadContext']>>) {
    const { employee, result } = ctx;
    return {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        documentNumber: employee.documentNumber,
        position: employee.position?.title ?? null,
        hireDate: employee.hireDate,
      },
      baseSalary: ctx.baseSalary,
      transportAllowance: ctx.transportAllowance,
      cesantiasFrom: ctx.cesantiasFrom,
      primaFrom: ctx.primaFrom,
      vacationDays: Math.max(0, ctx.balance.available),
      ...(result as LiquidationResult),
    };
  }
}

export const liquidationService = new LiquidationService();
