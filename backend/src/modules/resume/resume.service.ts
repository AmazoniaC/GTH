import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../core/errors/AppError';

async function ensureEmployee(employeeId: string, organizationId: string) {
  const emp = await prisma.employee.findFirst({
    where: { id: employeeId, organizationId },
    select: { id: true },
  });
  if (!emp) throw new NotFoundError('Empleado');
}

export interface EducationInput {
  level: string;
  institution: string;
  title?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  isCompleted?: boolean;
}

export interface ExperienceInput {
  company: string;
  position: string;
  startDate?: Date | null;
  endDate?: Date | null;
  isCurrent?: boolean;
  responsibilities?: string | null;
}

export class ResumeService {
  // ---- Educación ----
  async listEducation(employeeId: string, organizationId: string) {
    await ensureEmployee(employeeId, organizationId);
    return prisma.education.findMany({ where: { employeeId }, orderBy: { startDate: 'desc' } });
  }

  async createEducation(employeeId: string, organizationId: string, input: EducationInput) {
    await ensureEmployee(employeeId, organizationId);
    return prisma.education.create({
      data: {
        employeeId,
        level: input.level,
        institution: input.institution,
        title: input.title ?? null,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        isCompleted: input.isCompleted ?? true,
      },
    });
  }

  async updateEducation(id: string, organizationId: string, input: Partial<EducationInput>) {
    await this.ensureEducation(id, organizationId);
    const data: Prisma.EducationUpdateInput = {};
    if (input.level !== undefined) data.level = input.level;
    if (input.institution !== undefined) data.institution = input.institution;
    if (input.title !== undefined) data.title = input.title;
    if (input.startDate !== undefined) data.startDate = input.startDate;
    if (input.endDate !== undefined) data.endDate = input.endDate;
    if (input.isCompleted !== undefined) data.isCompleted = input.isCompleted;
    return prisma.education.update({ where: { id }, data });
  }

  async deleteEducation(id: string, organizationId: string) {
    await this.ensureEducation(id, organizationId);
    await prisma.education.delete({ where: { id } });
    return { id };
  }

  // ---- Experiencia ----
  async listExperience(employeeId: string, organizationId: string) {
    await ensureEmployee(employeeId, organizationId);
    return prisma.workExperience.findMany({ where: { employeeId }, orderBy: { startDate: 'desc' } });
  }

  async createExperience(employeeId: string, organizationId: string, input: ExperienceInput) {
    await ensureEmployee(employeeId, organizationId);
    return prisma.workExperience.create({
      data: {
        employeeId,
        company: input.company,
        position: input.position,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        isCurrent: input.isCurrent ?? false,
        responsibilities: input.responsibilities ?? null,
      },
    });
  }

  async updateExperience(id: string, organizationId: string, input: Partial<ExperienceInput>) {
    await this.ensureExperience(id, organizationId);
    const data: Prisma.WorkExperienceUpdateInput = {};
    if (input.company !== undefined) data.company = input.company;
    if (input.position !== undefined) data.position = input.position;
    if (input.startDate !== undefined) data.startDate = input.startDate;
    if (input.endDate !== undefined) data.endDate = input.endDate;
    if (input.isCurrent !== undefined) data.isCurrent = input.isCurrent;
    if (input.responsibilities !== undefined) data.responsibilities = input.responsibilities;
    return prisma.workExperience.update({ where: { id }, data });
  }

  async deleteExperience(id: string, organizationId: string) {
    await this.ensureExperience(id, organizationId);
    await prisma.workExperience.delete({ where: { id } });
    return { id };
  }

  private async ensureEducation(id: string, organizationId: string) {
    const found = await prisma.education.findFirst({ where: { id, employee: { organizationId } } });
    if (!found) throw new NotFoundError('Formación');
  }
  private async ensureExperience(id: string, organizationId: string) {
    const found = await prisma.workExperience.findFirst({
      where: { id, employee: { organizationId } },
    });
    if (!found) throw new NotFoundError('Experiencia');
  }
}

export const resumeService = new ResumeService();
