import { Prisma, NoveltyKind } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError, NotFoundError } from '../../core/errors/AppError';
import { auditService, Actor } from '../audit/audit.service';
import {
  DEDUCTION_TYPES,
  EARNING_TYPES,
  OVERTIME_TYPES,
  overtimeAmount,
  overtimeFactor,
} from '../../config/payroll-novelties';
import type { CreateNoveltyInput, ListNoveltiesQuery, UpdateNoveltyInput } from './novelty.schema';

const num = (d: Prisma.Decimal | number | null): number =>
  d == null ? 0 : typeof d === 'number' ? d : Number(d.toString());

/** Cliente de Prisma o cliente de transacción (para operaciones atómicas). */
type PrismaLike = typeof prisma | Prisma.TransactionClient;

const employeeSelect = {
  select: { id: true, firstName: true, lastName: true, documentNumber: true, photoUrl: true },
};

const LABELS: Record<string, string> = Object.fromEntries(
  [...OVERTIME_TYPES, ...EARNING_TYPES, ...DEDUCTION_TYPES].map((t) => [t.code, t.label]),
);

export class NoveltyService {
  catalog() {
    return { overtime: OVERTIME_TYPES, earnings: EARNING_TYPES, deductions: DEDUCTION_TYPES };
  }

  list(organizationId: string, query: ListNoveltiesQuery) {
    const where: Prisma.PayrollNoveltyWhereInput = { organizationId };
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.kind) where.kind = query.kind;
    if (query.active) where.isActive = query.active === 'true';
    return prisma.payrollNovelty.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { employee: employeeSelect },
    });
  }

  async create(organizationId: string, input: CreateNoveltyInput, actor?: Actor) {
    const employee = await prisma.employee.findFirst({
      where: { id: input.employeeId, organizationId },
      select: {
        firstName: true,
        lastName: true,
        contracts: { where: { isActive: true }, select: { baseSalary: true }, take: 1 },
      },
    });
    if (!employee) throw new NotFoundError('Empleado');

    let amount = input.amount ?? 0;
    let hours: number | null = null;
    let factor: number | null = null;
    let concept = input.concept?.trim() || LABELS[input.code] || input.code;

    // Horas extra: cálculo automático a partir del salario y el factor.
    if (input.code.startsWith('OT_')) {
      factor = overtimeFactor(input.code);
      if (factor == null) throw new AppError('Tipo de hora extra inválido.', 400);
      if (!input.hours) throw new AppError('Indica el número de horas.', 400);
      const salary = num(employee.contracts[0]?.baseSalary ?? 0);
      if (salary <= 0) throw new AppError('El empleado no tiene salario en su contrato vigente.', 422);
      hours = input.hours;
      amount = overtimeAmount(salary, hours, factor);
      concept = `${LABELS[input.code]} (${hours}h)`;
    } else if (!input.amount || input.amount <= 0) {
      throw new AppError('Indica el valor de la novedad.', 400);
    }

    const created = await prisma.payrollNovelty.create({
      data: {
        organizationId,
        employeeId: input.employeeId,
        kind: input.kind,
        code: input.code,
        concept,
        amount: new Prisma.Decimal(amount),
        recurring: input.recurring,
        installments: input.installments ?? null,
        year: input.year ?? null,
        month: input.month ?? null,
        hours: hours != null ? new Prisma.Decimal(hours) : null,
        factor: factor != null ? new Prisma.Decimal(factor) : null,
        notes: input.notes ?? null,
      },
      include: { employee: employeeSelect },
    });
    await auditService.record({
      organizationId,
      actor,
      action: 'CREATE',
      entity: 'PayrollNovelty',
      entityId: created.id,
      entityLabel: `${employee.firstName} ${employee.lastName} · ${concept}`,
    });
    return created;
  }

  async update(id: string, organizationId: string, input: UpdateNoveltyInput, actor?: Actor) {
    const current = await prisma.payrollNovelty.findFirst({ where: { id, organizationId } });
    if (!current) throw new NotFoundError('Novedad');
    const updated = await prisma.payrollNovelty.update({
      where: { id },
      data: {
        ...(input.concept !== undefined ? { concept: input.concept } : {}),
        ...(input.amount !== undefined ? { amount: new Prisma.Decimal(input.amount) } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.installments !== undefined ? { installments: input.installments } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
      include: { employee: employeeSelect },
    });
    await auditService.record({
      organizationId,
      actor,
      action: 'UPDATE',
      entity: 'PayrollNovelty',
      entityId: id,
    });
    return updated;
  }

  async remove(id: string, organizationId: string, actor?: Actor) {
    const current = await prisma.payrollNovelty.findFirst({ where: { id, organizationId } });
    if (!current) throw new NotFoundError('Novedad');
    await prisma.payrollNovelty.delete({ where: { id } });
    await auditService.record({ organizationId, actor, action: 'DELETE', entity: 'PayrollNovelty', entityId: id });
    return { id };
  }

  /** Novedades aplicables a un periodo (para la liquidación). */
  async applicableForPeriod(organizationId: string, year: number, month: number) {
    const rows = await prisma.payrollNovelty.findMany({
      where: {
        organizationId,
        isActive: true,
        AND: [
          { OR: [{ year: null }, { year }] },
          { OR: [{ month: null }, { month }] },
        ],
        OR: [{ recurring: true }, { recurring: false, appliedCount: 0 }],
      },
    });
    // Excluye recurrentes que ya completaron sus cuotas.
    return rows.filter((r) => !(r.recurring && r.installments != null && r.appliedCount >= r.installments));
  }

  /**
   * Marca como aplicadas las novedades usadas en un periodo.
   *
   * Acepta un cliente de transacción para poder ejecutarse de forma atómica
   * junto con la creación del periodo de nómina (evita que una novedad quede
   * incluida en un desprendible sin marcarse como aplicada, o viceversa).
   */
  async markApplied(ids: string[], client: PrismaLike = prisma) {
    if (ids.length === 0) return;
    const novelties = await client.payrollNovelty.findMany({ where: { id: { in: ids } } });
    for (const n of novelties) {
      const nextCount = n.appliedCount + 1;
      const done = !n.recurring || (n.installments != null && nextCount >= n.installments);
      await client.payrollNovelty.update({
        where: { id: n.id },
        data: { appliedCount: nextCount, isActive: done ? false : n.isActive },
      });
    }
  }
}

export const noveltyService = new NoveltyService();
