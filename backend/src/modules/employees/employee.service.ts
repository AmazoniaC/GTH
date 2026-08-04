import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { employeeRepository, EmployeeRepository } from './employee.repository';
import { AppError, ConflictError, NotFoundError } from '../../core/errors/AppError';
import { auditService, Actor } from '../audit/audit.service';
import { hashPassword } from '../../core/utils/password';
import type {
  CreateEmployeeInput,
  ListEmployeesQuery,
  UpdateEmployeeInput,
} from './employee.schema';

const AUDIT_FIELDS = [
  'firstName', 'middleName', 'lastName', 'secondLastName', 'documentType', 'documentNumber',
  'email', 'phone', 'mobile', 'status', 'departmentId', 'positionId', 'managerId',
  'costCenter', 'workLocation', 'eps', 'pensionFund', 'severanceFund', 'compensationFund',
  'arl', 'arlRiskClass', 'bankName', 'bankAccountType', 'bankAccountNumber', 'city',
  'stateProvince', 'address', 'nationality', 'maritalStatus',
];

/**
 * Servicio de Empleados. Contiene la lógica de negocio y orquesta el
 * repositorio. No conoce Express ni Prisma directamente (SRP + DIP).
 */
export class EmployeeService {
  constructor(private readonly repo: EmployeeRepository = employeeRepository) {}

  async list(organizationId: string, query: ListEmployeesQuery) {
    const { page, pageSize, search, status, departmentId, positionId } = query;

    const where: Prisma.EmployeeWhereInput = {};
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (positionId) where.positionId = positionId;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { documentNumber: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.repo.findManyPaginated({
      organizationId,
      skip: (page - 1) * pageSize,
      take: pageSize,
      where,
    });

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  async getById(id: string, organizationId: string) {
    const employee = await this.repo.findById(id, organizationId);
    if (!employee) throw new NotFoundError('Empleado');
    return employee;
  }

  /** Busca un empleado por su cédula (identificador visible en la app). */
  async getByDocument(documentNumber: string, organizationId: string) {
    const employee = await this.repo.findByDocumentDetailed(documentNumber, organizationId);
    if (!employee) throw new NotFoundError('Empleado');
    return employee;
  }

  async create(organizationId: string, input: CreateEmployeeInput, actor?: Actor) {
    const existing = await this.repo.findByDocument(input.documentNumber, organizationId);
    if (existing) {
      throw new ConflictError('Ya existe un empleado con este número de documento.');
    }

    // Respeta el límite de empleados asignado por el dueño de la plataforma.
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { maxEmployees: true },
    });
    if (org?.maxEmployees != null) {
      const current = await prisma.employee.count({ where: { organizationId } });
      if (current >= org.maxEmployees) {
        throw new AppError(
          `Alcanzaste el límite de empleados de tu plan (${org.maxEmployees}). Contacta al administrador de la plataforma para ampliarlo.`,
          409,
        );
      }
    }

    const { contract, employeeCode, departmentId, positionId, managerId, customFields, ...rest } =
      input;
    // El identificador del empleado es su cédula (número de documento).
    const code = employeeCode ?? input.documentNumber;

    const data: Prisma.EmployeeCreateInput = {
      ...rest,
      ...(customFields ? { customFields: customFields as Prisma.InputJsonValue } : {}),
      employeeCode: code,
      organization: { connect: { id: organizationId } },
      ...(departmentId ? { department: { connect: { id: departmentId } } } : {}),
      ...(positionId ? { position: { connect: { id: positionId } } } : {}),
      ...(managerId ? { manager: { connect: { id: managerId } } } : {}),
      contracts: {
        create: {
          type: contract.type,
          paymentFrequency: contract.paymentFrequency,
          baseSalary: new Prisma.Decimal(contract.baseSalary),
          isIntegralSalary: contract.isIntegralSalary,
          transportAllowance: contract.transportAllowance,
          startDate: contract.startDate,
          endDate: contract.endDate ?? null,
          notes: contract.notes ?? null,
          isActive: true,
        },
      },
    };

    if (data.dataConsent) data.dataConsentAt = new Date();
    const createdEmployee = await this.repo.create(data);
    await auditService.record({
      organizationId,
      actor,
      action: 'CREATE',
      entity: 'Employee',
      entityId: createdEmployee.id,
      entityLabel: `${createdEmployee.firstName} ${createdEmployee.lastName}`,
    });
    return createdEmployee;
  }

