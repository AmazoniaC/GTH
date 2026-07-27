import dotenv from 'dotenv';

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Falta la variable de entorno obligatoria: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 4000),
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  databaseUrl: required('DATABASE_URL', 'postgresql://gth:gth@localhost:5432/gth_hr?schema=public'),
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret-change-me'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(','),
  // Correos con acceso de dueño de plataforma (ven todas las empresas).
  platformOwnerEmails: (process.env.PLATFORM_OWNER_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  // Contraseña inicial para las cuentas de dueño de plataforma que se
  // aprovisionan automáticamente al arrancar (se puede cambiar luego).
  platformOwnerPassword: process.env.PLATFORM_OWNER_PASSWORD ?? 'Progrexa2026*',
};

// NIT sentinela de la organización interna del dueño de plataforma. No es
// una empresa real: se oculta de los listados y conteos globales.
export const PLATFORM_ORG_NIT = 'PLATFORM-SYSTEM';

/** Indica si un correo tiene rol de dueño de plataforma (super-admin global). */
export function isPlatformOwner(email?: string | null): boolean {
  if (!email) return false;
  return env.platformOwnerEmails.includes(email.toLowerCase());
}
