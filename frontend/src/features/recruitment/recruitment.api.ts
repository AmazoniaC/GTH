import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/features/auth/auth.store';

export type ContractModality = 'INDEFINITE' | 'FIXED_TERM' | 'WORK_OR_LABOR' | 'LEARNING' | 'OCCASIONAL';
export type WorkMode = 'ONSITE' | 'REMOTE' | 'HYBRID';
export type VacancyStatus = 'DRAFT' | 'OPEN' | 'PAUSED' | 'CLOSED' | 'FILLED' | 'CANCELLED';
export type ApplicationStage =
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'TECHNICAL_TEST'
  | 'OFFER'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';
export type InterviewType = 'PHONE' | 'VIRTUAL' | 'IN_PERSON' | 'TECHNICAL';
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type OfferStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type OnboardingStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'NA';

export interface Vacancy {
  id: string;
  code?: string | null;
  title: string;
  departmentId?: string | null;
  positionId?: string | null;
  description?: string | null;
  requirements?: string | null;
  modality: ContractModality;
  workMode: WorkMode;
  location?: string | null;
  salaryMin: number;
  salaryMax: number;
  openings: number;
  status: VacancyStatus;
  hiringManager?: string | null;
  notes?: string | null;
  createdAt: string;
  applicationsCount?: number;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  source?: string | null;
  resumeUrl?: string | null;
  linkedinUrl?: string | null;
  currentPosition?: string | null;
  expectedSalary?: number | null;
  notes?: string | null;
}

export interface Interview {
  id: string;
  type: InterviewType;
  status: InterviewStatus;
  scheduledAt: string;
  durationMin: number;
  interviewerName?: string | null;
  location?: string | null;
  score?: number | null;
  feedback?: string | null;
}

export interface ApplicationDocument {
  id: string;
  type: string;
  name: string;
  fileUrl?: string | null;
  required: boolean;
  verified: boolean;
  verifiedAt?: string | null;
  notes?: string | null;
}

export interface JobOffer {
  id: string;
  modality: ContractModality;
  positionTitle?: string | null;
  baseSalary: number;
  isIntegralSalary: boolean;
  transportAllowance: boolean;
  paymentFrequency: 'MONTHLY' | 'BIWEEKLY';
  startDate: string;
  endDate?: string | null;
  probationDays?: number | null;
  workScheduleNote?: string | null;
  status: OfferStatus;
  signedByCandidate: boolean;
  signedAt?: string | null;
  signedDocumentUrl?: string | null;
}

export interface OnboardingTask {
  id: string;
  category: string;
  title: string;
  status: OnboardingStatus;
  dueDate?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  order: number;
}

export interface Application {
  id: string;
  stage: ApplicationStage;
  rating?: number | null;
  rejectedReason?: string | null;
  hiredEmployeeId?: string | null;
  notes?: string | null;
  appliedAt: string;
  candidate: Candidate;
  vacancy: { id: string; title: string; code?: string | null; modality?: ContractModality };
  interviews: Interview[];
  documents: ApplicationDocument[];
  offer: JobOffer | null;
  onboardingTasks: OnboardingTask[];
  _count?: { interviews: number; documents: number };
}

export interface VacancyDetail extends Vacancy {
  applications: {
    id: string;
    stage: ApplicationStage;
    rating?: number | null;
    candidate: { id: string; firstName: string; lastName: string; email?: string | null; phone?: string | null };
    _count?: { interviews: number };
  }[];
}

export interface RecruitmentCatalog {
  modalities: { code: ContractModality; label: string; isDefault?: boolean; requiresEndDate?: boolean; note: string }[];
  documentTypes: { code: string; label: string; required: boolean }[];
  onboardingCategories: { code: string; label: string }[];
  onboardingTemplate: { category: string; title: string }[];
}

export interface RecruitmentSummary {
  openVacancies: number;
  totalVacancies: number;
  byStage: Record<string, number>;
  upcomingInterviews: number;
}

const unwrap = <T,>(p: Promise<{ data: { data: T } }>) => p.then((r) => r.data.data);

// ------------------------------ Catálogo/resumen ------------------------------

export function useRecruitmentCatalog() {
  return useQuery({
    queryKey: ['recruitment', 'catalog'],
    queryFn: () => unwrap(api.get<{ data: RecruitmentCatalog }>('/recruitment/catalog')),
    staleTime: Infinity,
  });
}

export interface HiringOrigin {
  applicationId: string;
  vacancyId: string;
  vacancyCode?: string | null;
  vacancyTitle: string;
  hiredAt: string;
}

/**
 * Origen de contratación de un empleado (de qué vacante salió). Solo consulta
 * si la empresa tiene activo el módulo de Contratación.
 */