  async update(id: string, organizationId: string, input: UpdateEmployeeInput, actor?: Actor) {
    const before = await this.getById(id, organizationId);

    const { departmentId, positionId, managerId, customFields, contract, ...rest } = input;
    const data: Prisma.EmployeeUpdateInput = { ...rest };
    if (customFields !== undefined && customFields !== null) {
      data.customFields = customFields as Prisma.InputJsonValue;
    }
    // Registra la fecha al otorgar el consentimiento de datos.
    if (rest.dataConsent === true && !before.dataConsent) data.dataConsentAt = new Date();

    if (departmentId !== undefined) {
      data.department = departmentId
        ? { connect: { id: departmentId } }
        : { disconnect: true };
    }
    if (positionId !== undefined) {
      data.position = positionId ? { connect: { id: positionId } } : { disconnect: true };
    }
    if (managerId !== undefined) {
      // Evita que un empleado sea su propio jefe.
      data.manager = managerId && managerId !== id ? { connect: { id: managerId } } : { disconnect: true };
    }

    await this.repo.update(id, data);

    // Sincroniza el correo del acceso al portal si el empleado tiene usuario
    // y cambió su correo (el correo es su usuario de inicio de sesión).
    if (input.email !== undefined && before.userId) {
      const newEmail = (input.email ?? '').trim().toLowerCase();
      if (newEmail && newEmail !== (before.email ?? '').toLowerCase()) {
        const taken = await prisma.user.findUnique({ where: { email: newEmail } });
        if (!taken || taken.id === before.userId) {
          await prisma.user.update({ where: { id: before.userId }, data: { email: newEmail } });
        }
      }
    }

    // Actualiza (o crea) el contrato vigente si se envían datos de contrato.
    if (contract && Object.keys(contract).length > 0) {
      const active = await this.repo.findActiveContract(id);
      const contractData = {
        ...(contract.type !== undefined ? { type: contract.type } : {}),
        ...(contract.paymentFrequency !== undefined
          ? { paymentFrequency: contract.paymentFrequency }
          : {}),
        ...(contract.baseSalary !== undefined
          ? { baseSalary: new Prisma.Decimal(contract.baseSalary) }
          : {}),
        ...(contract.isIntegralSalary !== undefined
          ? { isIntegralSalary: contract.isIntegralSalary }
          : {}),
        ...(contract.transportAllowance !== undefined
          ? { transportAllowance: contract.transportAllowance }
          : {}),
        ...(contract.startDate !== undefined ? { startDate: contract.startDate } : {}),
      };

      if (active) {
        // Registra el cambio salarial en el historial si el salario cambió.
        if (
          contract.baseSalary !== undefined &&
          Number(active.baseSalary.toString()) !== contract.baseSalary
        ) {
          await prisma.salaryChange.create({
            data: {
              employeeId: id,
              previousSalary: active.baseSalary,
              newSalary: new Prisma.Decimal(contract.baseSalary),
              effectiveDate: new Date(),
              reason: 'Ajuste desde la ficha del empleado',
            },
          });
        }
        await this.repo.updateContract(active.id, contractData);
      } else if (contract.baseSalary !== undefined) {
        const contractStart = contract.startDate ?? new Date();
        await this.repo.createContract({
          employee: { connect: { id } },
          type: contract.type ?? 'INDEFINITE',
          baseSalary: new Prisma.Decimal(contract.baseSalary),
          startDate: contractStart,
          isIntegralSalary: contract.isIntegralSalary ?? false,
          transportAllowance: contract.transportAllowance ?? true,
          isActive: true,
        });
        // Un nuevo contrato vigente reactiva a un empleado retirado y la fecha
        // de ingreso pasa a la del nuevo contrato (si no se cambió el estado
        // explícitamente en esta misma edición).
        if (before.status === 'TERMINATED' && input.status === undefined) {
          await this.repo.update(id, {
            status: 'ACTIVE',
            terminationDate: null,
            hireDate: contractStart,
          });
        }
      }
    }

    const changes = auditService.diff(
      before as unknown as Record<string, unknown>,
      input as unknown as Record<string, unknown>,
      AUDIT_FIELDS,
    );
    if (changes || contract) {
      await auditService.record({
        organizationId,
        actor,
        action: 'UPDATE',
        entity: 'Employee',
        entityId: id,
        entityLabel: `${before.firstName} ${before.lastName}`,
        changes,
      });
    }

    return this.repo.findById(id, organizationId);
  }

  async remove(id: string, organizationId: string, actor?: Actor) {
    const employee = await this.getById(id, organizationId);
    await this.repo.delete(id);
    await auditService.record({
      organizationId,
      actor,
      action: 'DELETE',
      entity: 'Employee',
      entityId: id,
      entityLabel: `${employee.firstName} ${employee.lastName}`,
    });
    return { id };
  }

