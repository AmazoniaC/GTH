import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError, NotFoundError } from '../../core/errors/AppError';
import { absenceService } from '../absences/absence.service';

const detailInclude = {
  department: true,
  position: true,
  manager: { select: { firstName: true, lastName: true } },
  contracts: { where: { isActive: true }, take: 1, orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.EmployeeInclude;

const documentMeta = {
  id: true,
  type: true,
  name: true,
  fileName: true,
  mimeType: true,
  size: true,
  issueDate: true,
  expiryDate: true,
  createdAt: true,
};

/** Servicio del portal de autoservicio: el usuario ve y edita su propia info. */
export class SelfServiceService {
  private async myEmployee(userId: string) {
    const employee = await prisma.employee.findFirst({ where: { userId } });
    if (!employee) {
      throw new AppError(
        'Tu usuario no está vinculado a un empleado. Solicita al administrador que realice la vinculación.',
        404,
      );
    }
    return employee;
  }

  async getProfile(userId: string) {
    const base = await this.myEmployee(userId);
    return prisma.employee.findUnique({ where: { id: base.id }, include: detailInclude });
  }

  async getDocuments(userId: string) {
    const emp = await this.myEmployee(userId);
    return prisma.employeeDocument.findMany({
      where: { employeeId: emp.id },
      select: documentMeta,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPayslips(userId: string) {
    const emp = await this.myEmployee(userId);
    return prisma.payslip.findMany({
      where: { employeeId: emp.id, status: { in: ['APPROVED', 'PAID', 'PROCESSED'] } },
      include: { period: { select: { name: true, year: true, month: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Ausencias del propio empleado (portal de autoservicio). */
  async getAbsences(userId: string) {
    const emp = await this.myEmployee(userId);
    return prisma.absence.findMany({
      where: { employeeId: emp.id },
      orderBy: { startDate: 'desc' },
    });
  }

  /** Saldo de vacaciones del propio empleado. */
  async getVacationBalance(userId: string) {
    const emp = await this.myEmployee(userId);
    return absenceService.vacationBalance(emp.id, emp.organizationId);
  }

  /** El empleado solicita una ausencia (queda pendiente de aprobación). */
  requestAbsence(
    userId: string,
    organizationId: string,
    input: { type: string; startDate: Date; endDate: Date; reason?: string | null; notes?: string | null },
  ) {
    return absenceService.createRequest(organizationId, userId, input);
  }

  cancelAbsenceRequest(userId: string, organizationId: string, id: string) {
    return absenceService.cancelRequest(id, organizationId, userId);
  }

  /** Solicitudes pendientes del equipo a cargo (si el empleado es jefe). */
  teamApprovals(userId: string, organizationId: string) {
    return absenceService.listApprovals(organizationId, userId, false);
  }

  reviewTeamRequest(
    userId: string,
    organizationId: string,
    id: string,
    decision: 'APPROVE' | 'REJECT',
    note?: string | null,
  ) {
    return absenceService.review(id, organizationId, {
      reviewerUserId: userId,
      canApproveAll: false,
      decision,
      note,
    });
  }

  /** Indica si el empleado tiene personas a cargo (para mostrar aprobaciones). */
  async isManager(userId: string) {
    const emp = await prisma.employee.findFirst({ where: { userId }, select: { id: true } });
    if (!emp) return false;
    const reports = await prisma.employee.count({ where: { managerId: emp.id } });
    return reports > 0;
  }

  async getDocumentContent(userId: string, documentId: string) {
    const emp = await this.myEmployee(userId);
    const doc = await prisma.employeeDocument.findFirst({
      where: { id: documentId, employeeId: emp.id },
    });
    if (!doc) throw new NotFoundError('Documento');
    return doc;
  }

  /** Actualiza únicamente los datos de contacto propios. */
  async updateContact(
    userId: string,
    input: {
      email?: string | null;
      phone?: string | null;
      mobile?: string | null;
      address?: string | null;
      city?: string | null;
      emergencyContactName?: string | null;
      emergencyContactPhone?: string | null;
    },
  ) {
    const emp = await this.myEmployee(userId);
    return prisma.employee.update({
      where: { id: emp.id },
      data: {
        email: input.email ?? undefined,
        phone: input.phone ?? undefined,
        mobile: input.mobile ?? undefined,
        address: input.address ?? undefined,
        city: input.city ?? undefined,
        emergencyContactName: input.emergencyContactName ?? undefined,
        emergencyContactPhone: input.emergencyContactPhone ?? undefined,
      },
      include: detailInclude,
    });
  }
}

export const selfServiceService = new SelfServiceService();
