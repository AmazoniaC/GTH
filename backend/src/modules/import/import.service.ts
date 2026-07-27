import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { auditService, Actor } from '../audit/audit.service';
import { rowSchema } from './import.schema';

export interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  errors: { row: number; documentNumber?: string; message: string }[];
}

/** Importación masiva de empleados desde filas (CSV/Excel). */
export class ImportService {
  async importEmployees(
    organizationId: string,
    rows: Record<string, unknown>[],
    actor?: Actor,
  ): Promise<ImportResult> {
    const result: ImportResult = { total: rows.length, created: 0, skipped: 0, errors: [] };

    // Precarga de catálogos para resolver por nombre (crea los que falten).
    const departments = new Map<string, string>(
      (await prisma.department.findMany({ where: { organizationId } })).map((d) => [
        d.name.toLowerCase(),
        d.id,
      ]),
    );
    const positions = new Map<string, string>(
      (await prisma.position.findMany({ where: { organizationId } })).map((p) => [
        p.title.toLowerCase(),
        p.id,
      ]),
    );

    const resolveDepartment = async (name?: string) => {
      if (!name?.trim()) return null;
      const key = name.trim().toLowerCase();
      if (departments.has(key)) return departments.get(key)!;
      const created = await prisma.department.create({
        data: { organizationId, name: name.trim() },
      });
      departments.set(key, created.id);
      return created.id;
    };
    const resolvePosition = async (title?: string) => {
      if (!title?.trim()) return null;
      const key = title.trim().toLowerCase();
      if (positions.has(key)) return positions.get(key)!;
      const count = await prisma.position.count({ where: { organizationId } });
      const created = await prisma.position.create({
        data: { organizationId, title: title.trim(), code: `CAR-${String(count + 1).padStart(3, '0')}` },
      });
      positions.set(key, created.id);
      return created.id;
    };

    for (let i = 0; i < rows.length; i++) {
      const parsed = rowSchema.safeParse(rows[i]);
      if (!parsed.success) {
        result.errors.push({
          row: i + 2, // +2: fila 1 es el encabezado
          documentNumber: (rows[i].documentNumber as string) ?? undefined,
          message: parsed.error.errors[0]?.message ?? 'Fila inválida.',
        });
        continue;
      }
      const r = parsed.data;

      const exists = await prisma.employee.findFirst({
        where: { organizationId, documentNumber: r.documentNumber },
        select: { id: true },
      });
      if (exists) {
        result.skipped += 1;
        continue;
      }

      try {
        const departmentId = await resolveDepartment(r.department);
        const positionId = await resolvePosition(r.position);
        const hireDate = r.hireDate ? new Date(r.hireDate) : new Date();

        await prisma.employee.create({
          data: {
            organizationId,
            employeeCode: r.documentNumber,
            documentType: r.documentType || 'CC',
            documentNumber: r.documentNumber,
            firstName: r.firstName,
            middleName: r.middleName || null,
            lastName: r.lastName,
            secondLastName: r.secondLastName || null,
            email: r.email || null,
            mobile: r.mobile || null,
            phone: r.phone || null,
            status: r.status || 'ACTIVE',
            eps: r.eps || null,
            pensionFund: r.pensionFund || null,
            arl: r.arl || null,
            bankName: r.bankName || null,
            departmentId,
            positionId,
            hireDate,
            contracts: {
              create: {
                type: r.contractType || 'INDEFINITE',
                baseSalary: new Prisma.Decimal(r.baseSalary && r.baseSalary > 0 ? r.baseSalary : 0),
                startDate: hireDate,
                isActive: true,
              },
            },
          },
        });
        result.created += 1;
      } catch (error) {
        result.errors.push({
          row: i + 2,
          documentNumber: r.documentNumber,
          message: error instanceof Error ? error.message : 'Error al crear el empleado.',
        });
      }
    }

    await auditService.record({
      organizationId,
      actor,
      action: 'CREATE',
      entity: 'Import',
      entityLabel: `Importación masiva: ${result.created} creados, ${result.skipped} omitidos`,
    });

    return result;
  }
}

export const importService = new ImportService();
