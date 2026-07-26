import { prisma } from '../../config/prisma';
import { ForbiddenError, NotFoundError } from '../../core/errors/AppError';
import type { CreateDocumentInput } from './document.schema';

// Metadatos del documento SIN el contenido (para no cargar base64 en los listados).
const metaSelect = {
  id: true,
  employeeId: true,
  type: true,
  name: true,
  fileName: true,
  mimeType: true,
  size: true,
  issueDate: true,
  expiryDate: true,
  createdAt: true,
};

export class DocumentService {
  /** Verifica que el empleado pertenezca a la organización. */
  private async ensureEmployee(employeeId: string, organizationId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      select: { id: true },
    });
    if (!employee) throw new NotFoundError('Empleado');
    return employee;
  }

  async list(employeeId: string, organizationId: string) {
    await this.ensureEmployee(employeeId, organizationId);
    return prisma.employeeDocument.findMany({
      where: { employeeId },
      select: metaSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(organizationId: string, input: CreateDocumentInput) {
    await this.ensureEmployee(input.employeeId, organizationId);
    return prisma.employeeDocument.create({
      data: {
        employeeId: input.employeeId,
        type: input.type,
        name: input.name,
        fileName: input.fileName,
        mimeType: input.mimeType,
        size: input.size,
        content: input.content,
        issueDate: input.issueDate ?? null,
        expiryDate: input.expiryDate ?? null,
      },
      select: metaSelect,
    });
  }

  /** Devuelve el documento con su contenido (para descarga). */
  async getWithContent(id: string, organizationId: string) {
    const doc = await prisma.employeeDocument.findUnique({
      where: { id },
      include: { employee: { select: { organizationId: true } } },
    });
    if (!doc) throw new NotFoundError('Documento');
    if (doc.employee.organizationId !== organizationId) throw new ForbiddenError();
    return doc;
  }

  async remove(id: string, organizationId: string) {
    await this.getWithContent(id, organizationId);
    await prisma.employeeDocument.delete({ where: { id } });
    return { id };
  }
}

export const documentService = new DocumentService();
