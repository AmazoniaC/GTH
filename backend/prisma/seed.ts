import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed intencionalmente vacío.
 *
 * El modelo de la plataforma no usa usuarios ni empresas de demostración:
 *  - Las empresas se crean desde el registro (pantalla de login → "Regístrate").
 *  - El dueño de la plataforma (cuenta principal) se aprovisiona solo al
 *    arrancar el backend, a partir de PLATFORM_OWNER_EMAILS en el .env.
 *
 * Si en el futuro se necesitan datos de ejemplo, agrégalos aquí.
 */
async function main() {
  console.log('🌱 Seed sin datos de demostración.');
  console.log('   • Registra tu empresa desde la pantalla de inicio de sesión.');
  console.log('   • El dueño de plataforma se crea con PLATFORM_OWNER_EMAILS.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
