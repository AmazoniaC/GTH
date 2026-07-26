import { Prisma } from '@prisma/client';
import { employeeRepository, EmployeeRepository } from './employee.repository';
import { ConflictError, NotFoundError } from '../../core/errors/AppError';
import type {
  CreateEmployeeInput,
  ListEmployeesQuery,
  UpdateEmployeeInput,
} from './employee.schema';

/**
 * Servicio de Empleados. Contiene la lógica de negocio y orquesta el
 * repositorio. No conoce Express ni Prisma directamente (SRP + DIP).
 */
export class EmployeeService {
  constructor(private readonly repo: EmployeeRepository = employeeRepository) {}

  async list(organizationId: string, query: ListEmployeesQuery) {
    const { page, pageSize, search, status, departmentId } = query;

    const where: Prisma.EmployeeWhereInput = {};
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
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

  async create(organizationId: string, input: CreateEmployeeInput) {
    const existing = await this.repo.findByDocument(input.documentNumber, organizationId);
    if (existing) {
      throw new ConflictError('Ya existe un empleado con este número de documento.');
    }

    const { contract, employeeCode, departmentId, positionId, ...rest } = input;
    const code = employeeCode ?? (await this.repo.nextEmployeeCode(organizationId));

    const data: Prisma.EmployeeCreateInput = {
      ...rest,
      employeeCode: code,
      organization: { connect: { id: organizationId } },
      ...(departmentId ? { department: { connect: { id: departmentId } } } : {}),
      ...(positionId ? { position: { connect: { id: positionId } } } : {}),
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

    return this.repo.create(data);
  }

  async update(id: string, organizationId: string, input: UpdateEmployeeInput) {
    await this.getById(id, organizationId);

    const { departmentId, positionId, ...rest } = input;
    const data: Prisma.EmployeeUpdateInput = { ...rest };

    if (departmentId !== undefined) {
      data.department = departmentId
        ? { connect: { id: departmentId } }
        : { disconnect: true };
    }
    if (positionId !== undefined) {
      data.position = positionId ? { connect: { id: positionId } } : { disconnect: true };
    }

    return this.repo.update(id, data);
  }

  async remove(id: string, organizationId: string) {
    await this.getById(id, organizationId);
    await this.repo.delete(id);
    return { id };
  }
}

export const employeeService = new EmployeeService();
