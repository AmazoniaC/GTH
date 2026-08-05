/**
 * Catálogo de novedades de nómina y factores de horas extra (Colombia).
 * El valor hora ordinaria = salario mensual / 240.
 */

export const OVERTIME_TYPES = [
  { code: 'OT_HED', label: 'Hora extra diurna', factor: 1.25 },
  { code: 'OT_HEN', label: 'Hora extra nocturna', factor: 1.75 },
  { code: 'OT_RN', label: 'Recargo nocturno', factor: 0.35 },
  { code: 'OT_RDD', label: 'Recargo dominical/festivo', factor: 0.75 },
  { code: 'OT_HEDD', label: 'Hora extra diurna dominical/festivo', factor: 2.0 },
  { code: 'OT_HEND', label: 'Hora extra nocturna dominical/festivo', factor: 2.5 },
] as const;

export const EARNING_TYPES = [
  { code: 'BONUS', label: 'Bonificación' },
  { code: 'COMMISSION', label: 'Comisión' },
  { code: 'ALLOWANCE', label: 'Auxilio (no salarial)' },
  { code: 'OTHER_EARNING', label: 'Otro devengado' },
] as const;

export const DEDUCTION_TYPES = [
  { code: 'LOAN', label: 'Préstamo / libranza' },
  { code: 'OTHER_DEDUCTION', label: 'Otra deducción' },
] as const;

export function overtimeFactor(code: string): number | null {
  return OVERTIME_TYPES.find((o) => o.code === code)?.factor ?? null;
}

/** Valor de una novedad de horas extra: horas × (salario/240) × factor. */
export function overtimeAmount(baseSalary: number, hours: number, factor: number): number {
  return Math.round((baseSalary / 240) * hours * factor);
}
