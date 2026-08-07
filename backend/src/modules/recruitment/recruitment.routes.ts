import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { recruitmentController } from './recruitment.controller';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { requireModule } from '../../core/middlewares/module.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import {
  addDocumentSchema,
  addOnboardingTaskSchema,
  createApplicationSchema,
  createInterviewSchema,
  createVacancySchema,
  hireSchema,
  idParam,
  listApplicationsSchema,
  listVacanciesSchema,
  moveStageSchema,
  offerStatusSchema,
  seedOnboardingSchema,
  updateApplicationSchema,
  updateCandidateSchema,
  updateDocumentSchema,
  updateInterviewSchema,
  updateOnboardingTaskSchema,
  updateVacancySchema,
  upsertOfferSchema,
} from './recruitment.schema';

const router = Router();
router.use(authenticate);
router.use(requireModule('RECRUITMENT'));

// La gestión de contratación está reservada a RRHH y administradores.
const managers = [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.SUPER_ADMIN];
router.use(authorize(...managers));

// Catálogo y resumen
router.get('/catalog', asyncHandler(recruitmentController.catalog));
router.get('/summary', asyncHandler(recruitmentController.summary));

// Vacantes
router.get('/vacancies', validate(listVacanciesSchema), asyncHandler(recruitmentController.listVacancies));
router.post('/vacancies', validate(createVacancySchema), asyncHandler(recruitmentController.createVacancy));
router.get('/vacancies/:id', validate(idParam), asyncHandler(recruitmentController.getVacancy));
router.patch('/vacancies/:id', validate(updateVacancySchema), asyncHandler(recruitmentController.updateVacancy));
router.delete('/vacancies/:id', validate(idParam), asyncHandler(recruitmentController.deleteVacancy));

// Postulaciones
router.get('/applications', validate(listApplicationsSchema), asyncHandler(recruitmentController.listApplications));
router.post('/applications', validate(createApplicationSchema), asyncHandler(recruitmentController.createApplication));
router.get('/applications/:id', validate(idParam), asyncHandler(recruitmentController.getApplication));
router.patch('/applications/:id', validate(updateApplicationSchema), asyncHandler(recruitmentController.updateApplication));
router.patch('/applications/:id/stage', validate(moveStageSchema), asyncHandler(recruitmentController.moveStage));
router.delete('/applications/:id', validate(idParam), asyncHandler(recruitmentController.deleteApplication));
router.post('/applications/:id/hire', validate(hireSchema), asyncHandler(recruitmentController.hire));

// Candidato (datos de la persona)
router.patch('/candidates/:id', validate(updateCandidateSchema), asyncHandler(recruitmentController.updateCandidate));

// Entrevistas (:id = applicationId al crear; interviewId al editar/eliminar)
router.post('/applications/:id/interviews', validate(createInterviewSchema), asyncHandler(recruitmentController.addInterview));
router.patch('/interviews/:id', validate(updateInterviewSchema), asyncHandler(recruitmentController.updateInterview));
router.delete('/interviews/:id', validate(idParam), asyncHandler(recruitmentController.deleteInterview));

// Documentos
router.post('/applications/:id/documents/seed', validate(idParam), asyncHandler(recruitmentController.seedDocuments));
router.post('/applications/:id/documents', validate(addDocumentSchema), asyncHandler(recruitmentController.addDocument));
router.patch('/documents/:id', validate(updateDocumentSchema), asyncHandler(recruitmentController.updateDocument));
router.delete('/documents/:id', validate(idParam), asyncHandler(recruitmentController.deleteDocument));

// Oferta / contrato
router.put('/applications/:id/offer', validate(upsertOfferSchema), asyncHandler(recruitmentController.upsertOffer));
router.patch('/applications/:id/offer/status', validate(offerStatusSchema), asyncHandler(recruitmentController.updateOfferStatus));

// Onboarding
router.post('/applications/:id/onboarding/seed', validate(seedOnboardingSchema), asyncHandler(recruitmentController.seedOnboarding));
router.post('/applications/:id/onboarding', validate(addOnboardingTaskSchema), asyncHandler(recruitmentController.addOnboardingTask));
router.patch('/onboarding/:id', validate(updateOnboardingTaskSchema), asyncHandler(recruitmentController.updateOnboardingTask));
router.delete('/onboarding/:id', validate(idParam), asyncHandler(recruitmentController.deleteOnboardingTask));

export const recruitmentRoutes = router;
