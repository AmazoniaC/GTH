import type { Server } from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { ensurePlatformOwners } from './core/bootstrap/platform-owner';

/* eslint-disable no-console */

/** Verifica que la base de datos esté accesible antes de aceptar tráfico. */
async function assertDatabaseConnection(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión a la base de datos verificada.');
  } catch (error) {
    console.error(
      '❌ No se pudo conectar a la base de datos. Verifica que PostgreSQL esté en ' +
        'ejecución (npm run db:up) y que DATABASE_URL sea correcta en backend/.env.',
    );
    console.error(error instanceof Error ? error.message : error);
    // Sin base de datos la API no puede operar: terminamos con código de error.
    process.exit(1);
  }
}

async function bootstrap(): Promise<void> {
  const app = createApp();

  // Falla temprano y con un mensaje claro si la BD no está disponible.
  await assertDatabaseConnection();

  // Aprovisiona las cuentas de dueño de plataforma configuradas por correo.
  await ensurePlatformOwners().catch((error) => {
    console.error('No se pudieron aprovisionar los dueños de plataforma:', error);
  });

  const server = app.listen(env.port, () => {
    console.log(`🚀 GTH API escuchando en http://localhost:${env.port}${env.apiPrefix}`);
    console.log(`   Entorno: ${env.isProduction ? 'producción' : 'desarrollo'}`);
  });

  registerProcessHandlers(server);
}

/**
 * Manejadores globales del proceso: cierre ordenado ante señales y captura de
 * errores no controlados para evitar que el servidor muera en silencio.
 */
function registerProcessHandlers(server: Server): void {
  let shuttingDown = false;

  const shutdown = async (signal: string, code = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n${signal} recibido. Cerrando servidor...`);
    server.close();
    await prisma.$disconnect().catch(() => undefined);
    process.exit(code);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  // Errores asíncronos sin manejar: se registran y se cierra ordenadamente.
  process.on('unhandledRejection', (reason) => {
    console.error('⚠️  Promesa rechazada sin manejar:', reason);
    void shutdown('unhandledRejection', 1);
  });
  process.on('uncaughtException', (error) => {
    console.error('⚠️  Excepción no capturada:', error);
    void shutdown('uncaughtException', 1);
  });
}

bootstrap().catch((error) => {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
});
