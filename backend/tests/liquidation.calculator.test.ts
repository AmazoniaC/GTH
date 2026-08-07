import { describe, it, expect } from 'vitest';
import {
  calculateLiquidation,
  days360,
  workedDays360,
} from '../src/modules/liquidations/liquidation.calculator';

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

describe('days360 · convención 30/360', () => {
  it('un mes exacto son 30 días', () => {
    expect(days360(utc(2024, 1, 1), utc(2024, 2, 1))).toBe(30);
  });

  it('un año exacto son 360 días', () => {
    expect(days360(utc(2024, 1, 1), utc(2025, 1, 1))).toBe(360);
  });

  it('normaliza el día 31 a 30', () => {
    expect(days360(utc(2024, 1, 31), utc(2024, 2, 28))).toBe(28);
  });
});

describe('workedDays360 · días inclusivos', () => {
  it('seis meses inclusivos son 180 días', () => {
    expect(workedDays360(utc(2024, 1, 1), utc(2024, 6, 30))).toBe(180);
  });

  it('nunca es negativo', () => {
    expect(workedDays360(utc(2024, 6, 30), utc(2024, 1, 1))).toBe(0);
  });
});

describe('calculateLiquidation · semestre completo', () => {
  const r = calculateLiquidation({
    baseSalary: 1_500_000,
    transportAllowance: 200_000,
    hireDate: utc(2024, 1, 1),
    terminationDate: utc(2024, 6, 30),
    cesantiasFrom: utc(2024, 1, 1),
    primaFrom: utc(2024, 1, 1),
    vacationDays: 15,
    pendingSalaryDays: 0,
  });

  const amount = (code: string) => r.items.find((i) => i.code === code)?.amount;

  it('liquida 180 días de cesantías y prima', () => {
    expect(r.meta.daysCesantias).toBe(180);
    expect(r.meta.daysPrima).toBe(180);
  });

  it('cesantías = base × días / 360', () => {
    expect(amount('CESANTIAS')).toBe(850_000);
  });

  it('intereses de cesantías al 12% proporcional', () => {
    expect(amount('CESANTIAS_INTEREST')).toBe(51_000);
  });

  it('prima proporcional al periodo', () => {
    expect(amount('SERVICE_BONUS')).toBe(850_000);
  });

  it('vacaciones = salario diario × días pendientes (sin transporte)', () => {
    expect(amount('VACATIONS')).toBe(750_000);
  });

  it('total a pagar es la suma de los devengados', () => {
    expect(r.totalEarnings).toBe(2_501_000);
    expect(r.netPay).toBe(2_501_000);
  });
});

describe('calculateLiquidation · conceptos opcionales', () => {
  it('incluye salario pendiente cuando hay días por pagar', () => {
    const r = calculateLiquidation({
      baseSalary: 1_500_000,
      transportAllowance: 0,
      hireDate: utc(2024, 1, 1),
      terminationDate: utc(2024, 6, 15),
      cesantiasFrom: utc(2024, 1, 1),
      primaFrom: utc(2024, 1, 1),
      vacationDays: 0,
      pendingSalaryDays: 15,
    });
    expect(r.items.find((i) => i.code === 'PENDING_SALARY')?.amount).toBe(750_000);
  });

  it('las deducciones reducen el neto', () => {
    const r = calculateLiquidation({
      baseSalary: 1_500_000,
      transportAllowance: 0,
      hireDate: utc(2024, 1, 1),
      terminationDate: utc(2024, 6, 30),
      cesantiasFrom: utc(2024, 1, 1),
      primaFrom: utc(2024, 1, 1),
      vacationDays: 0,
      pendingSalaryDays: 0,
      deductions: [{ concept: 'Préstamo', amount: 100_000 }],
    });
    expect(r.totalDeductions).toBe(100_000);
    expect(r.netPay).toBe(r.totalEarnings - 100_000);
  });
});