  selectList(organizationId: string) {
    return this.repo.selectList(organizationId);
  }

  // ===================== Acceso al portal del empleado =====================

  /** Estado de acceso al portal de un empleado. */
  async getPortalAccess(employeeId: string, organizationId: string) {
    const emp = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      select: { email: true, userId: true, user: { select: { email: true, isActive: true } } },
    });
    if (!emp) throw new NotFoundError('Empleado');
    return {
      hasAccess: !!emp.userId,
      email: emp.user?.email ?? emp.email ?? null,
      isActive: emp.user?.isActive ?? false,
    };
  }

  /**
   * Crea la cuenta de acceso al portal (rol Empleado) para un empleado.
   * La contraseña inicial es el número de documento. Requiere correo.
   */
  private async provisionAccess(emp: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    documentNumber: string;
    userId: string | null;
  }, organizationId: string) {
    if (emp.userId) throw new ConflictError('El empleado ya tiene acceso al portal.');
    if (!emp.email?.trim()) {
      throw new AppError('El empleado no tiene correo; agrégalo para crear su acceso.', 422);
    }
    const email = emp.email.trim().toLowerCase();
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) throw new ConflictError('Ya existe un usuario con ese correo.');

    const password = await hashPassword(emp.documentNumber);
    const user = await prisma.user.create({
      data: {
        organizationId,
        email,
        password,
        firstName: emp.firstName,
        lastName: emp.lastName,
        role: UserRole.EMPLOYEE,
      },
    });
    await prisma.employee.update({ where: { id: emp.id }, data: { userId: user.id } });
    return user;
  }

  async createPortalAccess(employeeId: string, organizationId: string, actor?: Actor) {
    const emp = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      select: { id: true, firstName: true, lastName: true, email: true, documentNumber: true, userId: true },
    });
    if (!emp) throw new NotFoundError('Empleado');
    const user = await this.provisionAccess(emp, organizationId);
    await auditService.record({
      organizationId,
      actor,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      entityLabel: `Acceso al portal · ${emp.firstName} ${emp.lastName}`,
    });
    return { hasAccess: true, email: user.email, isActive: user.isActive };
  }

  /** Activa o inhabilita el acceso al portal (bloquea el inicio de sesión). */
  async setPortalActive(employeeId: string, organizationId: string, isActive: boolean, actor?: Actor) {
    const emp = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      select: { userId: true, firstName: true, lastName: true },
    });
    if (!emp) throw new NotFoundError('Empleado');
    if (!emp.userId) throw new AppError('El empleado no tiene acceso al portal.', 422);
    const user = await prisma.user.update({ where: { id: emp.userId }, data: { isActive } });
    await auditService.record({
      organizationId,
      actor,
      action: 'UPDATE',
      entity: 'User',
      entityId: user.id,
      entityLabel: `Portal ${isActive ? 'activado' : 'inhabilitado'} · ${emp.firstName} ${emp.lastName}`,
    });
    return { hasAccess: true, email: user.email, isActive: user.isActive };
  }

  /** Crea accesos al portal para varios empleados a la vez. */
  async bulkPortalAccess(organizationId: string, employeeIds: string[], actor?: Actor) {
    const result = {
      created: 0,
      skipped: 0,
      errors: [] as { name?: string; documentNumber?: string; message: string }[],
    };
    for (const id of employeeIds) {
      const emp = await prisma.employee.findFirst({
        where: { id, organizationId },
        select: { id: true, firstName: true, lastName: true, email: true, documentNumber: true, userId: true },
      });
      if (!emp) {
        result.errors.push({ message: 'Empleado no encontrado.' });
        continue;
      }
      if (emp.userId) {
        result.skipped += 1;
        continue;
      }
      try {
        await this.provisionAccess(emp, organizationId);
        result.created += 1;
      } catch (e) {
        result.errors.push({
          name: `${emp.firstName} ${emp.lastName}`,
          documentNumber: emp.documentNumber,
          message: e instanceof AppError ? e.message : 'No se pudo crear el acceso.',
        });
      }
    }
    await auditService.record({
      organizationId,
      actor,
      action: 'CREATE',
      entity: 'User',
      entityLabel: `Accesos al portal (masivo): ${result.created} creados, ${result.skipped} omitidos`,
    });
    return result;
  }

  orgChart(organizationId: string) {
    return this.repo.orgChart(organizationId);
  }

  exportAll(organizationId: string) {
    return this.repo.exportAll(organizationId);
  }
}

export const employeeService = new EmployeeService();
