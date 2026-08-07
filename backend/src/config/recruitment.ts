/**
 * Reglas y catálogos del módulo de Contratación (Colombia).
 *
 * Refleja la legislación laboral vigente y la Reforma Laboral (Ley 2466 de
 * 2025) aplicable en 2026. El contrato a término indefinido es la regla
 * general; las demás modalidades proceden según la naturaleza de la labor.
 *
 * Son reglas de referencia para orientar y validar el proceso; no sustituyen
 * la asesoría jurídica de cada caso.
 */

export type ContractModality =
  | 'INDEFINITE'
  | 'FIXED_TERM'
  | 'WORK_OR_LABOR'
  | 'LEARNING'
  | 'OCCASIONAL';

export interface ModalityRule {
  code: ContractModality;
  label: string;
  /** Regla general recomendada por defecto (Ley 2466/2025). */
  isDefault?: boolean;
  /** Requiere fecha de finalización pactada. */
  requiresEndDate?: boolean;
  note: string;
}

export const CONTRACT_MODALITIES: ModalityRule[] = [
  {
    code: 'INDEFINITE',
    label: 'Término indefinido',
    isDefault: true,
    note: 'Regla general de contratación (Reforma Laboral, Ley 2466 de 2025).',
  },
  {
    code: 'FIXED_TERM',
    label: 'Término fijo',
    requiresEndDate: true,
    note: 'Debe constar por escrito; máximo 4 años. Las renovaciones y su uso están limitados por la Ley 2466 de 2025.',
  },
  {
    code: 'WORK_OR_LABOR',
    label: 'Obra o labor',
    note: 'Vinculado a una obra o labor determinada; debe precisarse la obra. Termina al concluir esta.',
  },
  {
    code: 'LEARNING',
    label: 'Contrato de aprendizaje',
    note: 'Con la Ley 2466 de 2025 es un contrato de naturaleza laboral con remuneración y afiliación a seguridad social.',
  },
  {
    code: 'OCCASIONAL',
    label: 'Ocasional, accidental o transitorio',
    requiresEndDate: true,
    note: 'Máximo 1 mes, para labores distintas de las actividades normales del empleador.',
  },
];

/** Período de prueba máximo general: 2 meses (60 días). */
export const MAX_PROBATION_DAYS = 60;

export function getModalityRule(code: string): ModalityRule | undefined {
  return CONTRACT_MODALITIES.find((m) => m.code === code);
}

/** Días calendario entre dos fechas (mínimo 0). */
function calendarDays(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return ms > 0 ? Math.round(ms / 86_400_000) : 0;
}

/**
 * Período de prueba sugerido según la modalidad (CST arts. 76-78, con los
 * ajustes de la Ley 2466 de 2025):
 * - General: hasta 2 meses.
 * - Término fijo inferior a 1 año: hasta 1/5 del término pactado, sin exceder
 *   2 meses.
 * - Aprendizaje: no aplica período de prueba clásico.
 */
export function suggestedProbationDays(
  modality: string,
  startDate: Date,
  endDate?: Date | null,
): number {
  if (modality === 'LEARNING') return 0;
  if (modality === 'FIXED_TERM' && endDate) {
    const total = calendarDays(startDate, endDate);
    if (total > 0 && total < 365) {
      return Math.min(MAX_PROBATION_DAYS, Math.round(total / 5));
    }
  }
  return MAX_PROBATION_DAYS;
}

/** Valida que un período de prueba no exceda el máximo legal para la modalidad. */
export function isProbationValid(
  modality: string,
  probationDays: number,
  startDate: Date,
  endDate?: Date | null,
): boolean {
  if (probationDays < 0) return false;
  const max =
    modality === 'FIXED_TERM' && endDate
      ? suggestedProbationDays(modality, startDate, endDate)
      : MAX_PROBATION_DAYS;
  return probationDays <= max;
}

// ------------------------------------------------------------------
// Documentos obligatorios del proceso de contratación (Colombia).
// ------------------------------------------------------------------

export interface RequiredDocType {
  code: string;
  label: string;
  required: boolean;
}

export const REQUIRED_DOCUMENT_TYPES: RequiredDocType[] = [
  { code: 'ID', label: 'Documento de identidad (cédula)', required: true },
  { code: 'RESUME', label: 'Hoja de vida', required: true },
  { code: 'ACADEMIC', label: 'Certificados de estudio / títulos', required: true },
  { code: 'LABOR_CERT', label: 'Certificados laborales', required: true },
  { code: 'REFERENCES', label: 'Referencias', required: false },
  { code: 'EPS_CERT', label: 'Certificado de afiliación EPS', required: true },
  { code: 'PENSION_CERT', label: 'Certificado de afiliación a pensión', required: true },
  { code: 'BANK_CERT', label: 'Certificación bancaria', required: true },
  { code: 'BACKGROUND', label: 'Antecedentes (Policía, Procuraduría, Contraloría)', required: true },
  { code: 'MEDICAL_EXAM', label: 'Examen médico ocupacional de ingreso', required: true },
  { code: 'PHOTO', label: 'Fotografía', required: false },
  { code: 'RUT', label: 'RUT', required: false },
];

// ------------------------------------------------------------------
// Plantilla de tareas de onboarding (afiliaciones, dotación, inducción...).
// ------------------------------------------------------------------

export type OnboardingCategory =
  | 'SIGNATURE'
  | 'AFFILIATION'
  | 'DOCUMENTS'
  | 'ENDOWMENT'
  | 'INDUCTION'
  | 'TRIAL'
  | 'OTHER';

export const ONBOARDING_CATEGORIES: { code: OnboardingCategory; label: string }[] = [
  { code: 'SIGNATURE', label: 'Firma' },
  { code: 'AFFILIATION', label: 'Afiliaciones seguridad social' },
  { code: 'DOCUMENTS', label: 'Documentación' },
  { code: 'ENDOWMENT', label: 'Dotación y equipos' },
  { code: 'INDUCTION', label: 'Inducción' },
  { code: 'TRIAL', label: 'Período de prueba' },
  { code: 'OTHER', label: 'Otros' },
];

export interface OnboardingTemplateItem {
  category: OnboardingCategory;
  title: string;
}

/** Tareas de onboarding creadas por defecto al iniciar la vinculación. */
export const ONBOARDING_TEMPLATE: OnboardingTemplateItem[] = [
  { category: 'SIGNATURE', title: 'Firma del contrato de trabajo' },
  { category: 'AFFILIATION', title: 'Afiliación a EPS (salud)' },
  { category: 'AFFILIATION', title: 'Afiliación a fondo de pensiones (AFP)' },
  { category: 'AFFILIATION', title: 'Afiliación a ARL (riesgos laborales)' },
  { category: 'AFFILIATION', title: 'Afiliación a caja de compensación familiar' },
  { category: 'AFFILIATION', title: 'Afiliación a fondo de cesantías' },
  { category: 'DOCUMENTS', title: 'Apertura de cuenta bancaria' },
  { category: 'DOCUMENTS', title: 'Recepción de documentos firmados' },
  { category: 'ENDOWMENT', title: 'Entrega de dotación (si aplica)' },
  { category: 'ENDOWMENT', title: 'Entrega de equipos y herramientas de trabajo' },
  { category: 'INDUCTION', title: 'Inducción general (SST, reglamento y políticas)' },
  { category: 'INDUCTION', title: 'Inducción específica al cargo' },
  { category: 'TRIAL', title: 'Programar seguimiento del período de prueba' },
];
