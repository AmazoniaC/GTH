/** Categorías de opciones configurables. */
export const CATALOG_CATEGORY = {
  DOCUMENT_TYPE: 'DOCUMENT_TYPE',
  CONTRACT_TYPE: 'CONTRACT_TYPE',
  EMPLOYEE_STATUS: 'EMPLOYEE_STATUS',
  FILE_TYPE: 'FILE_TYPE',
} as const;

export type CatalogCategory = (typeof CATALOG_CATEGORY)[keyof typeof CATALOG_CATEGORY];

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  CATALOG_CATEGORY.DOCUMENT_TYPE,
  CATALOG_CATEGORY.CONTRACT_TYPE,
  CATALOG_CATEGORY.EMPLOYEE_STATUS,
  CATALOG_CATEGORY.FILE_TYPE,
];

interface DefaultOption {
  code: string;
  label: string;
  isSystem?: boolean;
}

/**
 * Opciones por defecto que se provisionan automáticamente para cada
 * organización. Las marcadas como `isSystem` no se pueden eliminar porque
 * su código está ligado a la lógica de la aplicación (ej: estados).
 */
export const DEFAULT_OPTIONS: Record<CatalogCategory, DefaultOption[]> = {
  DOCUMENT_TYPE: [
    { code: 'CC', label: 'Cédula de ciudadanía' },
    { code: 'CE', label: 'Cédula de extranjería' },
    { code: 'TI', label: 'Tarjeta de identidad' },
    { code: 'PA', label: 'Pasaporte' },
    { code: 'PEP', label: 'Permiso especial de permanencia' },
  ],
  CONTRACT_TYPE: [
    { code: 'INDEFINITE', label: 'Término indefinido' },
    { code: 'FIXED_TERM', label: 'Término fijo' },
    { code: 'WORK_LABOR', label: 'Obra o labor' },
    { code: 'APPRENTICESHIP', label: 'Aprendizaje (SENA)' },
    { code: 'TEMPORARY', label: 'Temporal / ocasional' },
  ],
  // Los estados afectan la lógica de nómina: solo se pueden renombrar.
  EMPLOYEE_STATUS: [
    { code: 'ACTIVE', label: 'Activo', isSystem: true },
    { code: 'ON_LEAVE', label: 'En licencia', isSystem: true },
    { code: 'SUSPENDED', label: 'Suspendido', isSystem: true },
    { code: 'TERMINATED', label: 'Retirado', isSystem: true },
  ],
  // Tipos de documento adjunto de los empleados.
  FILE_TYPE: [
    { code: 'CONTRACT', label: 'Contrato' },
    { code: 'ID', label: 'Documento de identidad' },
    { code: 'RESUME', label: 'Hoja de vida' },
    { code: 'CERTIFICATE', label: 'Certificado' },
    { code: 'MEDICAL_EXAM', label: 'Examen médico' },
    { code: 'OTHER', label: 'Otro' },
  ],
};
