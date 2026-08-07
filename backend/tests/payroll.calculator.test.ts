import { describe, it, expect } from 'vitest';
import {
  calculatePayroll,
  PayrollConfigValues,
} from '../src/modules/payroll/payroll.calculator';

/** Parametrización legal de referencia (2026) usada en las pruebas. */
const config: PayrollConfigValues = {
  minimumWage: 1_623_500,
  transportAllowance: 200_000,
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

const base = {
  hasTransportAllowance: true,
  isIntegralSalary: false,
  arlRiskClass: 1,
  config,
};

const codes = (r: ReturnType<typeof calculatePayroll>) => r.items.map((i) => i.code);
const item = (r: ReturnType<typeof calculatePayroll>, code: string) =>
  r.items.find((i) => i.code === code);

describe('calculatePayroll · salario mínimo, mes completo', () => {
  const r = calculatePayroll({ ...base, baseSalary: 1_623_500, workedDays: 30 });

  it('devenga salario y auxilio de transporte', () => {
    expect(item(r, 'SALARY')?.amount).toBe(1_623_500);
    expect(item(r, 'TRANSPORT')?.amount).toBe(200_000);
    expect(r.totalEarnings).toBe(1_823_500);
  });

  it('el IBC no incluye el auxilio de transporte', () => {
    expect(r.ibc).toBe(1_623_500);
  });

  it('descuenta salud y pensión al 4% del IBC', () => {
    expect(item(r, 'HEALTH_EMP')?.amount).toBe(64_940);
    expect(item(r, 'PENSION_EMP')?.amount).toBe(64_940);
    expect(r.totalDeductions).toBe(129_880);
  });

  it('el neto es devengados menos deducciones', () => {
    expect(r.netPay).toBe(1_693_620);
  });

  it('exonera aportes de salud, SENA e ICBF (salario < 10 SMMLV)', () => {
    expect(codes(r)).not.toContain('HEALTH_ER');
    expect(codes(r)).not.toContain('SENA');
    expect(codes(r)).not.toContain('ICBF');
  });

  it('no aplica fondo de solidaridad por debajo de 4 SMMLV', () => {
    expect(codes(r)).not.toContain('FSP');
  });
});

describe('calculatePayroll · medio mes trabajado', () => {
  const r = calculatePayroll({ ...base, baseSalary: 1_623_500, workedDays: 15 });

  it('prorratea salario y transporte al 50%', () => {
    expect(item(r, 'SALARY')?.amount).toBe(811_750);
    expect(item(r, 'TRANSPORT')?.amount).toBe(100_000);
  });
});

describe('calculatePayroll · umbrales legales', () => {
  it('no paga transporte si el salario supera 2 SMMLV', () => {
    const r = calculatePayroll({ ...base, baseSalary: 4_000_000, workedDays: 30 });
    expect(codes(r)).not.toContain('TRANSPORT');
  });

  it('aplica fondo de solidaridad desde 4 SMMLV', () => {
    const r = calculatePayroll({ ...base, baseSalary: 6_494_000, workedDays: 30 });
    expect(item(r, 'FSP')?.amount).toBe(64_940);
  });

  it('deja de exonerar aportes desde 10 SMMLV', () => {
    const r = calculatePayroll({ ...base, baseSalary: 16_235_000, workedDays: 30 });
    expect(codes(r)).toContain('HEALTH_ER');
    expect(codes(r)).toContain('SENA');
    expect(codes(r)).toContain('ICBF');
  });
});

describe('calculatePayroll · salario integral', () => {
  const r = calculatePayroll({
    ...base,
    baseSalary: 15_000_000,
    workedDays: 30,
    isIntegralSalary: true,
    hasTransportAllowance: false,
  });

  it('el IBC es el 70% del salario', () => {
    expect(r.ibc).toBe(10_500_000);
  });

  it('no provisiona prestaciones sociales', () => {
    expect(codes(r)).not.toContain('CESANTIAS');
    expect(codes(r)).not.toContain('PRIMA');
    expect(codes(r)).not.toContain('VACACIONES');
  });
});

describe('calculatePayroll · novedades adicionales', () => {
  const plain = calculatePayroll({ ...base, baseSalary: 1_623_500, workedDays: 30 });

  it('un devengado financiado por la EPS no es costo del empleador', () => {
    const withEps = calculatePayroll({
      ...base,
      baseSalary: 1_623_500,
      workedDays: 30,
      additionalEarnings: [
        { code: 'INC', concept: 'Incapacidad EPS', amount: 100_000, funder: 'EPS' },
      ],
    });
    expect(withEps.totalEarnings).toBe(plain.totalEarnings + 100_000);
    expect(withEps.employerCost).toBe(plain.employerCost);
  });

  it('un devengado del empleador sí incrementa su costo', () => {
    const withBonus = calculatePayroll({
      ...base,
      baseSalary: 1_623_500,
      workedDays: 30,
      additionalEarnings: [
        { code: 'BONUS', concept: 'Bono', amount: 100_000, funder: 'EMPLOYER' },
      ],
    });
    expect(withBonus.employerCost).toBe(plain.employerCost + 100_000);
  });

  it('una deducción adicional reduce el neto', () => {
    const withLoan = calculatePayroll({
      ...base,
      baseSalary: 1_623_500,
      workedDays: 30,
      additionalDeductions: [{ code: 'LOAN', concept: 'Préstamo', amount: 50_000 }],
    });
    expect(withLoan.netPay).toBe(plain.netPay - 50_000);
  });
});
