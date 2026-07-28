import { Prisma, AbsenceStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError, NotFoundError } from '../../core/errors/AppError';
import { auditService, Actor } from '../audit/audit.service';
import {
  countBusinessDays,
  countCalendarDays,
  countDaysInPeriod,
} from '../../core/utils/colombia-dates';
import { getAbsenceRule, absenceAffectsPayroll } from '../../config/absence-rules';
import type {
  CreateAbsenceInput,
  CreateAdjustmentInput,
  ListAbsencesQuery,
  UpdateAbsenceInput,
} from './absence.schema';

// Estados que "consumen" o cuentan como ausencia efectiva.
const EFFECTIVE_STATUSES: AbsenceStatus[] = [
  AbsenceStatus.APPROVED,
  AbsenceStatus.IN_PROGRESS,
  AbsenceStatus.COMPLETED,
];

const employeeSelect = {
  select: { id: true, firstName: true, lastName: true, documentNumber: true, photoUrl: true },
};

const num = (d: Prisma.Decimal | number): number =>
  typeof d === 'number' ? d : Number(d.toString());
const round2 = (n: number) => Math.round(n * 100) / 100;

export class AbsenceService {
  /** Días de la ausencia según la regla del tipo (hábiles o calendario). */
  private computeDays(type: string, start: Date, end: Date): number {
    const rule = getAbsenceRule(type);
    return rule.dayCount === 'BUSINESS'
      ? countBusinessDays(start, end)
      : countCalendarDays(start, end);
  }

