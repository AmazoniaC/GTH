import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { hashPassword } from '../../core/utils/password';
import { AppError, ConflictError, NotFoundError } from '../../core/errors/AppError';
import type { CreateUserInput, UpdateProfileInput, UpdateUserInput } from './user.schema';

const publicSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  employee: { select: { id: true, firstName: true, lastName: true, documentNumber: true } },
} satisfies Prisma.UserSelect;

/**
 * Servicio de gestión de usuarios (cuentas de acceso a la plataforma).
 * Todas las operaciones se acotan a la organización del solicitante.
 */
export class UserService {
  list(organizationId: string) {
    return prisma.user.findMany({
      where: { organizationId },
      select: publicSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(organizationId: string, input: CreateUserInput) {
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new ConflictError('El correo electrónico ya está registrado.');

    const password = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        organizationId,
        email: input.email,
        password,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
      },
      select: publicSelect,
    });
    if (input.employeeId !== undefined) {
      await this.linkEmployee(user.id, input.employeeId, organizationId);
    }
    return prisma.user.findUnique({ where: { id: user.id }, select: publicSelect });
  }

  async update(id: string, organizationId: string, input: UpdateUserInput) {
    await this.ensure(id, organizationId);
    const data: Prisma.UserUpdateInput = {};
    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (input.role !== undefined) data.role = input.role;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.password) data.password = await hashPassword(input.password);
    await prisma.user.update({ where: { id }, data });
    if (input.employeeId !== undefined) {
      await this.linkEmployee(id, input.employeeId, organizationId);
    }
    return prisma.user.findUnique({ where: { id }, select: publicSelect });
  }

  /** Vincula (o desvincula) un usuario con un empleado (relación 1 a 1). */
  private async linkEmployee(userId: string, employeeId: string | null, organizationId: string) {
    // Quita el vínculo previo de este usuario.
    await prisma.employee.updateMany({ where: { userId }, data: { userId: null } });
    if (!employeeId) return;
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      select: { id: true },
    });
    if (!employee) throw new NotFoundError('Empleado');
    await prisma.employee.update({ where: { id: employeeId }, data: { userId } });
  }

  async remove(id: string, organizationId: string, currentUserId: string) {
    await this.ensure(id, organizationId);
    if (id === currentUserId) {
      throw new AppError('No puedes eliminar tu propia cuenta.', 422);
    }
    await prisma.user.delete({ where: { id } });
    return { id };
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const data: Prisma.UserUpdateInput = {};
    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (input.password) data.password = await hashPassword(input.password);
    return prisma.user.update({ where: { id: userId }, data, select: publicSelect });
  }

  private async ensure(id: string, organizationId: string) {
    const user = await prisma.user.findFirst({ where: { id, organizationId } });
    if (!user) throw new NotFoundError('Usuario');
    return user;
  }
}

export const userService = new UserService();
