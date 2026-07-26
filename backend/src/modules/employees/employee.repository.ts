import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

/**
 * Repositorio de Empleados. Única capa que conoce Prisma para esta
 * entidad. Todas las consultas se acotan por `organizationId` para
 * garantizar el aislamiento entre empresas (multi-tenant).
 */
export class EmployeeRepository {
  private readonly detailInclude = {
    department: true,
    position: true,
    manager: {
      select: { id: true, firstName: true, lastName: true, documentNumber: true, photoUrl: true },
    },
    contracts: { orderBy: { createdAt: 'desc' as const } },
    _count: { select: { reports: true } },
  } satisfies Prisma.EmployeeInclude;

  findManyPaginated(params: {
    organizationId: string;
    skip: number;
    take: number;
    where: Prisma.EmployeeWhereInput;
  }) {
    const where: Prisma.EmployeeWhereInput = {
      organizationId: params.organizationId,
      ...params.where,
    };
    return prisma.$transaction([
      prisma.employee.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: {
          department: true,
          position: true,
          contracts: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);
  }

  findById(id: string, organizationId: string) {
    return prisma.employee.findFirst({
      where: { id, organizationId },
      include: this.detailInclude,
    });
  }

  findByDocument(documentNumber: string, organizationId: string) {
    return prisma.employee.findFirst({
      where: { documentNumber, organizationId },
    });
  }

  findByDocumentDetailed(documentNumber: string, organizationId: string) {
    return prisma.employee.findFirst({
      where: { documentNumber, organizationId },
      include: this.detailInclude,
    });
  }

  create(data: Prisma.EmployeeCreateInput) {
    return prisma.employee.create({ data, include: this.detailInclude });
  }

  update(id: string, data: Prisma.EmployeeUpdateInput) {
    return prisma.employee.update({ where: { id }, data, include: this.detailInclude });
  }

  delete(id: string) {
    return prisma.employee.delete({ where: { id } });
  }

  findActiveContract(employeeId: string) {
    return prisma.contract.findFirst({
      where: { employeeId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateContract(id: string, data: Prisma.ContractUpdateInput) {
    return prisma.contract.update({ where: { id }, data });
  }

  createContract(data: Prisma.ContractCreateInput) {
    return prisma.contract.create({ data });
  }

  countActive(organizationId: string) {
    return prisma.employee.count({ where: { organizationId, status: 'ACTIVE' } });
  }

  orgChart(organizationId: string) {
    return prisma.employee.findMany({
      where: { organizationId, status: { not: 'TERMINATED' } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        documentNumber: true,
        photoUrl: true,
        managerId: true,
        position: { select: { title: true } },
        department: { select: { name: true } },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  exportAll(organizationId: string) {
    return prisma.employee.findMany({
      where: { organizationId },
      orderBy: { firstName: 'asc' },
      include: {
        department: true,
        position: true,
        manager: { select: { firstName: true, lastName: true } },
        contracts: { where: { isActive: true }, take: 1, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async nextEmployeeCode(organizationId: string): Promise<string> {
    const count = await prisma.employee.count({ where: { organizationId } });
    return `EMP-${String(count + 1).padStart(4, '0')}`;
  }
}

export const employeeRepository = new EmployeeRepository();