  private async ensureEmployee(employeeId: string, organizationId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      select: { id: true, firstName: true, lastName: true, hireDate: true },
    });
    if (!employee) throw new NotFoundError('Empleado');
    return employee;
  }

  list(organizationId: string, query: ListAbsencesQuery) {
    const where: Prisma.AbsenceWhereInput = { organizationId };
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.AND = [];
      if (query.to) where.AND.push({ startDate: { lte: query.to } });
      if (query.from) where.AND.push({ endDate: { gte: query.from } });
    }
    return prisma.absence.findMany({
      where,
      orderBy: { startDate: 'desc' },
      include: { employee: employeeSelect },
    });
  }

  async getById(id: string, organizationId: string) {
    const absence = await prisma.absence.findFirst({
      where: { id, organizationId },
      include: { employee: employeeSelect },
    });
    if (!absence) throw new NotFoundError('Ausencia');
    return absence;
  }

  async create(organizationId: string, input: CreateAbsenceInput, actor?: Actor) {
    const employee = await this.ensureEmployee(input.employeeId, organizationId);
    const days = this.computeDays(input.type, input.startDate, input.endDate);
    if (days <= 0) {
      throw new AppError('El rango de fechas no genera días de ausencia.', 422);
    }

    const created = await prisma.absence.create({
      data: {
        organizationId,
        employeeId: input.employeeId,
        type: input.type,
        status: input.status ?? AbsenceStatus.APPROVED,
        startDate: input.startDate,
        endDate: input.endDate,
        days: new Prisma.Decimal(days),
        entity: input.entity ?? null,
        supportNumber: input.supportNumber ?? null,
        diagnosis: input.diagnosis ?? null,
        reason: input.reason ?? null,
        notes: input.notes ?? null,
        documentUrl: input.documentUrl ?? null,
        affectsPayroll: absenceAffectsPayroll(input.type),
      },
      include: { employee: employeeSelect },
    });

    await auditService.record({
      organizationId,
      actor,
      action: 'CREATE',
      entity: 'Absence',
      entityId: created.id,
      entityLabel: `${employee.firstName} ${employee.lastName} · ${getAbsenceRule(input.type).label}`,
    });
    return created;
  }

  async update(id: string, organizationId: string, input: UpdateAbsenceInput, actor?: Actor) {
    const current = await this.getById(id, organizationId);

    const type = input.type ?? current.type;
    const startDate = input.startDate ?? current.startDate;
    const endDate = input.endDate ?? current.endDate;

    const data: Prisma.AbsenceUpdateInput = {
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
      ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
      ...(input.entity !== undefined ? { entity: input.entity } : {}),
      ...(input.supportNumber !== undefined ? { supportNumber: input.supportNumber } : {}),
      ...(input.diagnosis !== undefined ? { diagnosis: input.diagnosis } : {}),
      ...(input.reason !== undefined ? { reason: input.reason } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.documentUrl !== undefined ? { documentUrl: input.documentUrl } : {}),
    };

    // Recalcula días y efecto en nómina si cambió el tipo o las fechas.
    if (input.type !== undefined || input.startDate !== undefined || input.endDate !== undefined) {
      const days = this.computeDays(type, startDate, endDate);
      if (days <= 0) throw new AppError('El rango de fechas no genera días de ausencia.', 422);
      data.days = new Prisma.Decimal(days);
      data.affectsPayroll = absenceAffectsPayroll(type);
    }

    const updated = await prisma.absence.update({
      where: { id },
      data,
      include: { employee: employeeSelect },
    });

    await auditService.record({
      organizationId,
      actor,
      action: 'UPDATE',
      entity: 'Absence',
      entityId: id,
      entityLabel: `${updated.employee.firstName} ${updated.employee.lastName}`,
    });
    return updated;
  }

  async remove(id: string, organizationId: string, actor?: Actor) {
    const current = await this.getById(id, organizationId);
    await prisma.absence.delete({ where: { id } });
    await auditService.record({
      organizationId,
      actor,
      action: 'DELETE',
      entity: 'Absence',
      entityId: id,
      entityLabel: `${current.employee.firstName} ${current.employee.lastName}`,
    });
    return { id };
  }

  /**
   * Saldo de vacaciones del empleado.
   * Causación: 1.25 días hábiles por mes trabajado desde el ingreso.
   * Disponible = causado + ajustes − días de vacaciones tomados.
   */
  async vacationBalance(employeeId: string, organizationId: string) {
    const employee = await this.ensureEmployee(employeeId, organizationId);
    const today = new Date();
    const daysWorked = Math.max(0, countCalendarDays(employee.hireDate, today) - 1);
    const accrued = round2((daysWorked / 360) * 15); // 15 días hábiles / año

    const [adjustments, vacations] = await Promise.all([
      prisma.vacationAdjustment.findMany({ where: { employeeId }, orderBy: { effectiveDate: 'desc' } }),
      prisma.absence.findMany({
        where: { employeeId, type: 'VACATION', status: { in: EFFECTIVE_STATUSES } },
        select: { days: true },
      }),
    ]);

    const adjustmentTotal = round2(adjustments.reduce((acc, a) => acc + num(a.days), 0));
    const taken = round2(vacations.reduce((acc, v) => acc + num(v.days), 0));
    const available = round2(accrued + adjustmentTotal - taken);

    return {
      employeeId,
      hireDate: employee.hireDate,
      accrued,
      adjustments: adjustmentTotal,
      taken,
      available,
      adjustmentHistory: adjustments.map((a) => ({
        id: a.id,
        days: num(a.days),
        reason: a.reason,
        effectiveDate: a.effectiveDate,
      })),
    };
  }

  async addAdjustment(organizationId: string, input: CreateAdjustmentInput, actor?: Actor) {
    const employee = await this.ensureEmployee(input.employeeId, organizationId);
    const adjustment = await prisma.vacationAdjustment.create({
      data: {
        organizationId,
        employeeId: input.employeeId,
        days: new Prisma.Decimal(input.days),
        reason: input.reason ?? null,
        effectiveDate: input.effectiveDate ?? new Date(),
      },
    });
    await auditService.record({
      organizationId,
      actor,
      action: 'CREATE',
      entity: 'VacationAdjustment',
      entityId: adjustment.id,
      entityLabel: `${employee.firstName} ${employee.lastName} · ${input.days > 0 ? '+' : ''}${input.days} días`,
    });
    return this.vacationBalance(input.employeeId, organizationId);
  }

  /** Resumen para tableros: días por grupo en un rango, y por estado. */
  async summary(organizationId: string, from: Date, to: Date) {
    const absences = await prisma.absence.findMany({
      where: {
        organizationId,
        status: { in: EFFECTIVE_STATUSES },
        startDate: { lte: to },
        endDate: { gte: from },
      },
      select: { type: true, startDate: true, endDate: true, days: true },
    });
    const byGroup: Record<string, number> = {};
    for (const a of absences) {
      const rule = getAbsenceRule(a.type);
      const daysInRange = countDaysInPeriod(a.startDate, a.endDate, from, to, rule.dayCount);
      byGroup[rule.group] = (byGroup[rule.group] ?? 0) + daysInRange;
    }
    return { total: absences.length, byGroup };
  }
}

export const absenceService = new AbsenceService();
