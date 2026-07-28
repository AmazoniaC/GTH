import { getAbsenceRule } from '../../config/absence-rules';
import { countCalendarDays, countDaysInPeriod } from '../../core/utils/colombia-dates';
import type { AdditionalEarning } from './payroll.calculator';

export interface AbsenceForPayroll {
  type: string;
  startDate: Date;
  endDate: Date;
}

export interface AbsenceNovelties {
  paidDays: number; // días a pagar como salario normal (base 30)
  additionalEarnings: AdditionalEarning[];
  unpaidDays: number;
  benefitDays: number;
}

const round = (n: number) => Math.round(n);

/**
 * Traduce las ausencias de un empleado que caen dentro del período de
 * nómina en novedades: días de salario a descontar y devengados por
 * incapacidades/licencias (con las reglas colombianas fijas).
 */
export function computeAbsenceNovelties(
  absences: AbsenceForPayroll[],
  baseSalary: number,
  minimumWage: number,
  periodStart: Date,
  periodEnd: Date,
  baseWorkedDays = 30,
): AbsenceNovelties {
  // Base diaria para prestaciones/incapacidades, con piso del salario mínimo.
  const dailyBase = Math.max(baseSalary, minimumWage) / 30;

  let unpaidDays = 0;
  let benefitDays = 0;
  const additionalEarnings: AdditionalEarning[] = [];

  for (const a of absences) {
    const rule = getAbsenceRule(a.type);
    const daysInPeriod = countDaysInPeriod(
      a.startDate,
      a.endDate,
      periodStart,
      periodEnd,
      rule.dayCount,
    );
    if (daysInPeriod <= 0) continue;

    switch (rule.payroll) {
      case 'PAID_EMPLOYER':
        // Salario normal continúa: no genera novedad en nómina.
        break;

      case 'UNPAID':
        unpaidDays += daysInPeriod;
        break;

      case 'INCAPACITY_GENERAL': {
        benefitDays += daysInPeriod;
        // Días 1-2 de la incapacidad los paga el empleador; del 3 en adelante, la EPS.
        // Se calcula qué parte del tramo del período cae en esos primeros 2 días.
        const sliceStart = a.startDate > periodStart ? a.startDate : periodStart;
        const sliceStartIndex = countCalendarDays(a.startDate, sliceStart) - 1; // 0-based
        const employerDays = Math.max(0, Math.min(daysInPeriod, 2 - sliceStartIndex));
        const epsDays = daysInPeriod - employerDays;
        const rate = 2 / 3; // 66.67%
        if (employerDays > 0) {
          additionalEarnings.push({
            code: 'INCAP_EG_EMP',
            concept: 'Incapacidad enfermedad general (empleador, días 1-2)',
            amount: round(dailyBase * rate * employerDays),
            funder: 'EMPLOYER',
          });
        }
        if (epsDays > 0) {
          additionalEarnings.push({
            code: 'INCAP_EG_EPS',
            concept: 'Incapacidad enfermedad general (EPS)',
            amount: round(dailyBase * rate * epsDays),
            funder: 'EPS',
          });
        }
        break;
      }

      case 'INCAPACITY_LABOR':
        benefitDays += daysInPeriod;
        additionalEarnings.push({
          code: 'INCAP_LABOR',
          concept: 'Incapacidad de origen laboral (ARL, 100%)',
          amount: round(dailyBase * daysInPeriod),
          funder: 'ARL',
        });
        break;

      case 'LICENSE_EPS':
        benefitDays += daysInPeriod;
        additionalEarnings.push({
          code: 'LICENSE_EPS',
          concept: 'Licencia remunerada (EPS, 100%)',
          amount: round(dailyBase * daysInPeriod),
          funder: 'EPS',
        });
        break;
    }
  }

  const paidDays = Math.max(0, Math.min(baseWorkedDays, baseWorkedDays - unpaidDays - benefitDays));
  return { paidDays, additionalEarnings, unpaidDays, benefitDays };
}
