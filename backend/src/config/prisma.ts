import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Instancia única de Prisma (patrón singleton) para evitar múltiples
// conexiones en desarrollo con hot-reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProduction ? ['error'] : ['warn', 'error'],
  });

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}
