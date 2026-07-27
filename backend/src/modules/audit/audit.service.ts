import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export interface Actor {
  userId?: string;
  userName?: string;
}

export interface AuditInput {
  organizationId: string;
  actor?: Actor;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entityId?: string;
  entityLabel?: string;
  changes?: Record<string, { from: unknown; to: unknown }> | null;
}

/**
 * Servicio de auditoría. Registra creaciones, cambios y eliminaciones de las
 * entidades sensibles. El registro nunca debe interrumpir la operación
 * principal, por eso los errores se silencian.
 */
export class AuditService {
  async record(input: AuditInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.actor?.userId ?? null,
          userName: input.actor?.userName ?? null,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId ?? null,
          entityLabel: input.entityLabel ?? null,
          changes: (input.changes ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Audit] no se pudo registrar la bitácora:', error);
    }
  }

  /** Calcula las diferencias campo a campo entre dos objetos. */
  diff(
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    fields: string[],
  ): Record<string, { from: unknown; to: unknown }> | null {
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const field of fields) {
      if (after[field] === undefined) continue;
      const from = before[field] ?? null;
      const to = after[field] ?? null;
      const norm = (v: unknown) => (v instanceof Date ? v.toISOString() : v);
      if (JSON.stringify(norm(from)) !== JSON.stringify(norm(to))) {
        changes[field] = { from, to };
      }
    }
    return Object.keys(changes).length ? changes : null;
  }

  async list(
    organizationId: string,
    params: { page: number; pageSize: number; entity?: string; action?: string },
  ) {
    const where: Prisma.AuditLogWhereInput = { organizationId };
    if (params.entity) where.entity = params.entity;
    if (params.action) where.action = params.action;

    const [items, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { items, total };
  }
}

export const auditService = new AuditService();
