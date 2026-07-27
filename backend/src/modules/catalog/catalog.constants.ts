/** Categorías de opciones configurables. */
export const CATALOG_CATEGORY = {
  // Basadas en código (el valor guardado es el código; hay lógica asociada)
  DOCUMENT_TYPE: 'DOCUMENT_TYPE',
  CONTRACT_TYPE: 'CONTRACT_TYPE',
  EMPLOYEE_STATUS: 'EMPLOYEE_STATUS',
  FILE_TYPE: 'FILE_TYPE',
  // Basadas en etiqueta (listas de valores libres editables)
  BLOOD_TYPE: 'BLOOD_TYPE',
  NATIONALITY: 'NATIONALITY',
  COUNTRY: 'COUNTRY',
  EPS: 'EPS',
  PENSION_FUND: 'PENSION_FUND',
  SEVERANCE_FUND: 'SEVERANCE_FUND',
  COMPENSATION_FUND: 'COMPENSATION_FUND',
  ARL: 'ARL',
  BANK: 'BANK',
  ACCOUNT_TYPE: 'ACCOUNT_TYPE',
  RELATIONSHIP: 'RELATIONSHIP',
  COST_CENTER: 'COST_CENTER',
  WORK_LOCATION: 'WORK_LOCATION',
} as const;

export type CatalogCategory = (typeof CATALOG_CATEGORY)[keyof typeof CATALOG_CATEGORY];

export const CATALOG_CATEGORIES: CatalogCategory[] = Object.values(CATALOG_CATEGORY);

interface DefaultOption {
  code: string;
  label: string;
  isSystem?: boolean;
}

/** Construye opciones donde el código es igual a la etiqueta (listas libres). */
const list = (labels: string[]): DefaultOption[] => labels.map((l) => ({ code: l, label: l }));

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
  FILE_TYPE: [
    { code: 'CONTRACT', label: 'Contrato' },
    { code: 'ID', label: 'Documento de identidad' },
    { code: 'RESUME', label: 'Hoja de vida' },
    { code: 'CERTIFICATE', label: 'Certificado' },
    { code: 'MEDICAL_EXAM', label: 'Examen médico' },
    { code: 'OTHER', label: 'Otro' },
  ],

  // ---- Listas de valores libres (código = etiqueta) ----
  BLOOD_TYPE: list(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']),
  NATIONALITY: list([
    'Colombiana', 'Venezolana', 'Ecuatoriana', 'Peruana', 'Brasileña',
    'Argentina', 'Chilena', 'Mexicana', 'Española', 'Estadounidense', 'Otra',
  ]),
  COUNTRY: list([
    'Colombia', 'Venezuela', 'Ecuador', 'Perú', 'Panamá', 'Brasil', 'Chile',
    'Argentina', 'México', 'España', 'Estados Unidos', 'Otro',
  ]),
  EPS: list([
    'Nueva EPS', 'Sura EPS', 'Sanitas', 'Salud Total', 'Compensar EPS', 'Famisanar',
    'Coosalud', 'Mutual Ser', 'SOS', 'Aliansalud', 'Cajacopi', 'Asmet Salud',
    'Emssanar', 'Savia Salud', 'Capital Salud', 'Otra',
  ]),
  PENSION_FUND: list(['Porvenir', 'Protección', 'Colfondos', 'Skandia', 'Colpensiones', 'Otra']),
  SEVERANCE_FUND: list([
    'Porvenir', 'Protección', 'Colfondos', 'Skandia', 'Fondo Nacional del Ahorro', 'Otra',
  ]),
  COMPENSATION_FUND: list([
    'Compensar', 'Colsubsidio', 'Cafam', 'Comfama', 'Comfenalco Antioquia',
    'Comfenalco Valle', 'Comfandi', 'Cafba', 'Otra',
  ]),
  ARL: list([
    'Sura ARL', 'Positiva', 'Colmena Seguros', 'Seguros Bolívar', 'AXA Colpatria',
    'La Equidad', 'Liberty Seguros', 'Mapfre', 'Otra',
  ]),
  BANK: list([
    'Bancolombia', 'Davivienda', 'BBVA Colombia', 'Banco de Bogotá', 'Banco Caja Social',
    'Banco de Occidente', 'Banco Popular', 'Banco AV Villas', 'Banco Agrario de Colombia',
    'Scotiabank Colpatria', 'Itaú', 'Banco Falabella', 'Banco Pichincha', 'Banco GNB Sudameris',
    'Bancoomeva', 'Banco Serfinanza', 'Banco W', 'Bancamía', 'Banco Mundo Mujer',
    'Banco Finandina', 'Banco Cooperativo Coopcentral', 'Confiar', 'Citibank Colombia',
    'Nequi', 'Daviplata', 'Lulo Bank', 'Nu (Nubank)', 'RappiPay', 'Movii', 'Coink', 'Otro',
  ]),
  ACCOUNT_TYPE: list(['Ahorros', 'Corriente', 'Depósito electrónico']),
  RELATIONSHIP: list([
    'Cónyuge', 'Compañero(a) permanente', 'Hijo(a)', 'Padre', 'Madre', 'Hermano(a)', 'Otro',
  ]),
  COST_CENTER: list(['Administración', 'Operaciones', 'Ventas', 'Producción']),
  WORK_LOCATION: list(['Sede principal']),
};
