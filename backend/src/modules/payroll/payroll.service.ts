import { Prisma, PayrollPeriodType, AbsenceStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { payrollRepository, PayrollRepository } from './payroll.repository';
import { calculatePayroll, PayrollConfigValues } from './payroll.calculator';
import { computeAbsenceNovelties } from './absence-novelties';
import { noveltyService } from '../novelties/novelty.service';
import { reserveNumbers, formatDocNumber } from '../../core/utils/sequence';
import { sendMail, isMailConfigured } from '../../config/mailer';
import { renderPayslipEmailBody, periodPhrase } from './payslip-email';
import { renderPayslipPdf } from './payslip-pdf';
import { AppError, ConflictError, NotFoundError } from '../../core/errors/AppError';
import type { CreatePeriodInput, SimulateInput, UpsertConfigInput } from './payroll.schema';

/**
 * Valores por defecto de parametrización legal (referencia 2026).
 * Se usan cuando la empresa aún no ha configurado sus parámetros; son
 * editables desde el módulo de Nómina.
 */
const DEFAULT_CONFIG = {
  minimumWage: 1_623_500,
  transportAllowance: 200_000,
  uvt: 49_799,
  healthEmployeeRate: 0.04,
  healthEmployerRate: 0.085,
  pensionEmployeeRate: 0.04,
  pensionEmployerRate: 0.12,
  senaRate: 0.02,
  icbfRate: 0.03,
  compensationFundRate: 0.04,
  severanceRate: 0.0833,
  severanceInterestRate: 0.01,
  serviceBonusRate: 0.0833,
  vacationRate: 0.0417,
};

const num = (d: Prisma.Decimal | number): number =>
  typeof d === 'number' ? d : Number(d.toString());

export class PayrollService {
  constructor(private readonly repo: PayrollRepository = payrollRepository) {}

  private toConfigValues(config: {
    minimumWage: Prisma.Decimal;
    transportAllowance: Prisma.Decimal;
    healthEmployeeRate: Prisma.Decimal;
    healthEmployerRate: Prisma.Decimal;
    pensionEmployeeRate: Prisma.Decimal;
    pensionEmployerRate: Prisma.Decimal;
    senaRate: Prisma.Decimal;
    icbfRate: Prisma.Decimal;
    compensationFundRate: Prisma.Decimal;
    severanceRate: Prisma.Decimal;
    severanceInterestRate: Prisma.Decimal;
    serviceBonusRate: Prisma.Decimal;
    vacationRate: Prisma.Decimal;
  }): PayrollConfigValues {
    return {
      minimumWage: num(config.minimumWage),
      transportAllowance: num(config.transportAllowance),
      healthEmployeeRate: num(config.healthEmployeeRate),
      healthEmployerRate: num(config.healthEmployerRate),
      pensionEmployeeRate: num(config.pensionEmployeeRate),
      pensionEmployerRate: num(config.pensionEmployerRate),
      senaRate: num(config.senaRate),
      icbfRate: num(config.icbfRate),
      compensationFundRate: num(config.compensationFundRate),
      severanceRate: num(config.severanceRate),
      severanceInterestRate: num(config.severanceInterestRate),
      serviceBonusRate: num(config.serviceBonusRate),
      vacationRate: num(config.vacationRate),
    };
  }

  async getConfigValues(organizationId: string, year: number): Promise<PayrollConfigValues> {
    const config =
      (await this.repo.findConfig(organizationId, year)) ??
      (await this.repo.findLatestConfig(organizationId));
    if (config) return this.toConfigValues(config);
    return { ...DEFAULT_CONFIG };
  }

  async getConfig(organizationId: string, year: number) {
    const config = await this.repo.findConfig(organizationId, year);
    if (config) return config;
    // Devuelve los valores por defecto (aún no persistidos) para la UI.
    return { organizationId, year, ...DEFAULT_CONFIG, isActive: true, persisted: false };
  }

  async upsertConfig(organizationId: string, input: UpsertConfigInput) {
    const data: Prisma.PayrollConfigCreateInput = {
      organization: { connect: { id: organizationId } },
      year: input.year,
      minimumWage: new Prisma.Decimal(input.minimumWage),
      transportAllowance: new Prisma.Decimal(input.transportAllowance),
      uvt: new Prisma.Decimal(input.uvt),
      healthEmployeeRate: new Prisma.Decimal(input.healthEmployeeRate ?? DEFAULT_CONFIG.healthEmployeeRate),
      healthEmployerRate: new Prisma.Decimal(input.healthEmployerRate ?? DEFAULT_CONFIG.healthEmployerRate),
      pensionEmployeeRate: new Prisma.Decimal(input.pensionEmployeeRate ?? DEFAULT_CONFIG.pensionEmployeeRate),
      pensionEmployerRate: new Prisma.Decimal(input.pensionEmployerRate ?? DEFAULT_CONFIG.pensionEmployerRate),
      senaRate: new Prisma.Decimal(input.senaRate ?? DEFAULT_CONFIG.senaRate),
      icbfRate: new Prisma.Decimal(input.icbfRate ?? DEFAULT_CONFIG.icbfRate),
      compensationFundRate: new Prisma.Decimal(input.compensationFundRate ?? DEFAULT_CONFIG.compensationFundRate),
      severanceRate: new Prisma.Decimal(input.severanceRate ?? DEFAULT_CONFIG.severanceRate),
      severanceInterestRate: new Prisma.Decimal(input.severanceInterestRate ?? DEFAULT_CONFIG.severanceInterestRate),
      serviceBonusRate: new Prisma.Decimal(input.serviceBonusRate ?? DEFAULT_CONFIG.serviceBonusRate),
      vacationRate: new Prisma.Decimal(input.vacationRate ?? DEFAULT_CONFIG.vacationRate),
    };
    return this.repo.upsertConfig(organizationId, input.year, data);
  }

  async simulate(organizationId: string, input: SimulateInput) {
    const config = await this.getConfigValues(organizationId, input.year ?? new Date().getFullYear());
    return calculatePayroll({
      baseSalary: input.baseSalary,
      workedDays: input.workedDays,
      hasTransportAllowance: input.hasTransportAllowance,
      isIntegralSalary: input.isIntegralSalary,
      arlRiskClass: input.arlRiskClass,
      config,
    });
  }

  listPeriods(organizationId: string, filters: { year?: number; status?: string }) {
    const where: Prisma.PayrollPeriodWhereInput = {};
    if (filters.year) where.year = filters.year;
    if (filters.status) where.status = filters.status as never;
    return this.repo.findPeriods(organizationId, where);
  }

  async getPeriod(id: string, organizationId: string) {
    const period = await this.repo.findPeriodById(id, organizationId);
    if (!period) throw new NotFoundError('Periodo de nómina');
    return period;
  }

  /** Datos completos de un periodo para generar los desprendibles en masa. */
  async periodForPrint(id: string, organizationId: string) {
    const period = await this.repo.periodForPrint(id, organizationId);
    if (!period) throw new NotFoundError('Periodo de nómina');
    return period;
  }

  /** Envía por correo el desprendible a cada empleado del periodo con correo. */
  async sendPeriodPayslips(id: string, organizationId: string) {
    if (!isMailConfigured()) {
      throw new AppError(
        'El envío de correos no está configurado. Define las variables SMTP_* en el .env del servidor.',
        400,
      );
    }
    const period = await this.repo.periodForPrint(id, organizationId);
    if (!period) throw new NotFoundError('Periodo de nómina');

    const phrase = periodPhrase(period.type, period.month, period.year);
    let sent = 0;
    let skipped = 0;
    const failed: string[] = [];
    for (const p of period.payslips) {
      const email = p.employee.email;
      const name = `${p.employee.firstName} ${p.employee.lastName}`;
      if (!email) {
        skipped += 1;
        continue;
      }
      try {
        const pdf = await renderPayslipPdf(period.name, p, period.organization);
        const fileName = `Desprendible-${p.number ?? p.employee.documentNumber}.pdf`;
        await sendMail({
          to: email,
          subject: `Comprobante de pago · ${period.name}`,
          html: renderPayslipEmailBody(name, phrase, period.organization),
          attachments: [{ filename: fileName, content: pdf, contentType: 'application/pdf' }],
        });
        sent += 1;
      } catch {
        failed.push(name);
      }
    }
    return { sent, skipped, failed };
  }

  async getPayslip(id: string, organizationId: string) {
    const payslip = await this.repo.findPayslipById(id, organizationId);
    if (!payslip) throw new NotFoundError('Desprendible');
    return payslip;
  }

  /** Genera un periodo de nómina y liquida a todos los empleados activos. */
  async createPeriod(organizationId: string, input: CreatePeriodInput) {
    const existing = await this.repo.findPeriodByPeriodKey(
      organizationId,
      input.year,
      input.month,
      input.type,
    );
    if (existing) {
      throw new ConflictError('Ya existe una nómina para este mes y tipo de periodo.');
    }

    const config = await this.getConfigValues(organizationId, input.year);
    const employees = await this.repo.activeEmployeesWithContract(organizationId);
    const eligible = employees.filter((e) => e.contracts.length > 0);

    if (eligible.length === 0) {
      throw new AppError('No hay empleados activos con contrato vigente para liquidar.', 422);
    }

    const startDate = new Date(input.year, input.month - 1, 1);
    const endDate = new Date(input.year, input.month, 0);

    // Novedades por ausencias del período (vacaciones, incapacidades, etc.).
    // Solo cuentan las aprobadas, en disfrute o finalizadas que se solapan
    // con el mes liquidado.
    const absences = await prisma.absence.findMany({
      where: {
        organizationId,
        status: { in: [AbsenceStatus.APPROVED, AbsenceStatus.IN_PROGRESS, AbsenceStatus.COMPLETED] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      select: { employeeId: true, type: true, startDate: true, endDate: true },
    });
    const absencesByEmployee = new Map<string, typeof absences>();
    for (const a of absences) {
      const list = absencesByEmployee.get(a.employeeId) ?? [];
      list.push(a);
      absencesByEmployee.set(a.employeeId, list);
    }

    // Novedades de nómina aplicables al periodo (horas extra, bonos, préstamos).
    const novelties = await noveltyService.applicableForPeriod(organizationId, input.year, input.month);
    const noveltiesByEmployee = new Map<string, typeof novelties>();
    for (const n of novelties) {
      const list = noveltiesByEmployee.get(n.employeeId) ?? [];
      list.push(n);
      noveltiesByEmployee.set(n.employeeId, list);
    }
    const appliedNoveltyIds: string[] = [];

    // Precalcula todo antes de tocar la BD.
    const computed = eligible.map((emp) => {
      const contract = emp.contracts[0];
      const baseSalary = num(contract.baseSalary);
      const empAbsences = absencesByEmployee.get(emp.id) ?? [];
      const absenceNov = computeAbsenceNovelties(
        empAbsences,
        baseSalary,
        config.minimumWage,
        startDate,
        endDate,
        input.workedDays,
      );

      // Novedades de nómina del empleado → devengados y deducciones extra.
      const extraEarnings = [...absenceNov.additionalEarnings];
      const extraDeductions: { code: string; concept: string; amount: number }[] = [];
      for (const n of noveltiesByEmployee.get(emp.id) ?? []) {
        appliedNoveltyIds.push(n.id);
        const amount = num(n.amount);
        if (n.kind === 'EARNING') {
          extraEarnings.push({ code: n.code, concept: n.concept, amount, funder: 'EMPLOYER' });
        } else {
          extraDeductions.push({ code: n.code, concept: n.concept, amount });
        }
      }

      const result = calculatePayroll({
        baseSalary,
        workedDays: absenceNov.paidDays,
        hasTransportAllowance: contract.transportAllowance,
        isIntegralSalary: contract.isIntegralSalary,
        arlRiskClass: emp.arlRiskClass,
        config,
        additionalEarnings: extraEarnings,
        additionalDeductions: extraDeductions,
      });
      return { employeeId: emp.id, baseSalary, workedDays: absenceNov.paidDays, result };
    });

    const totals = computed.reduce(
      (acc, c) => ({
        totalEarnings: acc.totalEarnings + c.result.totalEarnings,
        totalDeductions: acc.totalDeductions + c.result.totalDeductions,
        totalNet: acc.totalNet + c.result.netPay,
        totalEmployerCost: acc.totalEmployerCost + c.result.employerCost,
      }),
      { totalEarnings: 0, totalDeductions: 0, totalNet: 0, totalEmployerCost: 0 },
    );

    const periodData: Prisma.PayrollPeriodCreateInput = {
      organization: { connect: { id: organizationId } },
      name: input.name,
      type: input.type as PayrollPeriodType,
      year: input.year,
      month: input.month,
      startDate,
      endDate,
      paymentDate: input.paymentDate ?? null,
      status: 'DRAFT',
    };

    // Consecutivos correlativos para los desprendibles de este periodo.
    const firstNumber = await reserveNumbers(organizationId, 'PAYSLIP', computed.length);
    const numberByEmployee = new Map<string, string>();
    computed.forEach((c, i) =>
      numberByEmployee.set(c.employeeId, formatDocNumber('PAYSLIP', firstNumber + i)),
    );

    const period = await this.repo.createPeriodWithPayslips(
      periodData,
      (periodId) =>
        computed.map((c) => ({
          periodId,
          employeeId: c.employeeId,
          number: numberByEmployee.get(c.employeeId),
          workedDays: c.workedDays,
          baseSalary: new Prisma.Decimal(c.baseSalary),
          totalEarnings: new Prisma.Decimal(c.result.totalEarnings),
          totalDeductions: new Prisma.Decimal(c.result.totalDeductions),
          netPay: new Prisma.Decimal(c.result.netPay),
          employerCost: new Prisma.Decimal(c.result.employerCost),
          status: 'PROCESSED',
        })),
      (payslipMap) =>
        computed.flatMap((c) => {
          const payslipId = payslipMap.get(c.employeeId);
          if (!payslipId) return [];
          return c.result.items.map((item) => ({
            payslipId,
            type: item.type,
            code: item.code,
            concept: item.concept,
            amount: new Prisma.Decimal(item.amount),
          }));
        }),
      totals,
    );

    // Marca las novedades aplicadas (avanza cuotas de préstamos, cierra puntuales).
    await noveltyService.markApplied(appliedNoveltyIds);
    return period;
  }

  async updatePeriodStatus(id: string, organizationId: string, status: string) {
    await this.getPeriod(id, organizationId);
    return this.repo.updatePeriodStatus(id, status as never);
  }

  async deletePeriod(id: string, organizationId: string) {
    const period = await this.getPeriod(id, organizationId);
    if (period.status === 'PAID') {
      throw new AppError('No se puede eliminar una nómina ya pagada.', 422);
    }
    await this.repo.deletePeriod(id);
    return { id };
  }
}

export const payrollService = new PayrollService();
