import { Prisma, AbsenceStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError, ForbiddenError, NotFoundError } from '../../core/errors/AppError';
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

// Estados que bloquean una nueva solicitud sobre las mismas fechas (incluye
// las pendientes, para evitar solicitudes duplicadas).
const BLOCKING_STATUSES: AbsenceStatus[] = [...EFFECTIVE_STATUSES, AbsenceStatus.PENDING];

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

  /** Evita solapamientos con otras ausencias vigentes del mismo empleado. */
  private async assertNoOverlap(
    employeeId: string,
    start: Date,
    end: Date,
    excludeId?: string,
  ) {
    const overlap = await prisma.absence.findFirst({
      where: {
        employeeId,
        id: excludeId ? { not: excludeId } : undefined,
        status: { in: EFFECTIVE_STATUSES },
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: { id: true, startDate: true, endDate: true },
    });
    if (overlap) {
      throw new AppError(
        'El empleado ya tiene una ausencia registrada que se cruza con esas fechas.',
        409,
      );
    }
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

    const status = input.status ?? AbsenceStatus.APPROVED;
    if (EFFECTIVE_STATUSES.includes(status)) {
      await this.assertNoOverlap(input.employeeId, input.startDate, input.endDate);
    }

    const created = await prisma.absence.create({
      data: {
        organizationId,
        employeeId: input.employeeId,
        type: input.type,
        status,
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
    const status = input.status ?? current.status;

    // Revalida el solapamiento si cambian fechas o pasa a un estado vigente.
    if (
      EFFECTIVE_STATUSES.includes(status) &&
      (input.startDate !== undefined || input.endDate !== undefined || input.status !== undefined)
    ) {
      await this.assertNoOverlap(current.employeeId, startDate, endDate, id);
    }

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

  // ============================ Solicitudes ==============================

  private async employeeByUser(userId: string, organizationId: string) {
    const employee = await prisma.employee.findFirst({
      where: { userId, organizationId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!employee) {
      throw new AppError('Tu usuario no está vinculado a un empleado.', 404);
    }
    return employee;
  }

  /** Un empleado solicita una ausencia (queda PENDIENTE de aprobación). */
  async createRequest(
    organizationId: string,
    userId: string,
    input: { type: string; startDate: Date; endDate: Date; reason?: string | null; notes?: string | null },
  ) {
    const employee = await this.employeeByUser(userId, organizationId);
    const days = this.computeDays(input.type, input.startDate, input.endDate);
    if (days <= 0) throw new AppError('El rango de fechas no genera días de ausencia.', 422);

    // Evita solicitudes que se crucen con otras vigentes o pendientes.
    const overlap = await prisma.absence.findFirst({
      where: {
        employeeId: employee.id,
        status: { in: BLOCKING_STATUSES },
        startDate: { lte: input.endDate },
        endDate: { gte: input.startDate },
      },
      select: { id: true },
    });
    if (overlap) {
      throw new AppError('Ya tienes una ausencia o solicitud que se cruza con esas fechas.', 409);
    }

    const created = await prisma.absence.create({
      data: {
        organizationId,
        employeeId: employee.id,
        type: input.type,
        status: AbsenceStatus.PENDING,
        startDate: input.startDate,
        endDate: input.endDate,
        days: new Prisma.Decimal(days),
        reason: input.reason ?? null,
        notes: input.notes ?? null,
        affectsPayroll: absenceAffectsPayroll(input.type),
        requestedByUserId: userId,
      },
      include: { employee: employeeSelect },
    });
    await auditService.record({
      organizationId,
      actor: { userId, userName: `${employee.firstName} ${employee.lastName}` },
      action: 'CREATE',
      entity: 'AbsenceRequest',
      entityId: created.id,
      entityLabel: `${employee.firstName} ${employee.lastName} · ${getAbsenceRule(input.type).label}`,
    });
    return created;
  }

  /** El empleado cancela su propia solicitud pendiente. */
  async cancelRequest(id: string, organizationId: string, userId: string) {
    const absence = await this.getById(id, organizationId);
    if (absence.requestedByUserId !== userId) {
      throw new ForbiddenError('Solo puedes cancelar tus propias solicitudes.');
    }
    if (absence.status !== AbsenceStatus.PENDING) {
      throw new AppError('Solo se pueden cancelar solicitudes pendientes.', 409);
    }
    return prisma.absence.update({
      where: { id },
      data: { status: AbsenceStatus.CANCELLED },
      include: { employee: employeeSelect },
    });
  }

  /**
   * Lista las solicitudes pendientes que un usuario puede aprobar.
   * `all` = true para RRHH/Admin (todas); en caso contrario, solo las del
   * equipo a cargo del usuario (jefe directo).
   */
  async listApprovals(organizationId: string, reviewerUserId: string, all: boolean) {
    const where: Prisma.AbsenceWhereInput = { organizationId, status: AbsenceStatus.PENDING };
    if (!all) {
      const reviewer = await prisma.employee.findFirst({
        where: { userId: reviewerUserId, organizationId },
        select: { id: true },
      });
      if (!reviewer) return [];
      where.employee = { managerId: reviewer.id };
    }
    return prisma.absence.findMany({
      where,
      include: { employee: employeeSelect },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Aprueba o rechaza una solicitud pendiente. */
  async review(
    id: string,
    organizationId: string,
    opts: { reviewerUserId: string; canApproveAll: boolean; decision: 'APPROVE' | 'REJECT'; note?: string | null },
  ) {
    const absence = await prisma.absence.findFirst({
      where: { id, organizationId },
      include: { employee: { select: { managerId: true, firstName: true, lastName: true } } },
    });
    if (!absence) throw new NotFoundError('Solicitud');
    if (absence.status !== AbsenceStatus.PENDING) {
      throw new AppError('La solicitud ya fue procesada.', 409);
    }

    // Autorización: RRHH/Admin o el jefe directo del solicitante.
    if (!opts.canApproveAll) {
      const reviewer = await prisma.employee.findFirst({
        where: { userId: opts.reviewerUserId, organizationId },
        select: { id: true },
      });
      if (!reviewer || absence.employee.managerId !== reviewer.id) {
        throw new ForbiddenError('No puedes aprobar solicitudes de este empleado.');
      }
    }

    const approve = opts.decision === 'APPROVE';
    if (approve) {
      await this.assertNoOverlap(absence.employeeId, absence.startDate, absence.endDate, id);
    }

    const updated = await prisma.absence.update({
      where: { id },
      data: {
        status: approve ? AbsenceStatus.APPROVED : AbsenceStatus.REJECTED,
        reviewedByUserId: opts.reviewerUserId,
        reviewedAt: new Date(),
        reviewNote: opts.note ?? null,
      },
      include: { employee: employeeSelect },
    });
    await auditService.record({
      organizationId,
      actor: { userId: opts.reviewerUserId, userName: opts.reviewerUserId },
      action: 'UPDATE',
      entity: 'AbsenceRequest',
      entityId: id,
      entityLabel: `${absence.employee.firstName} ${absence.employee.lastName} · ${approve ? 'Aprobada' : 'Rechazada'}`,
    });
    return updated;
  }

  /** Cuenta las solicitudes pendientes (para insignias en la UI). */
  async pendingCount(organizationId: string) {
    return prisma.absence.count({ where: { organizationId, status: AbsenceStatus.PENDING } });
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
