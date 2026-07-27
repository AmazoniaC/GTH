import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { ensurePlatformOwners } from './core/bootstrap/platform-owner';

async function bootstrap() {
  const app = createApp();

  // Aprovisiona las cuentas de dueño de plataforma configuradas por correo.
  await ensurePlatformOwners().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('No se pudieron aprovisionar los dueños de plataforma:', error);
  });

  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 GTH API escuchando en http://localhost:${env.port}${env.apiPrefix}`);
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} recibido. Cerrando servidor...`);
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
});
