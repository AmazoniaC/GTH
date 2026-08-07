/**
 * Valores legales de referencia (Colombia) usados como respaldo cuando una
 * empresa aún no ha configurado su parametrización de nómina del año.
 *
 * **Única fuente de verdad** de estos valores por defecto: antes el salario
 * mínimo estaba codificado en varios sitios (nómina, reportes) y podía
 * divergir. Los valores reales que usa cada empresa viven en `PayrollConfig`
 * (editables por año sin desplegar código); esto es solo el punto de partida.
 */

/** Salario mínimo mensual legal vigente (SMMLV) de referencia — 2026. */
export const DEFAULT_MINIMUM_WAGE = 1_623_500;

/** Auxilio de transporte de referencia — 2026. */
export const DEFAULT_TRANSPORT_ALLOWANCE = 200_000;

/** Unidad de Valor Tributario (UVT) de referencia — 2026. */
export const DEFAULT_UVT = 49_799;

/** Parametrización de nómina por defecto (porcentajes como fracción). */
export const DEFAULT_PAYROLL_CONFIG = {
  minimumWage: DEFAULT_MINIMUM_WAGE,
  transportAllowance: DEFAULT_TRANSPORT_ALLOWANCE,
  uvt: DEFAULT_UVT,
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
} as const;
