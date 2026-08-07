import { z } from 'zod';

/** Coacciona a Date aceptando string ISO o Date. */
const dateField = z.coerce.date();
const optionalDate = z.coerce.date().optional().nullable();

const MODALITIES = ['INDEFINITE', 'FIXED_TERM', 'WORK_OR_LABOR', 'LEARNING', 'OCCASIONAL'] as const;
const WORK_MODES = ['ONSITE', 'REMOTE', 'HYBRID'] as const;
const VACANCY_STATUS = ['DRAFT', 'OPEN', 'PAUSED', 'CLOSED', 'FILLED', 'CANCELLED'] as const;
const STAGES = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'TECHNICAL_TEST',
  'OFFER',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
] as const;
const INTERVIEW_TYPES = ['PHONE', 'VIRTUAL', 'IN_PERSON', 'TECHNICAL'] as const;
const INTERVIEW_STATUS = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;
const OFFER_STATUS = ['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED'] as const;
const ONBOARDING_STATUS = ['PENDING', 'IN_PROGRESS', 'DONE', 'NA'] as const;
const FREQUENCIES = ['MONTHLY', 'BIWEEKLY'] as const;

export const idParam = z.object({ params: z.object({ id: z.string().min(1) }) });

// ---------------------------- Vacantes ----------------------------

export const listVacanciesSchema = z.object({
  query: z.object({
    status: z.enum(VACANCY_STATUS).optional(),
    search: z.string().optional(),
  }),
});

export const createVacancySchema = z.object({
  body: z.object({
    title: z.string().min(2, 'El título es obligatorio.'),
    departmentId: z.string().optional().nullable(),
    positionId: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    requirements: z.string().optional().nullable(),
    modality: z.enum(MODALITIES).default('INDEFINITE'),
    workMode: z.enum(WORK_MODES).default('ONSITE'),
    location: z.string().optional().nullable(),
    salaryMin: z.number().nonnegative().optional().nullable(),
    salaryMax: z.number().nonnegative().optional().nullable(),
    openings: z.number().int().positive().default(1),
    status: z.enum(VACANCY_STATUS).default('OPEN'),
    hiringManager: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const updateVacancySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: createVacancySchema.shape.body.partial(),
});

// --------------------------- Candidatos ---------------------------

export const listApplicationsSchema = z.object({
  query: z.object({
    vacancyId: z.string().optional(),
    stage: z.enum(STAGES).optional(),
    search: z.string().optional(),
  }),
});

/** Crea (o reutiliza) un candidato y lo postula a una vacante. */
export const createApplicationSchema = z.object({
  body: z.object({
    vacancyId: z.string().min(1, 'La vacante es obligatoria.'),
    candidate: z.object({
      firstName: z.string().min(1, 'El nombre es obligatorio.'),
      lastName: z.string().min(1, 'El apellido es obligatorio.'),
      documentType: z.string().default('CC'),
      documentNumber: z.string().optional().nullable(),
      email: z.string().email('Correo inválido.').optional().nullable().or(z.literal('')),
      phone: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      source: z.string().optional().nullable(),
      resumeUrl: z.string().optional().nullable(),
      linkedinUrl: z.string().optional().nullable(),
      currentPosition: z.string().optional().nullable(),
      expectedSalary: z.number().nonnegative().optional().nullable(),
      notes: z.string().optional().nullable(),
    }),
  }),
});

export const updateApplicationSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    stage: z.enum(STAGES).optional(),
    rating: z.number().int().min(1).max(5).optional().nullable(),
    rejectedReason: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const moveStageSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    stage: z.enum(STAGES),
    rejectedReason: z.string().optional().nullable(),
  }),
});

export const updateCandidateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: createApplicationSchema.shape.body.shape.candidate.partial(),
});

// --------------------------- Entrevistas --------------------------

export const createInterviewSchema = z.object({
  params: z.object({ id: z.string().min(1) }), // applicationId
  body: z.object({
    type: z.enum(INTERVIEW_TYPES).default('VIRTUAL'),
    scheduledAt: dateField,
    durationMin: z.number().int().positive().default(45),
    interviewerId: z.string().optional().nullable(),
    interviewerName: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
  }),
});

