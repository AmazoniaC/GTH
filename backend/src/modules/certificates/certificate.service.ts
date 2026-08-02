import { prisma } from '../../config/prisma';
import { AppError, NotFoundError } from '../../core/errors/AppError';
import { auditService, Actor } from '../audit/audit.service';
import {
  DEFAULT_TEMPLATES,
  TEMPLATE_VARIABLES,
  buildContext,
  renderTemplate,
} from './certificate.constants';
import { reserveNumbers, formatDocNumber } from '../../core/utils/sequence';
import type { CreateTemplateInput, RenderInput, UpdateTemplateInput } from './certificate.schema';

const employeeInclude = {
  position: { select: { title: true } },
  department: { select: { name: true } },
  contracts: { where: { isActive: true }, orderBy: { createdAt: 'desc' as const }, take: 1 },
};

export class CertificateService {
  /** Provisiona las plantillas por defecto la primera vez (idempotente). */
  private async ensureDefaults(organizationId: string) {
    const count = await prisma.documentTemplate.count({ where: { organizationId } });
    if (count > 0) return;
    await prisma.documentTemplate.createMany({
      data: DEFAULT_TEMPLATES.map((t) => ({
        organizationId,
        key: t.key,
        name: t.name,
        body: t.body,
        order: t.order,
        isSystem: true,
      })),
    });
  }

  variables() {
    return TEMPLATE_VARIABLES;
  }

  async listTemplates(organizationId: string) {
    await this.ensureDefaults(organizationId);
    return prisma.documentTemplate.findMany({
      where: { organizationId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getTemplate(id: string, organizationId: string) {
    const tpl = await prisma.documentTemplate.findFirst({ where: { id, organizationId } });
    if (!tpl) throw new NotFoundError('Plantilla');
    return tpl;
  }

  async createTemplate(organizationId: string, input: CreateTemplateInput, actor?: Actor) {
    const tpl = await prisma.documentTemplate.create({
      data: {
        organizationId,
        key: input.key ?? 'LETTER',
        name: input.name,
        body: input.body,
        order: input.order ?? 100,
      },
    });
    await auditService.record({
      organizationId,
      actor,
      action: 'CREATE',
      entity: 'DocumentTemplate',
      entityId: tpl.id,
      entityLabel: tpl.name,
    });
    return tpl;
  }

  async updateTemplate(id: string, organizationId: string, input: UpdateTemplateInput, actor?: Actor) {
    await this.getTemplate(id, organizationId);
    const tpl = await prisma.documentTemplate.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.body !== undefined ? { body: input.body } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
      },
    });
    await auditService.record({
      organizationId,
      actor,
      action: 'UPDATE',
      entity: 'DocumentTemplate',
      entityId: id,
      entityLabel: tpl.name,
    });
    return tpl;
  }

  async removeTemplate(id: string, organizationId: string, actor?: Actor) {
    const tpl = await this.getTemplate(id, organizationId);
    if (tpl.isSystem) {
      throw new AppError('Las plantillas del sistema no se pueden eliminar (puedes editarlas).', 409);
    }
    await prisma.documentTemplate.delete({ where: { id } });
    await auditService.record({
      organizationId,
      actor,
      action: 'DELETE',
      entity: 'DocumentTemplate',
      entityId: id,
      entityLabel: tpl.name,
    });
    return { id };
  }

  /** Genera el/los documento(s) resolviendo las variables por empleado. */
  async render(organizationId: string, input: RenderInput, actor?: Actor) {
    const template = await this.getTemplate(input.templateId, organizationId);

    const employees = await prisma.employee.findMany({
      where: { id: { in: input.employeeIds }, organizationId },
      include: employeeInclude,
    });
    if (employees.length === 0) {
      throw new AppError('No se encontraron empleados para generar el documento.', 422);
    }

    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new NotFoundError('Empresa');

    // Consecutivos correlativos para los documentos generados.
    const firstNumber = await reserveNumbers(organizationId, 'DOCUMENT', employees.length);

    const documents = employees.map((emp, i) => {
      const context = buildContext(emp, org);
      return {
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        documentNumber: emp.documentNumber,
        number: formatDocNumber('DOCUMENT', firstNumber + i),
        title: template.name,
        body: renderTemplate(template.body, context),
      };
    });

    await auditService.record({
      organizationId,
      actor,
      action: 'CREATE',
      entity: 'DocumentGeneration',
      entityLabel: `${template.name} · ${documents.length} documento(s)`,
    });

    return {
      template: { id: template.id, name: template.name },
      company: {
        name: org.name,
        legalName: org.legalName,
        nit: org.nit,
        address: org.address,
        city: org.city,
        phone: org.phone,
        email: org.email,
        legalRepresentative: org.legalRepresentative,
        logoUrl: org.logoUrl,
      },
      documents,
    };
  }
}

export const certificateService = new CertificateService();
