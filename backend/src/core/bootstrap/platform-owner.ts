import { UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { env, PLATFORM_ORG_NIT } from '../../config/env';
import { hashPassword } from '../utils/password';

/**
 * Aprovisiona automáticamente las cuentas de "dueño de plataforma".
 *
 * El dueño de plataforma se define por correo en la variable de entorno
 * PLATFORM_OWNER_EMAILS. Como el inicio de sesión exige una cuenta real,
 * al arrancar el servidor nos aseguramos de que exista un usuario por cada
 * correo listado. Estas cuentas viven en una organización interna oculta
 * (no aparece en el listado ni en los conteos globales).
 *
 * Idempotente: si la cuenta ya existe, no se toca su contraseña.
 */
export async function ensurePlatformOwners(): Promise<void> {
  const emails = env.platformOwnerEmails;
  if (emails.length === 0) return;

  // Organización interna del sistema (una sola, compartida por los dueños).
  const org = await prisma.organization.upsert({
    where: { nit: PLATFORM_ORG_NIT },
    update: {},
    create: {
      name: 'Progrexa (Plataforma)',
      nit: PLATFORM_ORG_NIT,
      legalName: 'Administración de la plataforma',
    },
  });

  for (const email of emails) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Garantiza que la cuenta exista y esté activa como SUPER_ADMIN.
      if (!existing.isActive || existing.role !== UserRole.SUPER_ADMIN) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { isActive: true, role: UserRole.SUPER_ADMIN },
        });
      }
      continue;
    }

    const password = await hashPassword(env.platformOwnerPassword);
    await prisma.user.create({
      data: {
        email,
        password,
        firstName: 'Dueño',
        lastName: 'de Plataforma',
        role: UserRole.SUPER_ADMIN,
        organizationId: org.id,
      },
    });

    // eslint-disable-next-line no-console
    console.log(
      `🔑 Cuenta de dueño de plataforma creada: ${email} (contraseña inicial: PLATFORM_OWNER_PASSWORD)`,
    );
  }
}