export function useEmployeeHiringOrigin(employeeId?: string) {
  const modules = useAuthStore((s) => s.user?.modules);
  const enabled = !!employeeId && !!modules?.includes('RECRUITMENT');
  return useQuery({
    queryKey: ['recruitment', 'origin', employeeId],
    queryFn: () => unwrap(api.get<{ data: HiringOrigin | null }>(`/recruitment/origin/${employeeId}`)),
    enabled,
  });
}

export function useRecruitmentSummary() {
  return useQuery({
    queryKey: ['recruitment', 'summary'],
    queryFn: () => unwrap(api.get<{ data: RecruitmentSummary }>('/recruitment/summary')),
  });
}

// ------------------------------ Vacantes ------------------------------

export function useVacancies(filters: { status?: VacancyStatus; search?: string } = {}) {
  return useQuery({
    queryKey: ['recruitment', 'vacancies', filters],
    queryFn: () => unwrap(api.get<{ data: Vacancy[] }>('/recruitment/vacancies', { params: filters })),
  });
}

export function useVacancy(id: string) {
  return useQuery({
    queryKey: ['recruitment', 'vacancy', id],
    queryFn: () => unwrap(api.get<{ data: VacancyDetail }>(`/recruitment/vacancies/${id}`)),
    enabled: !!id,
  });
}

export function useCreateVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => unwrap(api.post('/recruitment/vacancies', payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

export function useUpdateVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      unwrap(api.patch(`/recruitment/vacancies/${id}`, body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

export function useDeleteVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/recruitment/vacancies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

// ------------------------------ Postulaciones ------------------------------

export function useApplication(id: string) {
  return useQuery({
    queryKey: ['recruitment', 'application', id],
    queryFn: () => unwrap(api.get<{ data: Application }>(`/recruitment/applications/${id}`)),
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => unwrap(api.post('/recruitment/applications', payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

export function useMoveStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage, rejectedReason }: { id: string; stage: ApplicationStage; rejectedReason?: string }) =>
      unwrap(api.patch(`/recruitment/applications/${id}/stage`, { stage, rejectedReason })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      unwrap(api.patch(`/recruitment/applications/${id}`, body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/recruitment/applications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

export function useHire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      unwrap(api.post(`/recruitment/applications/${id}/hire`, body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

// ------------------------------ Entrevistas ------------------------------

export function useAddInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      unwrap(api.post(`/recruitment/applications/${id}/interviews`, body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

export function useUpdateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      unwrap(api.patch(`/recruitment/interviews/${id}`, body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

export function useDeleteInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/recruitment/interviews/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

// ------------------------------ Documentos ------------------------------

export function useSeedDocuments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) =>
      unwrap(api.post(`/recruitment/applications/${applicationId}/documents/seed`, {})),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

export function useAddDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      unwrap(api.post(`/recruitment/applications/${id}/documents`, body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      unwrap(api.patch(`/recruitment/documents/${id}`, body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/recruitment/documents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

// ------------------------------ Oferta ------------------------------

export function useUpsertOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      unwrap(api.put(`/recruitment/applications/${id}/offer`, body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

/** Descarga el PDF del contrato de trabajo (con membrete) de una postulación. */
export async function downloadContractPdf(applicationId: string, fileName = 'Contrato.pdf') {
  const res = await api.get(`/recruitment/applications/${applicationId}/contract.pdf`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function useUpdateOfferStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      unwrap(api.patch(`/recruitment/applications/${id}/offer/status`, body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

// ------------------------------ Onboarding ------------------------------

export function useSeedOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) =>
      unwrap(api.post(`/recruitment/applications/${applicationId}/onboarding/seed`, {})),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

export function useUpdateOnboardingTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      unwrap(api.patch(`/recruitment/onboarding/${id}`, body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment'] }),
  });
}

// ------------------------------ Etiquetas ------------------------------

export const STAGE_LABELS: Record<ApplicationStage, string> = {
  APPLIED: 'Postulado',
  SCREENING: 'Preselección',
  INTERVIEW: 'Entrevista',
  TECHNICAL_TEST: 'Prueba técnica',
  OFFER: 'Oferta',
  HIRED: 'Contratado',
  REJECTED: 'Descartado',
  WITHDRAWN: 'Retirado',
};

/** Etapas que forman el embudo activo (para el tablero). */
export const PIPELINE_STAGES: ApplicationStage[] = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'TECHNICAL_TEST',
  'OFFER',
  'HIRED',
];

export const VACANCY_STATUS_LABELS: Record<VacancyStatus, string> = {
  DRAFT: 'Borrador',
  OPEN: 'Abierta',
  PAUSED: 'En pausa',
  CLOSED: 'Cerrada',
  FILLED: 'Cubierta',
  CANCELLED: 'Cancelada',
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  ONSITE: 'Presencial',
  REMOTE: 'Remoto',
  HYBRID: 'Híbrido',
};

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  PHONE: 'Telefónica',
  VIRTUAL: 'Virtual',
  IN_PERSON: 'Presencial',
  TECHNICAL: 'Técnica',
};
