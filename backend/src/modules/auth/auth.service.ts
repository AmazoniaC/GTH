import { UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { hashPassword, comparePassword } from '../../core/utils/password';
import {
  JwtPayload,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../core/utils/jwt';
import { AppError, ConflictError, UnauthorizedError } from '../../core/errors/AppError';
import type { LoginInput, RegisterInput } from './auth.schema';

function buildTokens(payload: JwtPayload) {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

function toPublicUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  avatarUrl: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    organizationId: user.organizationId,
    avatarUrl: user.avatarUrl,
  };
}

export class AuthService {
  /** Registra una nueva empresa junto con su usuario administrador. */
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError('El correo electrónico ya está registrado.');

    const nitTaken = await prisma.organization.findUnique({ where: { nit: input.nit } });
    if (nitTaken) throw new ConflictError('El NIT ya está registrado.');

    const passwordHash = await hashPassword(input.password);

    const organization = await prisma.organization.create({
      data: {
        name: input.organizationName,
        nit: input.nit,
        users: {
          create: {
            email: input.email,
            password: passwordHash,
            firstName: input.firstName,
            lastName: input.lastName,
            role: UserRole.ADMIN,
          },
        },
      },
      include: { users: true },
    });

    const user = organization.users[0];
    const payload: JwtPayload = {
      sub: user.id,
      organizationId: organization.id,
      role: user.role,
      email: user.email,
    };

    return { user: toPublicUser(user), ...buildTokens(payload) };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Credenciales inválidas.');
    }

    const valid = await comparePassword(input.password, user.password);
    if (!valid) throw new UnauthorizedError('Credenciales inválidas.');

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: JwtPayload = {
      sub: user.id,
      organizationId: user.organizationId,
      role: user.role,
      email: user.email,
    };

    return { user: toPublicUser(user), ...buildTokens(payload) };
  }

  async refresh(refreshToken: string) {
    let decoded: JwtPayload;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Refresh token inválido o expirado.');
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user || !user.isActive) throw new UnauthorizedError();

    const payload: JwtPayload = {
      sub: user.id,
      organizationId: user.organizationId,
      role: user.role,
      email: user.email,
    };
    return buildTokens(payload);
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });
    if (!user) throw new AppError('Usuario no encontrado.', 404);
    return {
      ...toPublicUser(user),
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        nit: user.organization.nit,
      },
    };
  }
}

export const authService = new AuthService();
