import { ARL_RATES, CONCEPT, CONCEPT_LABEL, THRESHOLDS } from './payroll.constants';

export interface PayrollConfigValues {
  minimumWage: number;
  transportAllowance: number;
  healthEmployeeRate: number;
  healthEmployerRate: number;
  pensionEmployeeRate: number;
  pensionEmployerRate: number;
  senaRate: number;
  icbfRate: number;
  compensationFundRate: number;
  severanceRate: number;
  severanceInterestRate: number;
  serviceBonusRate: number;
  vacationRate: number;
}

export interface PayrollCalcInput {
  baseSalary: number; // salario mensual pactado
  workedDays: number; // días trabajados en el periodo (base 30)
  hasTransportAllowance: boolean;
  isIntegralSalary: boolean;
  arlRiskClass: number; // 1..5
  config: PayrollConfigValues;
}

export type ItemType = 'EARNING' | 'DEDUCTION' | 'EMPLOYER_COST';

export interface CalcItem {
  type: ItemType;
  code: string;
  concept: string;
  amount: number;
}

export interface PayrollCalcResult {
  items: CalcItem[];
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  employerCost: number;
  ibc: number;
}

const round = (n: number): number => Math.round(n);

/**
 * Motor de cálculo de nómina colombiana.
 *
 * Función pura y sin dependencias de infraestructura: recibe los datos
 * del contrato y la parametrización legal y devuelve el detalle de
 * devengados, deducciones y costos del empleador. Esto permite probarla
 * de forma aislada y reutilizarla (liquidaciones, simulaciones, etc.).
 */
export function calculatePayroll(input: PayrollCalcInput): PayrollCalcResult {
  const { config, workedDays } = input;
  const dayFactor = Math.min(Math.max(workedDays, 0), 30) / 30;

  // --- Devengados ---
  const salary = round(input.baseSalary * dayFactor);

  const eligibleForTransport =
    input.hasTransportAllowance &&
    !input.isIntegralSalary &&
    input.baseSalary <= config.minimumWage * THRESHOLDS.TRANSPORT_MAX_WAGES;
  const transport = eligibleForTransport ? round(config.transportAllowance * dayFactor) : 0;

  // --- Base de cotización (IBC) ---
  // El auxilio de transporte NO hace parte del IBC.
  // Para salario integral el IBC es el 70% del total.
  const ibc = input.isIntegralSalary
    ? round(salary * THRESHOLDS.INTEGRAL_IBC_FACTOR)
    : salary;

  const wages = input.baseSalary / config.minimumWage;
  const isExonerated = wages < THRESHOLDS.EXONERATION_MAX_WAGES; // Ley 1607
  const appliesSolidarityFund = wages >= THRESHOLDS.SOLIDARITY_FUND_MIN_WAGES;

  // --- Deducciones del empleado ---
  const healthEmployee = round(ibc * config.healthEmployeeRate);
  const pensionEmployee = round(ibc * config.pensionEmployeeRate);
  const solidarityFund = appliesSolidarityFund ? round(ibc * 0.01) : 0;

  // --- Aportes / provisiones del empleador ---
  const arlRate = ARL_RATES[input.arlRiskClass] ?? ARL_RATES[1];
  const arl = round(ibc * arlRate);
  const pensionEmployer = round(ibc * config.pensionEmployerRate);
  const compensationFund = round(ibc * config.compensationFundRate);
  const healthEmployer = isExonerated ? 0 : round(ibc * config.healthEmployerRate);
  const sena = isExonerated ? 0 : round(ibc * config.senaRate);
  const icbf = isExonerated ? 0 : round(ibc * config.icbfRate);

  // Provisiones de prestaciones sociales (no aplican a salario integral).
  const provisionBase = salary + transport; // cesantías, prima
  const severance = input.isIntegralSalary ? 0 : round(provisionBase * config.severanceRate);
  const severanceInterest = input.isIntegralSalary
    ? 0
    : round(severance * 0.12 * dayFactor); // 12% anual sobre cesantías, proporcional
  const serviceBonus = input.isIntegralSalary
    ? 0
    : round(provisionBase * config.serviceBonusRate);
  const vacation = input.isIntegralSalary ? 0 : round(salary * config.vacationRate);

  const items: CalcItem[] = [
    earning(CONCEPT.SALARY, salary),
    ...(transport > 0 ? [earning(CONCEPT.TRANSPORT, transport)] : []),
    deduction(CONCEPT.HEALTH_EMPLOYEE, healthEmployee),
    deduction(CONCEPT.PENSION_EMPLOYEE, pensionEmployee),
    ...(solidarityFund > 0 ? [deduction(CONCEPT.SOLIDARITY_FUND, solidarityFund)] : []),
    ...(healthEmployer > 0 ? [employerCost(CONCEPT.HEALTH_EMPLOYER, healthEmployer)] : []),
    employerCost(CONCEPT.PENSION_EMPLOYER, pensionEmployer),
    employerCost(CONCEPT.ARL, arl),
    ...(sena > 0 ? [employerCost(CONCEPT.SENA, sena)] : []),
    ...(icbf > 0 ? [employerCost(CONCEPT.ICBF, icbf)] : []),
    employerCost(CONCEPT.COMPENSATION_FUND, compensationFund),
    ...(severance > 0 ? [employerCost(CONCEPT.SEVERANCE, severance)] : []),
    ...(severanceInterest > 0
      ? [employerCost(CONCEPT.SEVERANCE_INTEREST, severanceInterest)]
      : []),
    ...(serviceBonus > 0 ? [employerCost(CONCEPT.SERVICE_BONUS, serviceBonus)] : []),
    ...(vacation > 0 ? [employerCost(CONCEPT.VACATION, vacation)] : []),
  ];

  const totalEarnings = sum(items, 'EARNING');
  const totalDeductions = sum(items, 'DEDUCTION');
  const totalEmployerContributions = sum(items, 'EMPLOYER_COST');

  return {
    items,
    ibc,
    totalEarnings,
    totalDeductions,
    netPay: totalEarnings - totalDeductions,
    // Costo total para la empresa = neto pagado al empleado + aportes/provisiones patronales.
    employerCost: totalEarnings + totalEmployerContributions,
  };
}

function earning(code: string, amount: number): CalcItem {
  return { type: 'EARNING', code, concept: CONCEPT_LABEL[code] ?? code, amount };
}
function deduction(code: string, amount: number): CalcItem {
  return { type: 'DEDUCTION', code, concept: CONCEPT_LABEL[code] ?? code, amount };
}
function employerCost(code: string, amount: number): CalcItem {
  return { type: 'EMPLOYER_COST', code, concept: CONCEPT_LABEL[code] ?? code, amount };
}
function sum(items: CalcItem[], type: ItemType): number {
  return items.filter((i) => i.type === type).reduce((acc, i) => acc + i.amount, 0);
}
