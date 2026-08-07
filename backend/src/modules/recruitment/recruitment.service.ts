import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError, ConflictError, NotFoundError } from '../../core/errors/AppError';
import { auditService, Actor } from '../audit/audit.service';
import { reserveNumbers, formatDocNumber } from '../../core/utils/sequence';
import { toNumber } from '../../core/utils/decimal';
import { renderContractPdf } from './contract-pdf';
import { employeeService } from '../employees/employee.service';
import {
  CONTRACT_MODALITIES,
  ONBOARDING_CATEGORIES,
  ONBOARDING_TEMPLATE,
  REQUIRED_DOCUMENT_TYPES,
  getModalityRule,
  isProbationValid,
  suggestedProbationDays,
} from '../../config/recruitment';
import type {
  AddDocumentInput,
  AddOnboardingTaskInput,
  CreateApplicationInput,
  CreateInterviewInput,
  CreateVacancyInput,
  HireInput,
  ListApplicationsQuery,
  ListVacanciesQuery,
  OfferStatusInput,
  UpdateApplicationInput,
  UpdateCandidateInput,
  UpdateDocumentInput,
  UpdateInterviewInput,
  UpdateOnboardingTaskInput,
  UpdateVacancyInput,
  UpsertOfferInput,
} from './recruitment.schema';

const num = toNumber;

const dec = (n?: number | null): Prisma.Decimal | null =>
  n == null ? null : new Prisma.Decimal(n);

const clean = (v?: string | null): string | null => {
  const t = (v ?? '').trim();
  return t.length ? t : null;
};

/** Modalidad de contratación → código del catálogo CONTRACT_TYPE del empleado. */
const MODALITY_TO_CONTRACT_TYPE: Record<string, string> = {
  INDEFINITE: 'INDEFINITE',
  FIXED_TERM: 'FIXED_TERM',
  WORK_OR_LABOR: 'WORK_LABOR',
  LEARNING: 'APPRENTICESHIP',
  OCCASIONAL: 'TEMPORARY',
};

const applicationInclude = {
  candidate: true,
  vacancy: { select: { id: true, title: true, code: true, modality: true } },
  interviews: { orderBy: { scheduledAt: 'asc' } },
  documents: { orderBy: { createdAt: 'asc' } },
  offer: true,
  onboardingTasks: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] },
} satisfies Prisma.ApplicationInclude;

export class RecruitmentService {
  /** Catálogos y reglas legales para la interfaz. */
  catalog() {
    return {
      modalities: CONTRACT_MODALITIES,
      documentTypes: REQUIRED_DOCUMENT_TYPES,
      onboardingCategories: ONBOARDING_CATEGORIES,
      onboardingTemplate: ONBOARDING_TEMPLATE,
    };
  }

  // ============================ Vacantes =============================

