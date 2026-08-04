import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { alertsService } from '../alerts/alerts.service';
import { getAbsenceRule } from '../../config/absence-rules';

const num = (d: Prisma.Decimal | number | null): number =>
  d == null ? 0 : typeof d === 'number' ? d : Number(d.toString());

const EFFECTIVE = ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] as const;

function labelCount(map: Map<string, number>) {
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export class ReportService {
  // ============================ Planta y rotación =========================
  async headcount(organizationId: string) {
    const now = new Date();
    const employees = await prisma.employee.findMany({
      where: { organizationId },
      select: {
        status: true,
        gender: true,
        workLocation: true,
        hireDate: true,
        birthDate: true,
        terminationDate: true,
        department: { select: { name: true } },
        contracts: { where: { isActive: true }, select: { type: true }, take: 1 },
      },
    });

    const onLeave = (
      await prisma.absence.groupBy({
        by: ['employeeId'],
        where: {
          organizationId,
          status: { in: ['APPROVED', 'IN_PROGRESS'] },
          startDate: { lte: now },
          endDate: { gte: now },
        },
      })
    ).length;

    const totals = {
      total: employees.length,
      active: employees.filter((e) => e.status === 'ACTIVE').length,
      terminated: employees.filter((e) => e.status === 'TERMINATED').length,
      onLeave,
    };

    const byDepartment = new Map<string, number>();
    const byContractType = new Map<string, number>();
    const byGender = new Map<string, number>();
    const byLocation = new Map<string, number>();
    const bySeniority = new Map<string, number>();
    const byAge = new Map<string, number>();
    const genderLabel: Record<string, string> = { MALE: 'Hombres', FEMALE: 'Mujeres', OTHER: 'Otro' };
    const typeLabel: Record<string, string> = {
      INDEFINITE: 'Término indefinido',
      FIXED_TERM: 'Término fijo',
      WORK_LABOR: 'Obra o labor',
      APPRENTICESHIP: 'Aprendizaje',
      TEMPORARY: 'Temporal',
    };
    const inc = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
    const years = (d: Date) => (now.getTime() - d.getTime()) / (365.25 * 86400000);

    for (const e of employees.filter((x) => x.status !== 'TERMINATED')) {
      inc(byDepartment, e.department?.name ?? 'Sin asignar');
      inc(byLocation, e.workLocation || 'Sin sede');
      inc(byGender, e.gender ? genderLabel[e.gender] : 'Sin registrar');
      const t = e.contracts[0]?.type;
      inc(byContractType, t ? typeLabel[t] ?? t : 'Sin contrato');
      const ant = years(e.hireDate);
      inc(bySeniority, ant < 1 ? '< 1 año' : ant < 3 ? '1 a 3 años' : ant < 5 ? '3 a 5 años' : '5+ años');
      if (e.birthDate) {
        const a = years(e.birthDate);
        inc(byAge, a < 26 ? '18-25' : a < 36 ? '26-35' : a < 46 ? '36-45' : a < 56 ? '46-55' : '56+');
      }
    }

    // Rotación: altas y bajas de los últimos 12 meses.
    const months: { key: string; label: string; hires: number; exits: number }[] = [];
    const fmt = new Intl.DateTimeFormat('es-CO', { month: 'short', year: '2-digit', timeZone: 'UTC' });
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      months.push({ key: `${d.getUTCFullYear()}-${d.getUTCMonth()}`, label: fmt.format(d), hires: 0, exits: 0 });
    }
    const idx = new Map(months.map((m, i) => [m.key, i]));
    for (const e of employees) {
      const hk = `${e.hireDate.getUTCFullYear()}-${e.hireDate.getUTCMonth()}`;
      if (idx.has(hk)) months[idx.get(hk)!].hires += 1;
      if (e.terminationDate) {
        const tk = `${e.terminationDate.getUTCFullYear()}-${e.terminationDate.getUTCMonth()}`;
        if (idx.has(tk)) months[idx.get(tk)!].exits += 1;
      }
    }
    const exits12 = months.reduce((a, m) => a + m.exits, 0);
    const turnoverRate = totals.active > 0 ? Math.round((exits12 / totals.active) * 1000) / 10 : 0;

    return {
      totals,
      byDepartment: labelCount(byDepartment),
      byContractType: labelCount(byContractType),
      byGender: labelCount(byGender),
      byLocation: labelCount(byLocation),
      bySeniority: labelCount(bySeniority),
      byAge: labelCount(byAge),
      turnover: months.map((m) => ({ label: m.label, hires: m.hires, exits: m.exits })),
      turnoverRate,
    };
  }

  // ============================ Costos de nómina =========================
  async payroll(organizationId: string, year: number) {
    const periods = await prisma.payrollPeriod.findMany({
      where: { organizationId, year },
      select: {
        month: true,
        totalEarnings: true,
        totalDeductions: true,
        totalNet: true,
        totalEmployerCost: true,
      },
      orderBy: { month: 'asc' },
    });
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthly = periods.map((p) => ({
      label: monthNames[p.month - 1] ?? String(p.month),
      net: num(p.totalNet),
      employerCost: num(p.totalEmployerCost),
      earnings: num(p.totalEarnings),
      deductions: num(p.totalDeductions),
    }));
    const totals = monthly.reduce(
      (a, m) => ({
        net: a.net + m.net,
        employerCost: a.employerCost + m.employerCost,
        earnings: a.earnings + m.earnings,
        deductions: a.deductions + m.deductions,
      }),
      { net: 0, employerCost: 0, earnings: 0, deductions: 0 },
    );

    // Costo por departamento (a partir de los desprendibles del año).
    const payslips = await prisma.payslip.findMany({
      where: { period: { organizationId, year } },
      select: {
        netPay: true,
        employerCost: true,
        employee: { select: { department: { select: { name: true } } } },
      },
    });
    const byDept = new Map<string, number>();
    for (const p of payslips) {
      const name = p.employee.department?.name ?? 'Sin asignar';
      byDept.set(name, (byDept.get(name) ?? 0) + num(p.employerCost));
    }

    // Distribución salarial (contratos vigentes).
    const contracts = await prisma.contract.findMany({
      where: { isActive: true, employee: { organizationId, status: 'ACTIVE' } },
      select: { baseSalary: true },
    });
    const config = await prisma.payrollConfig.findFirst({
      where: { organizationId },
      orderBy: { year: 'desc' },
    });
    const smmlv = config ? num(config.minimumWage) : 1_623_500;
    const dist = new Map<string, number>([
      ['≤ 1 SMMLV', 0],
      ['1-2 SMMLV', 0],
      ['2-4 SMMLV', 0],
      ['4-8 SMMLV', 0],
      ['8+ SMMLV', 0],
    ]);
    let salarySum = 0;
    for (const c of contracts) {
      const s = num(c.baseSalary);
      salarySum += s;
      const r = s / smmlv;
      const k = r <= 1 ? '≤ 1 SMMLV' : r <= 2 ? '1-2 SMMLV' : r <= 4 ? '2-4 SMMLV' : r <= 8 ? '4-8 SMMLV' : '8+ SMMLV';
      dist.set(k, (dist.get(k) ?? 0) + 1);
    }

    return {
      year,
      monthly,
      totals,
      byDepartment: labelCount(byDept),
      salaryDistribution: [...dist.entries()].map(([label, value]) => ({ label, value })),
      averageSalary: contracts.length ? Math.round(salarySum / contracts.length) : 0,
      employees: contracts.length,
    };
  }

  // ============================== Ausentismo =============================
  async absenteeism(organizationId: string, from: Date, to: Date) {
    const absences = await prisma.absence.findMany({
      where: {
        organizationId,
        status: { in: [...EFFECTIVE] },
        startDate: { gte: from, lte: to },
      },
      select: {
        type: true,
        days: true,
        employeeId: true,
        employee: {
          select: { firstName: true, lastName: true, department: { select: { name: true } } },
        },
      },
    });

    const byType = new Map<string, number>();
    const byGroup = new Map<string, number>();
    const byDept = new Map<string, number>();
    const byEmp = new Map<string, { name: string; days: number }>();
    const groupLabel: Record<string, string> = {
      VACATION: 'Vacaciones',
      INCAPACITY: 'Incapacidades',
      LICENSE: 'Licencias',
      PERMIT: 'Permisos',
    };
    let incGeneral = 0;
    let incLabor = 0;
    let totalDays = 0;
    for (const a of absences) {
      const d = num(a.days);
      totalDays += d;
      const rule = getAbsenceRule(a.type);
      byType.set(rule.label, (byType.get(rule.label) ?? 0) + d);
      byGroup.set(groupLabel[rule.group] ?? rule.group, (byGroup.get(groupLabel[rule.group] ?? rule.group) ?? 0) + d);
      byDept.set(a.employee.department?.name ?? 'Sin asignar', (byDept.get(a.employee.department?.name ?? 'Sin asignar') ?? 0) + d);
      const cur = byEmp.get(a.employeeId) ?? { name: `${a.employee.firstName} ${a.employee.lastName}`, days: 0 };
      cur.days += d;
      byEmp.set(a.employeeId, cur);
      if (a.type === 'SICK_GENERAL') incGeneral += d;
      if (a.type === 'SICK_LABOR') incLabor += d;
    }

    const activeCount = await prisma.employee.count({ where: { organizationId, status: 'ACTIVE' } });

    return {
      totalDays: Math.round(totalDays * 10) / 10,
      avgDaysPerEmployee: activeCount ? Math.round((totalDays / activeCount) * 10) / 10 : 0,
      byType: labelCount(byType),
      byGroup: labelCount(byGroup),
      byDepartment: labelCount(byDept),
      incapacityByOrigin: [
        { label: 'Enf. general (EPS)', value: Math.round(incGeneral * 10) / 10 },
        { label: 'Laboral (ARL)', value: Math.round(incLabor * 10) / 10 },
      ],
      topEmployees: [...byEmp.values()].sort((a, b) => b.days - a.days).slice(0, 10),
      vacationLiability: await this.vacationLiability(organizationId),
    };
  }

  /** Pasivo de vacaciones: días pendientes y su valor estimado. */
  private async vacationLiability(organizationId: string) {
    const employees = await prisma.employee.findMany({
      where: { organizationId, status: 'ACTIVE' },
      select: {
        id: true,
        hireDate: true,
        contracts: { where: { isActive: true }, select: { baseSalary: true }, take: 1 },
      },
    });
    const taken = await prisma.absence.groupBy({
      by: ['employeeId'],
      where: { organizationId, type: 'VACATION', status: { in: [...EFFECTIVE] } },
      _sum: { days: true },
    });
    const adj = await prisma.vacationAdjustment.groupBy({
      by: ['employeeId'],
      where: { organizationId },
      _sum: { days: true },
    });
    const takenBy = new Map(taken.map((t) => [t.employeeId, num(t._sum.days)]));
    const adjBy = new Map(adj.map((a) => [a.employeeId, num(a._sum.days)]));

    const now = Date.now();
    let totalDays = 0;
    let totalValue = 0;
    for (const e of employees) {
      const daysWorked = Math.max(0, (now - e.hireDate.getTime()) / 86400000);
      const accrued = (daysWorked / 360) * 15;
      const available = accrued + (adjBy.get(e.id) ?? 0) - (takenBy.get(e.id) ?? 0);
      if (available <= 0) continue;
      totalDays += available;
      const daily = num(e.contracts[0]?.baseSalary ?? 0) / 30;
      totalValue += available * daily;
    }
    return { days: Math.round(totalDays * 10) / 10, value: Math.round(totalValue) };
  }

  // =========================== Cumplimiento ==============================
  async compliance(organizationId: string) {
    const alerts = await alertsService.getAlerts(organizationId);

    const [consentYes, activeTotal] = await Promise.all([
      prisma.employee.count({ where: { organizationId, status: 'ACTIVE', dataConsent: true } }),
      prisma.employee.count({ where: { organizationId, status: 'ACTIVE' } }),
    ]);

    const distBy = async (field: 'eps' | 'pensionFund' | 'arl' | 'compensationFund') => {
      const rows = await prisma.employee.groupBy({
        by: [field],
        where: { organizationId, status: 'ACTIVE' },
        _count: { _all: true },
      });
      return rows
        .map((r) => ({ label: (r[field] as string | null) || 'Sin asignar', value: r._count._all }))
        .sort((a, b) => b.value - a.value);
    };

    return {
      alerts: alerts.counts,
      alertItems: alerts.items.slice(0, 30),
      habeasData: { consented: consentYes, pending: Math.max(0, activeTotal - consentYes), total: activeTotal },
      eps: await distBy('eps'),
      pension: await distBy('pensionFund'),
      arl: await distBy('arl'),
      compensationFund: await distBy('compensationFund'),
    };
  }
}

export const reportService = new ReportService();
