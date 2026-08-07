/**
 * Catálogo de módulos de la plataforma.
 *
 * El dueño de la plataforma (super admin) decide qué módulos tiene activa
 * cada empresa. Añadir un módulo nuevo en el futuro es tan simple como
 * agregar una entrada aquí y proteger sus rutas con `requireModule`.
 */
export const APP_MODULES = [
  { key: 'EMPLOYEES', label: 'Gestión de Empleados' },
  { key: 'PAYROLL', label: 'Nómina' },
  { key: 'RECRUITMENT', label: 'Contratación y Selección' },
] as const;

export type ModuleKey = (typeof APP_MODULES)[number]['key'];

/** Módulos que trae una empresa nueva por defecto. */
export const DEFAULT_MODULES: ModuleKey[] = ['EMPLOYEES', 'PAYROLL'];

export function isValidModule(key: string): key is ModuleKey {
  return APP_MODULES.some((m) => m.key === key);
}

/** Filtra una lista arbitraria dejando solo claves de módulo válidas. */
export function sanitizeModules(input: unknown): ModuleKey[] {
  if (!Array.isArray(input)) return [];
  return input.filter((k): k is ModuleKey => typeof k === 'string' && isValidModule(k));
}