  async listVacancies(organizationId: string, query: ListVacanciesQuery) {
    const where: Prisma.VacancyWhereInput = { organizationId };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const vacancies = await prisma.vacancy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } } },
    });
    return vacancies.map((v) => ({
      ...v,
      salaryMin: num(v.salaryMin),
      salaryMax: num(v.salaryMax),
      applicationsCount: v._count.applications,
    }));
  }

  async getVacancy(id: string, organizationId: string) {
    const vacancy = await prisma.vacancy.findFirst({
      where: { id, organizationId },
      include: {
        applications: {
          include: {
            candidate: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            _count: { select: { interviews: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!vacancy) throw new NotFoundError('Vacante');
    return { ...vacancy, salaryMin: num(vacancy.salaryMin), salaryMax: num(vacancy.salaryMax) };
  }

  async createVacancy(organizationId: string, input: CreateVacancyInput, actor?: Actor) {
    const n = await reserveNumbers(organizationId, 'VACANCY', 1);
    const vacancy = await prisma.vacancy.create({
      data: {
        organizationId,
        code: formatDocNumber('VACANCY', n),
        title: input.title,
        departmentId: clean(input.departmentId),
        positionId: clean(input.positionId),
        description: clean(input.description),
        requirements: clean(input.requirements),
        modality: input.modality,
        workMode: input.workMode,
        location: clean(input.location),
        salaryMin: dec(input.salaryMin),
        salaryMax: dec(input.salaryMax),
        openings: input.openings,
        status: input.status,
        hiringManager: clean(input.hiringManager),
        notes: clean(input.notes),
        publishedAt: input.status === 'OPEN' ? new Date() : null,
      },
    });
    await auditService.record({
      organizationId,
      actor,
      action: 'CREATE',
      entity: 'Vacancy',
      entityId: vacancy.id,
      entityLabel: `${vacancy.code} · ${vacancy.title}`,
    });
    return vacancy;
  }

  async updateVacancy(id: string, organizationId: string, input: UpdateVacancyInput, actor?: Actor) {
    const current = await prisma.vacancy.findFirst({ where: { id, organizationId } });
    if (!current) throw new NotFoundError('Vacante');

    const data: Prisma.VacancyUpdateInput = {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.departmentId !== undefined ? { departmentId: clean(input.departmentId) } : {}),
      ...(input.positionId !== undefined ? { positionId: clean(input.positionId) } : {}),
      ...(input.description !== undefined ? { description: clean(input.description) } : {}),
      ...(input.requirements !== undefined ? { requirements: clean(input.requirements) } : {}),
      ...(input.modality !== undefined ? { modality: input.modality } : {}),
      ...(input.workMode !== undefined ? { workMode: input.workMode } : {}),
      ...(input.location !== undefined ? { location: clean(input.location) } : {}),
      ...(input.salaryMin !== undefined ? { salaryMin: dec(input.salaryMin) } : {}),
      ...(input.salaryMax !== undefined ? { salaryMax: dec(input.salaryMax) } : {}),
      ...(input.openings !== undefined ? { openings: input.openings } : {}),
      ...(input.hiringManager !== undefined ? { hiringManager: clean(input.hiringManager) } : {}),
      ...(input.notes !== undefined ? { notes: clean(input.notes) } : {}),
    };
    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === 'OPEN' && !current.publishedAt) data.publishedAt = new Date();
      if (['CLOSED', 'FILLED', 'CANCELLED'].includes(input.status)) data.closedAt = new Date();
    }
    const vacancy = await prisma.vacancy.update({ where: { id }, data });
    await auditService.record({
      organizationId,
      actor,
      action: 'UPDATE',
      entity: 'Vacancy',
      entityId: id,
      entityLabel: `${vacancy.code} · ${vacancy.title}`,
    });
    return vacancy;
  }

  async deleteVacancy(id: string, organizationId: string, actor?: Actor) {
    const current = await prisma.vacancy.findFirst({ where: { id, organizationId } });
    if (!current) throw new NotFoundError('Vacante');
    await prisma.vacancy.delete({ where: { id } });
    await auditService.record({
      organizationId,
      actor,
      action: 'DELETE',
      entity: 'Vacancy',
      entityId: id,
      entityLabel: `${current.code} · ${current.title}`,
    });
    return { id };
  }

  // ========================== Postulaciones ==========================

  async listApplications(organizationId: string, query: ListApplicationsQuery) {
    const where: Prisma.ApplicationWhereInput = { organizationId };
    if (query.vacancyId) where.vacancyId = query.vacancyId;
    if (query.stage) where.stage = query.stage;
    if (query.search) {
      where.candidate = {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { documentNumber: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }
    return prisma.application.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        candidate: true,
        vacancy: { select: { id: true, title: true, code: true } },
        _count: { select: { interviews: true, documents: true } },
      },
    });
  }

  async getApplication(id: string, organizationId: string) {
    const app = await prisma.application.findFirst({
      where: { id, organizationId },
      include: applicationInclude,
    });
    if (!app) throw new NotFoundError('Postulación');
    return this.serializeApplication(app);
  }

  private serializeApplication<T extends { candidate: { expectedSalary: Prisma.Decimal | null }; offer: { baseSalary: Prisma.Decimal } | null }>(
    app: T,
  ) {
    return {
      ...app,
      candidate: { ...app.candidate, expectedSalary: num(app.candidate.expectedSalary) },
      offer: app.offer ? { ...app.offer, baseSalary: num(app.offer.baseSalary) } : null,
    };
  }

  async createApplication(organizationId: string, input: CreateApplicationInput, actor?: Actor) {
    const vacancy = await prisma.vacancy.findFirst({
      where: { id: input.vacancyId, organizationId },
      select: { id: true, title: true },
    });
    if (!vacancy) throw new NotFoundError('Vacante');

    const c = input.candidate;
    const docNumber = clean(c.documentNumber);

    // Reutiliza el candidato si ya existe (mismo documento en la empresa).
    let candidate = docNumber
      ? await prisma.candidate.findFirst({ where: { organizationId, documentNumber: docNumber } })
      : null;

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          organizationId,
          firstName: c.firstName,
          lastName: c.lastName,
          documentType: c.documentType ?? 'CC',
          documentNumber: docNumber,
          email: clean(c.email),
          phone: clean(c.phone),
          city: clean(c.city),
          source: clean(c.source),
          resumeUrl: clean(c.resumeUrl),
          linkedinUrl: clean(c.linkedinUrl),
          currentPosition: clean(c.currentPosition),
          expectedSalary: dec(c.expectedSalary),
          notes: clean(c.notes),
        },
      });
    }

    // Evita postular dos veces el mismo candidato a la misma vacante.
    const existing = await prisma.application.findUnique({
      where: { vacancyId_candidateId: { vacancyId: vacancy.id, candidateId: candidate.id } },
    });
    if (existing) {
      throw new ConflictError('Este candidato ya está postulado a esta vacante.');
    }

    const application = await prisma.application.create({
      data: {
        organizationId,
        vacancyId: vacancy.id,
        candidateId: candidate.id,
        source: clean(c.source),
        stage: 'APPLIED',
      },
      include: applicationInclude,
    });
    await auditService.record({
      organizationId,
      actor,
      action: 'CREATE',
      entity: 'Application',
      entityId: application.id,
      entityLabel: `${candidate.firstName} ${candidate.lastName} · ${vacancy.title}`,
    });
    return this.serializeApplication(application);
  }

  async updateApplication(id: string, organizationId: string, input: UpdateApplicationInput, actor?: Actor) {
    const current = await prisma.application.findFirst({ where: { id, organizationId } });
    if (!current) throw new NotFoundError('Postulación');
    const updated = await prisma.application.update({
      where: { id },
      data: {
        ...(input.stage !== undefined ? { stage: input.stage } : {}),
        ...(input.rating !== undefined ? { rating: input.rating } : {}),
        ...(input.rejectedReason !== undefined ? { rejectedReason: clean(input.rejectedReason) } : {}),
        ...(input.notes !== undefined ? { notes: clean(input.notes) } : {}),
      },
      include: applicationInclude,
    });
    await auditService.record({
      organizationId,
      actor,
      action: 'UPDATE',
      entity: 'Application',
      entityId: id,
    });
    return this.serializeApplication(updated);
  }

  /** Mueve la postulación de etapa en el embudo. */
  async moveStage(
    id: string,
    organizationId: string,
    stage: string,
    rejectedReason: string | null | undefined,
    actor?: Actor,
  ) {
    const current = await prisma.application.findFirst({
      where: { id, organizationId },
      include: { candidate: { select: { firstName: true, lastName: true } } },
    });
    if (!current) throw new NotFoundError('Postulación');
    if (current.stage === 'HIRED') {
      throw new AppError('La postulación ya fue contratada y no puede cambiar de etapa.', 409);
    }
    const updated = await prisma.application.update({
      where: { id },
      data: {
        stage: stage as never,
        rejectedReason: stage === 'REJECTED' ? clean(rejectedReason) : current.rejectedReason,
      },
      include: applicationInclude,
    });
    await auditService.record({
      organizationId,
      actor,
      action: 'UPDATE',
      entity: 'Application',
      entityId: id,
      entityLabel: `${current.candidate.firstName} ${current.candidate.lastName} → ${stage}`,
    });
    return this.serializeApplication(updated);
  }

  async updateCandidate(id: string, organizationId: string, input: UpdateCandidateInput, actor?: Actor) {
    const current = await prisma.candidate.findFirst({ where: { id, organizationId } });
    if (!current) throw new NotFoundError('Candidato');
    const updated = await prisma.candidate.update({
      where: { id },
      data: {
        ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.documentType !== undefined ? { documentType: input.documentType } : {}),
        ...(input.documentNumber !== undefined ? { documentNumber: clean(input.documentNumber) } : {}),
        ...(input.email !== undefined ? { email: clean(input.email) } : {}),
        ...(input.phone !== undefined ? { phone: clean(input.phone) } : {}),
        ...(input.city !== undefined ? { city: clean(input.city) } : {}),
        ...(input.source !== undefined ? { source: clean(input.source) } : {}),
        ...(input.resumeUrl !== undefined ? { resumeUrl: clean(input.resumeUrl) } : {}),
        ...(input.linkedinUrl !== undefined ? { linkedinUrl: clean(input.linkedinUrl) } : {}),
        ...(input.currentPosition !== undefined ? { currentPosition: clean(input.currentPosition) } : {}),
        ...(input.expectedSalary !== undefined ? { expectedSalary: dec(input.expectedSalary) } : {}),
        ...(input.notes !== undefined ? { notes: clean(input.notes) } : {}),
      },
    });
    await auditService.record({
      organizationId,
      actor,
      action: 'UPDATE',
      entity: 'Candidate',
      entityId: id,
      entityLabel: `${updated.firstName} ${updated.lastName}`,
    });
    return { ...updated, expectedSalary: num(updated.expectedSalary) };
  }

  async deleteApplication(id: string, organizationId: string, actor?: Actor) {
    const current = await prisma.application.findFirst({ where: { id, organizationId } });
    if (!current) throw new NotFoundError('Postulación');
    await prisma.application.delete({ where: { id } });
    await auditService.record({
      organizationId,
      actor,
      action: 'DELETE',
      entity: 'Application',
      entityId: id,
    });
    return { id };
  }

  // ============================ Entrevistas ==========================

  private async ensureApplication(applicationId: string, organizationId: string) {
    const app = await prisma.application.findFirst({
      where: { id: applicationId, organizationId },
      select: { id: true },
    });
    if (!app) throw new NotFoundError('Postulación');
    return app;
  }

  async addInterview(applicationId: string, organizationId: string, input: CreateInterviewInput, actor?: Actor) {
    await this.ensureApplication(applicationId, organizationId);
    const interview = await prisma.interview.create({
      data: {
        applicationId,
        type: input.type,
        scheduledAt: input.scheduledAt,
        durationMin: input.durationMin,
        interviewerId: clean(input.interviewerId),
        interviewerName: clean(input.interviewerName),
        location: clean(input.location),
      },
    });
    await auditService.record({
      organizationId,
      actor,
      action: 'CREATE',
      entity: 'Interview',
      entityId: interview.id,
    });
    return interview;
  }

  async updateInterview(id: string, organizationId: string, input: UpdateInterviewInput, actor?: Actor) {
    const interview = await prisma.interview.findFirst({
      where: { id, application: { organizationId } },
    });
    if (!interview) throw new NotFoundError('Entrevista');
    const updated = await prisma.interview.update({
      where: { id },
      data: {
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt } : {}),
        ...(input.durationMin !== undefined ? { durationMin: input.durationMin } : {}),
        ...(input.interviewerId !== undefined ? { interviewerId: clean(input.interviewerId) } : {}),
        ...(input.interviewerName !== undefined ? { interviewerName: clean(input.interviewerName) } : {}),
        ...(input.location !== undefined ? { location: clean(input.location) } : {}),
        ...(input.score !== undefined ? { score: input.score } : {}),
        ...(input.feedback !== undefined ? { feedback: clean(input.feedback) } : {}),
      },
    });
    await auditService.record({
      organizationId,
      actor,
      action: 'UPDATE',
      entity: 'Interview',
      entityId: id,
    });
    return updated;
  }

  async deleteInterview(id: string, organizationId: string, actor?: Actor) {
    const interview = await prisma.interview.findFirst({
      where: { id, application: { organizationId } },
    });
    if (!interview) throw new NotFoundError('Entrevista');
    await prisma.interview.delete({ where: { id } });
    await auditService.record({ organizationId, actor, action: 'DELETE', entity: 'Interview', entityId: id });
    return { id };
  }

  // ============================ Documentos ===========================

  /** Crea el checklist de documentos obligatorios que aún no existan. */
  async seedRequiredDocuments(applicationId: string, organizationId: string) {
    await this.ensureApplication(applicationId, organizationId);
    const existing = await prisma.applicationDocument.findMany({
      where: { applicationId },
      select: { type: true },
    });
    const have = new Set(existing.map((d) => d.type));
    const toCreate = REQUIRED_DOCUMENT_TYPES.filter((d) => !have.has(d.code));
    if (toCreate.length) {
      await prisma.applicationDocument.createMany({
        data: toCreate.map((d) => ({
          applicationId,
          type: d.code,
          name: d.label,
          required: d.required,
        })),
      });
    }
    return prisma.applicationDocument.findMany({ where: { applicationId }, orderBy: { createdAt: 'asc' } });
  }

  async addDocument(applicationId: string, organizationId: string, input: AddDocumentInput, actor?: Actor) {
    await this.ensureApplication(applicationId, organizationId);
    const doc = await prisma.applicationDocument.create({
      data: {
        applicationId,
        type: input.type,
        name: input.name,
        fileUrl: clean(input.fileUrl),
        required: input.required,
        verified: false,
      },
    });
    await auditService.record({ organizationId, actor, action: 'CREATE', entity: 'ApplicationDocument', entityId: doc.id });
    return doc;
  }

  async updateDocument(id: string, organizationId: string, input: UpdateDocumentInput, actor?: Actor) {
    const doc = await prisma.applicationDocument.findFirst({
      where: { id, application: { organizationId } },
    });
    if (!doc) throw new NotFoundError('Documento');
    const data: Prisma.ApplicationDocumentUpdateInput = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.fileUrl !== undefined ? { fileUrl: clean(input.fileUrl) } : {}),
      ...(input.notes !== undefined ? { notes: clean(input.notes) } : {}),
    };
    if (input.verified !== undefined) {
      data.verified = input.verified;
      data.verifiedAt = input.verified ? new Date() : null;
      data.verifiedBy = input.verified ? actor?.userName ?? actor?.userId ?? null : null;
    }
    const updated = await prisma.applicationDocument.update({ where: { id }, data });
    await auditService.record({ organizationId, actor, action: 'UPDATE', entity: 'ApplicationDocument', entityId: id });
    return updated;
  }

  async deleteDocument(id: string, organizationId: string, actor?: Actor) {
    const doc = await prisma.applicationDocument.findFirst({
      where: { id, application: { organizationId } },
    });
    if (!doc) throw new NotFoundError('Documento');
    await prisma.applicationDocument.delete({ where: { id } });
    await auditService.record({ organizationId, actor, action: 'DELETE', entity: 'ApplicationDocument', entityId: id });
    return { id };
  }

  // ============================== Oferta =============================

  /** Crea o actualiza la oferta/contrato de la postulación. */
  async upsertOffer(applicationId: string, organizationId: string, input: UpsertOfferInput, actor?: Actor) {
    await this.ensureApplication(applicationId, organizationId);

    const rule = getModalityRule(input.modality);
    if (rule?.requiresEndDate && !input.endDate) {
      throw new AppError(`La modalidad "${rule.label}" requiere fecha de finalización.`, 422);
    }
    if (input.endDate && input.endDate <= input.startDate) {
      throw new AppError('La fecha de finalización debe ser posterior a la de inicio.', 422);
    }

    // Período de prueba: usa el indicado o el sugerido por ley, y valida el tope.
    const probation =
      input.probationDays ?? suggestedProbationDays(input.modality, input.startDate, input.endDate);
    if (!isProbationValid(input.modality, probation, input.startDate, input.endDate)) {
      throw new AppError(
        'El período de prueba excede el máximo legal para esta modalidad (2 meses; en fijos < 1 año, 1/5 del término).',
        422,
      );
    }

    const data = {
      modality: input.modality,
      positionTitle: clean(input.positionTitle),
      baseSalary: new Prisma.Decimal(input.baseSalary),
      isIntegralSalary: input.isIntegralSalary,
      transportAllowance: input.transportAllowance,
      paymentFrequency: input.paymentFrequency,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      probationDays: probation,
      workScheduleNote: clean(input.workScheduleNote),
      notes: clean(input.notes),
    };

    const offer = await prisma.jobOffer.upsert({
      where: { applicationId },
      create: { applicationId, ...data, status: 'DRAFT' },
      update: data,
    });

    // Al preparar oferta, avanza la postulación a la etapa de oferta.
    await prisma.application.update({
      where: { id: applicationId },
      data: { stage: { set: 'OFFER' } },
    }).catch(() => undefined);

    await auditService.record({
      organizationId,
      actor,
      action: 'UPDATE',
      entity: 'JobOffer',
      entityId: offer.id,
    });
    return { ...offer, baseSalary: num(offer.baseSalary) };
  }

  async updateOfferStatus(applicationId: string, organizationId: string, input: OfferStatusInput, actor?: Actor) {
    await this.ensureApplication(applicationId, organizationId);
    const offer = await prisma.jobOffer.findUnique({ where: { applicationId } });
    if (!offer) throw new NotFoundError('Oferta');

    const data: Prisma.JobOfferUpdateInput = {};
    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === 'SENT') data.sentAt = new Date();
      if (input.status === 'ACCEPTED' || input.status === 'DECLINED') data.respondedAt = new Date();
    }
    if (input.signedByCandidate !== undefined) {
      data.signedByCandidate = input.signedByCandidate;
      data.signedAt = input.signedByCandidate ? new Date() : null;
    }
    if (input.signedDocumentUrl !== undefined) data.signedDocumentUrl = clean(input.signedDocumentUrl);

    const updated = await prisma.jobOffer.update({ where: { applicationId }, data });
    await auditService.record({ organizationId, actor, action: 'UPDATE', entity: 'JobOffer', entityId: updated.id });
    return { ...updated, baseSalary: num(updated.baseSalary) };
  }

  // ============================ Onboarding ===========================

  /** Crea las tareas de onboarding a partir de la plantilla (si no existen). */
  async seedOnboarding(applicationId: string, organizationId: string) {
    await this.ensureApplication(applicationId, organizationId);
    const count = await prisma.onboardingTask.count({ where: { applicationId } });
    if (count === 0) {
      await prisma.onboardingTask.createMany({
        data: ONBOARDING_TEMPLATE.map((t, i) => ({
          applicationId,
          category: t.category,
          title: t.title,
          order: i,
        })),
      });
    }
    return prisma.onboardingTask.findMany({
      where: { applicationId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async addOnboardingTask(applicationId: string, organizationId: string, input: AddOnboardingTaskInput, actor?: Actor) {
    await this.ensureApplication(applicationId, organizationId);
    const max = await prisma.onboardingTask.aggregate({
      where: { applicationId },
      _max: { order: true },
    });
    const task = await prisma.onboardingTask.create({
      data: {
        applicationId,
        category: input.category,
        title: input.title,
        dueDate: input.dueDate ?? null,
        responsibleId: clean(input.responsibleId),
        order: (max._max.order ?? 0) + 1,
      },
    });
    await auditService.record({ organizationId, actor, action: 'CREATE', entity: 'OnboardingTask', entityId: task.id });
    return task;
  }

  async updateOnboardingTask(id: string, organizationId: string, input: UpdateOnboardingTaskInput, actor?: Actor) {
    const task = await prisma.onboardingTask.findFirst({
      where: { id, application: { organizationId } },
    });
    if (!task) throw new NotFoundError('Tarea de onboarding');
    const data: Prisma.OnboardingTaskUpdateInput = {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
      ...(input.responsibleId !== undefined ? { responsibleId: clean(input.responsibleId) } : {}),
      ...(input.notes !== undefined ? { notes: clean(input.notes) } : {}),
    };
    if (input.status !== undefined) {
      data.status = input.status;
      data.completedAt = input.status === 'DONE' ? new Date() : null;
    }
    const updated = await prisma.onboardingTask.update({ where: { id }, data });
    await auditService.record({ organizationId, actor, action: 'UPDATE', entity: 'OnboardingTask', entityId: id });
    return updated;
  }

  async deleteOnboardingTask(id: string, organizationId: string, actor?: Actor) {
    const task = await prisma.onboardingTask.findFirst({
      where: { id, application: { organizationId } },
    });
    if (!task) throw new NotFoundError('Tarea de onboarding');
    await prisma.onboardingTask.delete({ where: { id } });
    await auditService.record({ organizationId, actor, action: 'DELETE', entity: 'OnboardingTask', entityId: id });
    return { id };
  }

  // ============================= Contratar ===========================

  /**
   * Contrata al candidato: crea el empleado y su contrato en el módulo de
   * Talento Humano y marca la postulación como contratada. Requiere una oferta
   * definida. Respeta el límite de empleados del plan de la empresa.
   */
  async hire(applicationId: string, organizationId: string, input: HireInput, actor?: Actor) {
    const app = await prisma.application.findFirst({
      where: { id: applicationId, organizationId },
      include: { candidate: true, offer: true, vacancy: true },
    });
    if (!app) throw new NotFoundError('Postulación');
    if (app.stage === 'HIRED' || app.hiredEmployeeId) {
      throw new AppError('Esta postulación ya fue contratada.', 409);
    }
    if (!app.offer) {
      throw new AppError('Primero define la oferta/contrato del candidato.', 422);
    }
    const c = app.candidate;
    if (!c.documentNumber) {
      throw new AppError('El candidato debe tener número de documento para ser contratado.', 422);
    }
    // El límite del plan y el control de documento duplicado los aplica
    // `employeeService.createRecord` (única fuente de verdad).

    const offer = app.offer;
    const contractType = MODALITY_TO_CONTRACT_TYPE[offer.modality] ?? 'INDEFINITE';
    const probationEnd =
      offer.probationDays && offer.probationDays > 0
        ? new Date(offer.startDate.getTime() + offer.probationDays * 86_400_000)
        : null;

    const result = await prisma.$transaction(async (tx) => {
      // Reutiliza la única lógica canónica de creación de empleados (misma que
      // el alta directa): valida el límite del plan, crea empleado + contrato
      // y mantiene una sola fuente de verdad.
      const employee = await employeeService.createRecord(
        organizationId,
        {
          documentType: c.documentType,
          documentNumber: c.documentNumber!,
          employeeCode: clean(input.employeeCode) ?? undefined,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email ?? null,
          mobile: c.phone ?? null,
          city: c.city ?? null,
          departmentId: clean(input.departmentId),
          positionId: clean(input.positionId),
          arlRiskClass: input.arlRiskClass,
          hireDate: offer.startDate,
          status: 'ACTIVE',
          contract: {
            type: contractType,
            paymentFrequency: offer.paymentFrequency,
            baseSalary: num(offer.baseSalary),
            isIntegralSalary: offer.isIntegralSalary,
            transportAllowance: offer.transportAllowance,
            startDate: offer.startDate,
            endDate: offer.endDate ?? null,
            probationEndDate: probationEnd,
            notes: offer.notes ?? null,
          },
        },
        tx,
      );

      await tx.application.update({
        where: { id: applicationId },
        data: { stage: 'HIRED', hiredEmployeeId: employee.id },
      });

      await tx.jobOffer.update({
        where: { applicationId },
        data: { status: 'ACCEPTED', respondedAt: offer.respondedAt ?? new Date() },
      });

      // Cubre la vacante cuando se alcanzan las plazas contratadas.
      const hiredCount = await tx.application.count({
        where: { vacancyId: app.vacancyId, stage: 'HIRED' },
      });
      if (hiredCount >= app.vacancy.openings) {
        await tx.vacancy.update({
          where: { id: app.vacancyId },
          data: { status: 'FILLED', closedAt: new Date() },
        });
      }

      // Crea las tareas de onboarding si aún no existen.
      const obCount = await tx.onboardingTask.count({ where: { applicationId } });
      if (obCount === 0) {
        await tx.onboardingTask.createMany({
          data: ONBOARDING_TEMPLATE.map((t, i) => ({
            applicationId,
            category: t.category,
            title: t.title,
            order: i,
          })),
        });
      }

      return employee;
    });

    await auditService.record({
      organizationId,
      actor,
      action: 'CREATE',
      entity: 'Employee',
      entityId: result.id,
      entityLabel: `Contratación: ${c.firstName} ${c.lastName} · ${app.vacancy.title}`,
    });
    return { employeeId: result.id, employeeCode: result.employeeCode };
  }

  /**
   * Origen de contratación de un empleado (trazabilidad): de qué vacante y
   * postulación salió. Devuelve null si fue un alta directa/importación.
   */
  async originForEmployee(employeeId: string, organizationId: string) {
    const app = await prisma.application.findFirst({
      where: { organizationId, hiredEmployeeId: employeeId },
      select: {
        id: true,
        updatedAt: true,
        vacancy: { select: { id: true, code: true, title: true } },
      },
    });
    if (!app) return null;
    return {
      applicationId: app.id,
      vacancyId: app.vacancy.id,
      vacancyCode: app.vacancy.code,
      vacancyTitle: app.vacancy.title,
      hiredAt: app.updatedAt,
    };
  }

  // ============================ Contrato PDF =========================

  /** Genera el PDF del contrato de trabajo con membrete a partir de la oferta. */
  async contractPdf(applicationId: string, organizationId: string): Promise<{ buffer: Buffer; fileName: string }> {
    const app = await prisma.application.findFirst({
      where: { id: applicationId, organizationId },
      include: { candidate: true, offer: true, vacancy: { select: { title: true } } },
    });
    if (!app) throw new NotFoundError('Postulación');
    if (!app.offer) throw new AppError('Primero define la oferta/contrato del candidato.', 422);
    if (!app.candidate.documentNumber) {
      throw new AppError('El candidato debe tener número de documento para generar el contrato.', 422);
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true, legalName: true, nit: true, address: true, city: true,
        phone: true, email: true, logoUrl: true, legalRepresentative: true,
      },
    });
    if (!org) throw new NotFoundError('Empresa');

    const o = app.offer;
    const buffer = await renderContractPdf({
      org,
      candidate: {
        firstName: app.candidate.firstName,
        lastName: app.candidate.lastName,
        documentType: app.candidate.documentType,
        documentNumber: app.candidate.documentNumber,
      },
      vacancyTitle: app.vacancy.title,
      offer: {
        modality: o.modality,
        positionTitle: o.positionTitle,
        baseSalary: o.baseSalary,
        isIntegralSalary: o.isIntegralSalary,
        transportAllowance: o.transportAllowance,
        paymentFrequency: o.paymentFrequency,
        startDate: o.startDate,
        endDate: o.endDate,
        probationDays: o.probationDays,
        workScheduleNote: o.workScheduleNote,
      },
    });
    const safeName = `${app.candidate.firstName}-${app.candidate.lastName}`.replace(/[^\w-]+/g, '_');
    return { buffer, fileName: `Contrato-${safeName}.pdf` };
  }

  // ============================== Resumen ============================

  /** Métricas del módulo para tableros. */
  async summary(organizationId: string) {
    const [openVacancies, totalVacancies, byStage, upcomingInterviews] = await Promise.all([
      prisma.vacancy.count({ where: { organizationId, status: 'OPEN' } }),
      prisma.vacancy.count({ where: { organizationId } }),
      prisma.application.groupBy({
        by: ['stage'],
        where: { organizationId },
        _count: { _all: true },
      }),
      prisma.interview.count({
        where: {
          application: { organizationId },
          status: 'SCHEDULED',
          scheduledAt: { gte: new Date() },
        },
      }),
    ]);
    const stages: Record<string, number> = {};
    for (const row of byStage) stages[row.stage] = row._count._all;
    return { openVacancies, totalVacancies, byStage: stages, upcomingInterviews };
  }
}

export const recruitmentService = new RecruitmentService();
