/**
 * Constantes y códigos de conceptos de nómina (Colombia).
 *
 * Los porcentajes y valores monetarios (SMMLV, auxilio de transporte, etc.)
 * NO se codifican aquí: viven en la tabla `PayrollConfig` para poder
 * ajustarse cada año sin desplegar código. Aquí solo definimos códigos
 * estables de conceptos y las tarifas de ARL por clase de riesgo.
 */

export const CONCEPT = {
  // Devengados
  SALARY: 'SALARY',
  TRANSPORT: 'TRANSPORT',
  // Deducciones del empleado
  HEALTH_EMPLOYEE: 'HEALTH_EMP',
  PENSION_EMPLOYEE: 'PENSION_EMP',
  SOLIDARITY_FUND: 'FSP',
  // Aportes y provisiones del empleador
  HEALTH_EMPLOYER: 'HEALTH_ER',
  PENSION_EMPLOYER: 'PENSION_ER',
  ARL: 'ARL',
  SENA: 'SENA',
  ICBF: 'ICBF',
  COMPENSATION_FUND: 'CCF',
  SEVERANCE: 'CESANTIAS',
  SEVERANCE_INTEREST: 'INT_CESANTIAS',
  SERVICE_BONUS: 'PRIMA',
  VACATION: 'VACACIONES',
  WITHHOLDING: 'RETEFUENTE',
} as const;

export const CONCEPT_LABEL: Record<string, string> = {
  [CONCEPT.SALARY]: 'Salario básico',
  [CONCEPT.TRANSPORT]: 'Auxilio de transporte',
  [CONCEPT.HEALTH_EMPLOYEE]: 'Salud (empleado)',
  [CONCEPT.PENSION_EMPLOYEE]: 'Pensión (empleado)',
  [CONCEPT.SOLIDARITY_FUND]: 'Fondo de solidaridad pensional',
  [CONCEPT.HEALTH_EMPLOYER]: 'Salud (empleador)',
  [CONCEPT.PENSION_EMPLOYER]: 'Pensión (empleador)',
  [CONCEPT.ARL]: 'ARL (riesgos laborales)',
  [CONCEPT.SENA]: 'SENA',
  [CONCEPT.ICBF]: 'ICBF',
  [CONCEPT.COMPENSATION_FUND]: 'Caja de compensación',
  [CONCEPT.SEVERANCE]: 'Cesantías',
  [CONCEPT.SEVERANCE_INTEREST]: 'Intereses de cesantías',
  [CONCEPT.SERVICE_BONUS]: 'Prima de servicios',
  [CONCEPT.VACATION]: 'Vacaciones',
  [CONCEPT.WITHHOLDING]: 'Retención en la fuente',
};

/**
 * Retención en la fuente por rentas de trabajo (Colombia).
 *
 * Tabla del Art. 383 del Estatuto Tributario, expresada en UVT (rangos
 * mensuales): tarifa marginal + retención acumulada en UVT del rango anterior.
 */
export const WITHHOLDING_TABLE: { from: number; to: number; rate: number; add: number }[] = [
  { from: 0, to: 95, rate: 0, add: 0 },
  { from: 95, to: 150, rate: 0.19, add: 0 },
  { from: 150, to: 360, rate: 0.28, add: 10 },
  { from: 360, to: 640, rate: 0.33, add: 69 },
  { from: 640, to: 945, rate: 0.35, add: 162 },
  { from: 945, to: 2300, rate: 0.37, add: 268 },
  { from: 2300, to: Infinity, rate: 0.39, add: 770 },
];

export const WITHHOLDING = {
  EXEMPT_RATE: 0.25, // Renta exenta laboral (Art. 206 num. 10)
  EXEMPT_CAP_UVT: 240, // Tope mensual de la renta exenta del 25%
  BENEFITS_CAP_RATE: 0.4, // Tope de deducciones + rentas exentas (Art. 336)
  BENEFITS_CAP_UVT: 420, // Tope mensual absoluto (5040 UVT/año)
} as const;

/**
 * Tarifas de ARL por clase de riesgo (Decreto 1772 de 1994).
 * Expresadas como fracción del IBC.
 */
export const ARL_RATES: Record<number, number> = {
  1: 0.00522, // Riesgo mínimo
  2: 0.01044, // Riesgo bajo
  3: 0.02436, // Riesgo medio
  4: 0.0435, // Riesgo alto
  5: 0.0696, // Riesgo máximo
};

/**
 * Umbrales legales (en número de SMMLV).
 */
export const THRESHOLDS = {
  // Auxilio de transporte: hasta 2 SMMLV.
  TRANSPORT_MAX_WAGES: 2,
  // Fondo de Solidaridad Pensional: desde 4 SMMLV.
  SOLIDARITY_FUND_MIN_WAGES: 4,
  // Exoneración de aportes (Ley 1607/2012, art. 114-1): salarios < 10 SMMLV.
  EXONERATION_MAX_WAGES: 10,
  // Salario integral: el IBC corresponde al 70% del salario.
  INTEGRAL_IBC_FACTOR: 0.7,
} as const;