export const updateInterviewSchema = z.object({
  params: z.object({ id: z.string().min(1) }), // interviewId
  body: z.object({
    type: z.enum(INTERVIEW_TYPES).optional(),
    status: z.enum(INTERVIEW_STATUS).optional(),
    scheduledAt: dateField.optional(),
    durationMin: z.number().int().positive().optional(),
    interviewerId: z.string().optional().nullable(),
    interviewerName: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    score: z.number().int().min(1).max(5).optional().nullable(),
    feedback: z.string().optional().nullable(),
  }),
});

// ---------------------------- Documentos --------------------------

export const addDocumentSchema = z.object({
  params: z.object({ id: z.string().min(1) }), // applicationId
  body: z.object({
    type: z.string().min(1),
    name: z.string().min(1),
    fileUrl: z.string().optional().nullable(),
    required: z.boolean().default(true),
  }),
});

export const updateDocumentSchema = z.object({
  params: z.object({ id: z.string().min(1) }), // documentId
  body: z.object({
    name: z.string().optional(),
    fileUrl: z.string().optional().nullable(),
    verified: z.boolean().optional(),
    notes: z.string().optional().nullable(),
  }),
});

// ------------------------------ Oferta ----------------------------

export const upsertOfferSchema = z.object({
  params: z.object({ id: z.string().min(1) }), // applicationId
  body: z.object({
    modality: z.enum(MODALITIES).default('INDEFINITE'),
    positionTitle: z.string().optional().nullable(),
    baseSalary: z.number().positive('El salario debe ser mayor a cero.'),
    isIntegralSalary: z.boolean().default(false),
    transportAllowance: z.boolean().default(true),
    paymentFrequency: z.enum(FREQUENCIES).default('MONTHLY'),
    startDate: dateField,
    endDate: optionalDate,
    probationDays: z.number().int().min(0).optional().nullable(),
    workScheduleNote: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const offerStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }), // applicationId
  body: z.object({
    status: z.enum(OFFER_STATUS).optional(),
    signedByCandidate: z.boolean().optional(),
    signedDocumentUrl: z.string().optional().nullable(),
  }),
});

// ---------------------------- Onboarding --------------------------

export const addOnboardingTaskSchema = z.object({
  params: z.object({ id: z.string().min(1) }), // applicationId
  body: z.object({
    category: z.string().min(1),
    title: z.string().min(1),
    dueDate: optionalDate,
    responsibleId: z.string().optional().nullable(),
  }),
});

export const updateOnboardingTaskSchema = z.object({
  params: z.object({ id: z.string().min(1) }), // taskId
  body: z.object({
    status: z.enum(ONBOARDING_STATUS).optional(),
    title: z.string().optional(),
    dueDate: optionalDate,
    responsibleId: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const seedOnboardingSchema = z.object({
  params: z.object({ id: z.string().min(1) }), // applicationId
});

// ---------------------------- Contratar ---------------------------

export const hireSchema = z.object({
  params: z.object({ id: z.string().min(1) }), // applicationId
  body: z.object({
    employeeCode: z.string().optional().nullable(),
    departmentId: z.string().optional().nullable(),
    positionId: z.string().optional().nullable(),
    arlRiskClass: z.number().int().min(1).max(5).default(1),
  }),
});

export type CreateVacancyInput = z.infer<typeof createVacancySchema>['body'];
export type UpdateVacancyInput = z.infer<typeof updateVacancySchema>['body'];
export type ListVacanciesQuery = z.infer<typeof listVacanciesSchema>['query'];
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>['body'];
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>['body'];
export type ListApplicationsQuery = z.infer<typeof listApplicationsSchema>['query'];
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>['body'];
export type CreateInterviewInput = z.infer<typeof createInterviewSchema>['body'];
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>['body'];
export type AddDocumentInput = z.infer<typeof addDocumentSchema>['body'];
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>['body'];
export type UpsertOfferInput = z.infer<typeof upsertOfferSchema>['body'];
export type OfferStatusInput = z.infer<typeof offerStatusSchema>['body'];
export type AddOnboardingTaskInput = z.infer<typeof addOnboardingTaskSchema>['body'];
export type UpdateOnboardingTaskInput = z.infer<typeof updateOnboardingTaskSchema>['body'];
export type HireInput = z.infer<typeof hireSchema>['body'];
