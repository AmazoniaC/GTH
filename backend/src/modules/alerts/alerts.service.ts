import { prisma } from '../../config/prisma';

export type AlertCategory = 'CONTRACT' | 'PROBATION' | 'DOCUMENT' | 'BIRTHDAY';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  detail: string;
  employeeId: string;
  employeeName: string;
  documentNumber: string;
  date: string | null;
}

const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};
const daysUntil = (d: Date) =>
  Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
const fullName = (e: { firstName: string; lastName: string }) => `${e.firstName} ${e.lastName}`;

const empSelect = {
  employee: { select: { id: true, firstName: true, lastName: true, documentNumber: true } },
};

/** Motor de alertas del área de RRHH. Calcula avisos accionables en tiempo real. */
export class AlertsService {
  async getAlerts(organizationId: string): Promise<{
    total: number;
    counts: Record<AlertCategory, number>;
    items: Alert[];
  }> {
    const now = new Date();
    const in30 = addDays(now, 30);
    const in15 = addDays(now, 15);

    const [contracts, probations, documents, employees] = await Promise.all([
      prisma.contract.findMany({
        where: {
          isActive: true,
          endDate: { not: null, lte: in30 },
          employee: { organizationId, status: 'ACTIVE' },
        },
        include: empSelect,
      }),
      prisma.contract.findMany({
        where: {
          isActive: true,
          probationEndDate: { not: null, gte: addDays(now, -1), lte: in15 },
          employee: { organizationId, status: 'ACTIVE' },
        },
        include: empSelect,
      }),
      prisma.employeeDocument.findMany({
        where: { expiryDate: { not: null, lte: in30 }, employee: { organizationId } },
        include: empSelect,
      }),
      prisma.employee.findMany({
        where: { organizationId, status: 'ACTIVE', birthDate: { not: null } },
        select: { id: true, firstName: true, lastName: true, documentNumber: true, birthDate: true },
      }),
    ]);

    const items: Alert[] = [];

    for (const c of contracts) {
      const days = daysUntil(c.endDate!);
      items.push({
        id: `contract-${c.id}`,
        category: 'CONTRACT',
        severity: days < 0 ? 'critical' : days <= 7 ? 'critical' : 'warning',
        title: days < 0 ? 'Contrato vencido' : 'Contrato por vencer',
        detail:
          days < 0
            ? `El contrato de ${fullName(c.employee)} venció hace ${Math.abs(days)} día(s).`
            : `El contrato de ${fullName(c.employee)} vence en ${days} día(s).`,
        employeeId: c.employee.id,
        employeeName: fullName(c.employee),
        documentNumber: c.employee.documentNumber,
        date: c.endDate!.toISOString(),
      });
    }

    for (const c of probations) {
      const days = daysUntil(c.probationEndDate!);
      items.push({
        id: `probation-${c.id}`,
        category: 'PROBATION',
        severity: days <= 3 ? 'warning' : 'info',
        title: 'Fin de periodo de prueba',
        detail: `El periodo de prueba de ${fullName(c.employee)} termina en ${days} día(s).`,
        employeeId: c.employee.id,
        employeeName: fullName(c.employee),
        documentNumber: c.employee.documentNumber,
        date: c.probationEndDate!.toISOString(),
      });
    }

    for (const d of documents) {
      const days = daysUntil(d.expiryDate!);
      items.push({
        id: `document-${d.id}`,
        category: 'DOCUMENT',
        severity: days < 0 ? 'critical' : days <= 7 ? 'warning' : 'info',
        title: days < 0 ? 'Documento vencido' : 'Documento por vencer',
        detail: `"${d.name}" de ${fullName(d.employee)} ${
          days < 0 ? `venció hace ${Math.abs(days)} día(s)` : `vence en ${days} día(s)`
        }.`,
        employeeId: d.employee.id,
        employeeName: fullName(d.employee),
        documentNumber: d.employee.documentNumber,
        date: d.expiryDate!.toISOString(),
      });
    }

    const month = now.getUTCMonth();
    const today = now.getUTCDate();
    for (const e of employees) {
      const bd = e.birthDate!;
      if (bd.getUTCMonth() === month && bd.getUTCDate() >= today) {
        items.push({
          id: `birthday-${e.id}`,
          category: 'BIRTHDAY',
          severity: 'info',
          title: 'Cumpleaños',
          detail: `${fullName(e)} cumple años el ${bd.getUTCDate()} de este mes.`,
          employeeId: e.id,
          employeeName: fullName(e),
          documentNumber: e.documentNumber,
          date: bd.toISOString(),
        });
      }
    }

    // Orden: críticos primero, luego por fecha más próxima.
    const rank = { critical: 0, warning: 1, info: 2 };
    items.sort((a, b) => {
      if (rank[a.severity] !== rank[b.severity]) return rank[a.severity] - rank[b.severity];
      return (a.date ?? '').localeCompare(b.date ?? '');
    });

    const counts: Record<AlertCategory, number> = {
      CONTRACT: 0,
      PROBATION: 0,
      DOCUMENT: 0,
      BIRTHDAY: 0,
    };
    items.forEach((i) => (counts[i.category] += 1));

    return { total: items.length, counts, items };
  }
}

export const alertsService = new AlertsService();
