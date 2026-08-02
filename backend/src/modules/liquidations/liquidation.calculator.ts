/**
 * Cálculo de la liquidación definitiva de contrato (Colombia).
 *
 * Función pura, sin dependencias de infraestructura. Usa la convención de
 * días 30/360 propia de la liquidación de prestaciones sociales.
 */

export const TERMINATION_REASONS = [
  { code: 'RESIGNATION', label: 'Renuncia voluntaria' },
  { code: 'DISMISSAL_WITHOUT_CAUSE', label: 'Despido sin justa causa' },
  { code: 'DISMISSAL_WITH_CAUSE', label: 'Despido con justa causa' },
  { code: 'CONTRACT_END', label: 'Terminación del contrato' },
  { code: 'MUTUAL', label: 'Mutuo acuerdo' },
] as const;

export type LiquidationItemType = 'EARNING' | 'DEDUCTION';

export interface LiquidationItem {
  code: string;
  concept: string;
  type: LiquidationItemType;
  amount: number;
  detail?: string;
}

export interface LiquidationCalcInput {
  baseSalary: number;
  transportAllowance: number; // mensual, ya resuelto (0 si no aplica)
  hireDate: Date;
  terminationDate: Date;
  cesantiasFrom: Date; // fecha desde la que se liquidan cesantías/intereses
  primaFrom: Date; // fecha desde la que se liquida la prima
  vacationDays: number; // días de vacaciones pendientes (del módulo de ausencias)
  pendingSalaryDays: number; // días de salario del último mes aún no pagados
  extraEarnings?: { concept: string; amount: number }[];
  deductions?: { concept: string; amount: number }[];
}

export interface LiquidationResult {
  items: LiquidationItem[];
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  meta: {
    daysCesantias: number;
    daysPrima: number;
    baseCesantias: number;
    basePrima: number;
    dailySalary: number;
  };
}

const round = (n: number) => Math.round(n);

/** Días entre dos fechas con la convención 30/360 (mes = 30 días). */
export function days360(start: Date, end: Date): number {
  let d1 = start.getUTCDate();
  const m1 = start.getUTCMonth() + 1;
  const y1 = start.getUTCFullYear();
  let d2 = end.getUTCDate();
  const m2 = end.getUTCMonth() + 1;
  const y2 = end.getUTCFullYear();
  if (d1 === 31) d1 = 30;
  if (d2 === 31 && d1 === 30) d2 = 30;
  return (y2 - y1) * 360 + (m2 - m1) * 30 + (d2 - d1);
}

/** Días laborados inclusivos (incluye el día de retiro) según 30/360. */
export function workedDays360(from: Date, to: Date): number {
  return Math.max(0, days360(from, to) + 1);
}

const earning = (code: string, concept: string, amount: number, detail?: string): LiquidationItem => ({
  code,
  concept,
  type: 'EARNING',
  amount,
  detail,
});

export function calculateLiquidation(input: LiquidationCalcInput): LiquidationResult {
  const dailySalary = input.baseSalary / 30;
  const baseCesantias = input.baseSalary + input.transportAllowance;
  const basePrima = input.baseSalary + input.transportAllowance;

  const daysCesantias = workedDays360(input.cesantiasFrom, input.terminationDate);
  const daysPrima = workedDays360(input.primaFrom, input.terminationDate);

  // Cesantías = base × días / 360. Intereses = cesantías × días × 12% / 360.
  const cesantias = round((baseCesantias * daysCesantias) / 360);
  const cesantiasInterest = round((cesantias * daysCesantias * 0.12) / 360);

  // Prima de servicios proporcional al periodo en curso.
  const prima = round((basePrima * daysPrima) / 360);

  // Vacaciones compensadas = salario diario × días pendientes (sin transporte).
  const vacations = round(dailySalary * input.vacationDays);

  // Salario pendiente del último mes (si aplica).
  const pendingSalary =
    input.pendingSalaryDays > 0 ? round(dailySalary * input.pendingSalaryDays) : 0;

  const items: LiquidationItem[] = [];
  if (pendingSalary > 0) {
    items.push(
      earning('PENDING_SALARY', 'Salario pendiente', pendingSalary, `${input.pendingSalaryDays} día(s)`),
    );
  }
  items.push(
    earning('CESANTIAS', 'Cesantías', cesantias, `${daysCesantias} día(s)`),
    earning('CESANTIAS_INTEREST', 'Intereses sobre cesantías (12%)', cesantiasInterest),
    earning('SERVICE_BONUS', 'Prima de servicios', prima, `${daysPrima} día(s)`),
    earning('VACATIONS', 'Vacaciones compensadas', vacations, `${input.vacationDays} día(s)`),
  );

  for (const e of input.extraEarnings ?? []) {
    if (e.amount) items.push(earning('OTHER', e.concept || 'Otro concepto', round(e.amount)));
  }
  for (const d of input.deductions ?? []) {
    if (d.amount) {
      items.push({ code: 'DEDUCTION', concept: d.concept || 'Deducción', type: 'DEDUCTION', amount: round(d.amount) });
    }
  }

  const totalEarnings = items.filter((i) => i.type === 'EARNING').reduce((a, i) => a + i.amount, 0);
  const totalDeductions = items.filter((i) => i.type === 'DEDUCTION').reduce((a, i) => a + i.amount, 0);

  return {
    items,
    totalEarnings,
    totalDeductions,
    netPay: totalEarnings - totalDeductions,
    meta: { daysCesantias, daysPrima, baseCesantias, basePrima, dailySalary: round(dailySalary) },
  };
}
