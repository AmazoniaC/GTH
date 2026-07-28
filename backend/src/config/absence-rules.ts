/**
 * Reglas colombianas fijas para vacaciones y ausencias.
 *
 * El tipo de ausencia es un código del catálogo editable ABSENCE_TYPE, pero
 * su comportamiento en nómina y el conteo de días se derivan aquí (reglas
 * fijas conforme a la legislación laboral colombiana). Los tipos que RRHH
 * agregue y no estén en este mapa usan un comportamiento neutro por defecto
 * (día hábil, pagado por el empleador, sin efecto en nómina).
 */

export type DayCountMode = 'BUSINESS' | 'CALENDAR';

export type AbsencePayrollKind =
  | 'PAID_EMPLOYER' // Salario normal continúa (vacaciones, luto, permiso remunerado)
  | 'UNPAID' // No remunerada: se descuenta el salario de esos días
  | 'INCAPACITY_GENERAL' // Enf. general (EPS): 66.67%, días 1-2 empleador, 3+ EPS, piso SMMLV
  | 'INCAPACITY_LABOR' // Accidente/enf. laboral (ARL): 100% desde el día 1
  | 'LICENSE_EPS'; // Maternidad/paternidad: 100% a cargo de la EPS

export type AbsenceGroup = 'VACATION' | 'INCAPACITY' | 'LICENSE' | 'PERMIT';

export interface AbsenceRule {
  code: string;
  label: string;
  group: AbsenceGroup;
  dayCount: DayCountMode;
  consumesVacation: boolean;
  payroll: AbsencePayrollKind;
  requiresEntity?: boolean; // Solicitar EPS/ARL y soporte
}

export const ABSENCE_RULES: Record<string, AbsenceRule> = {
  VACATION: {
    code: 'VACATION',
    label: 'Vacaciones',
    group: 'VACATION',
    dayCount: 'BUSINESS',
    consumesVacation: true,
    payroll: 'PAID_EMPLOYER',
  },
  SICK_GENERAL: {
    code: 'SICK_GENERAL',
    label: 'Incapacidad por enfermedad general (EPS)',
    group: 'INCAPACITY',
    dayCount: 'CALENDAR',
    consumesVacation: false,
    payroll: 'INCAPACITY_GENERAL',
    requiresEntity: true,
  },
  SICK_LABOR: {
    code: 'SICK_LABOR',
    label: 'Incapacidad de origen laboral (ARL)',
    group: 'INCAPACITY',
    dayCount: 'CALENDAR',
    consumesVacation: false,
    payroll: 'INCAPACITY_LABOR',
    requiresEntity: true,
  },
  LICENSE_MATERNITY: {
    code: 'LICENSE_MATERNITY',
    label: 'Licencia de maternidad',
    group: 'LICENSE',
    dayCount: 'CALENDAR',
    consumesVacation: false,
    payroll: 'LICENSE_EPS',
    requiresEntity: true,
  },
  LICENSE_PATERNITY: {
    code: 'LICENSE_PATERNITY',
    label: 'Licencia de paternidad',
    group: 'LICENSE',
    dayCount: 'CALENDAR',
    consumesVacation: false,
    payroll: 'LICENSE_EPS',
    requiresEntity: true,
  },
  LICENSE_BEREAVEMENT: {
    code: 'LICENSE_BEREAVEMENT',
    label: 'Licencia de luto',
    group: 'LICENSE',
    dayCount: 'BUSINESS',
    consumesVacation: false,
    payroll: 'PAID_EMPLOYER',
  },
  LICENSE_UNPAID: {
    code: 'LICENSE_UNPAID',
    label: 'Licencia no remunerada',
    group: 'LICENSE',
    dayCount: 'CALENDAR',
    consumesVacation: false,
    payroll: 'UNPAID',
  },
  PERMIT_PAID: {
    code: 'PERMIT_PAID',
    label: 'Permiso remunerado',
    group: 'PERMIT',
    dayCount: 'BUSINESS',
    consumesVacation: false,
    payroll: 'PAID_EMPLOYER',
  },
  PERMIT_UNPAID: {
    code: 'PERMIT_UNPAID',
    label: 'Permiso no remunerado',
    group: 'PERMIT',
    dayCount: 'BUSINESS',
    consumesVacation: false,
    payroll: 'UNPAID',
  },
};

/** Comportamiento neutro para tipos personalizados no reconocidos. */
const DEFAULT_RULE: Omit<AbsenceRule, 'code' | 'label'> = {
  group: 'PERMIT',
  dayCount: 'BUSINESS',
  consumesVacation: false,
  payroll: 'PAID_EMPLOYER',
};

export function getAbsenceRule(code: string, label?: string): AbsenceRule {
  return ABSENCE_RULES[code] ?? { code, label: label ?? code, ...DEFAULT_RULE };
}

/** Una ausencia afecta la nómina si no es "salario normal del empleador". */
export function absenceAffectsPayroll(code: string): boolean {
  return getAbsenceRule(code).payroll !== 'PAID_EMPLOYER';
}

/** Opciones por defecto del catálogo ABSENCE_TYPE (código ligado a la lógica). */
export const ABSENCE_TYPE_DEFAULTS = Object.values(ABSENCE_RULES).map((r) => ({
  code: r.code,
  label: r.label,
  isSystem: true,
}));
