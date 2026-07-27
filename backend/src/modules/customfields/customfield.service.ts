import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ConflictError, NotFoundError } from '../../core/errors/AppError';

export interface CustomFieldInput {
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT';
  options?: string[];
  section?: string;
}

function slugify(label: string): string {
  return (
    label
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || `campo_${Date.now()}`
  );
}

export class CustomFieldService {
  list(organizationId: string) {
    return prisma.customFieldDefinition.findMany({
      where: { organizationId },
      orderBy: [{ section: 'asc' }, { order: 'asc' }],
    });
  }

  async create(organizationId: string, input: CustomFieldInput) {
    let key = slugify(input.label);
    const exists = await prisma.customFieldDefinition.findFirst({ where: { organizationId, key } });
    if (exists) key = `${key}_${Date.now().toString().slice(-4)}`;

    const max = await prisma.customFieldDefinition.aggregate({
      where: { organizationId },
      _max: { order: true },
    });
    return prisma.customFieldDefinition.create({
      data: {
        organizationId,
        key,
        label: input.label,
        type: input.type,
        options: input.options ?? undefined,
        section: input.section?.trim() || 'Adicional',
        order: (max._max.order ?? 0) + 1,
      },
    });
  }

  async update(
    id: string,
    organizationId: string,
    input: { label?: string; options?: string[]; section?: string; isActive?: boolean },
  ) {
    await this.ensure(id, organizationId);
    const data: Prisma.CustomFieldDefinitionUpdateInput = {};
    if (input.label !== undefined) data.label = input.label;
    if (input.options !== undefined) data.options = input.options;
    if (input.section !== undefined) data.section = input.section;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    return prisma.customFieldDefinition.update({ where: { id }, data });
  }

  async remove(id: string, organizationId: string) {
    await this.ensure(id, organizationId);
    await prisma.customFieldDefinition.delete({ where: { id } });
    return { id };
  }

  private async ensure(id: string, organizationId: string) {
    const found = await prisma.customFieldDefinition.findFirst({ where: { id, organizationId } });
    if (!found) throw new NotFoundError('Campo personalizado');
    return found;
  }
}

export const customFieldService = new CustomFieldService();
