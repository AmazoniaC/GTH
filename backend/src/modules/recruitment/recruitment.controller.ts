import { Request, Response } from 'express';
import { recruitmentService } from './recruitment.service';
import { ok, created } from '../../core/utils/apiResponse';
import type { Actor } from '../audit/audit.service';

import { actorOf, orgOf } from '../../core/utils/request';

export class RecruitmentController {
  // Catálogo y resumen
  catalog = async (_req: Request, res: Response) => ok(res, recruitmentService.catalog());
  summary = async (req: Request, res: Response) => ok(res, await recruitmentService.summary(orgOf(req)));

  // Vacantes
  listVacancies = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.listVacancies(orgOf(req), req.query as never));
  getVacancy = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.getVacancy(req.params.id, orgOf(req)));
  createVacancy = async (req: Request, res: Response) =>
    created(res, await recruitmentService.createVacancy(orgOf(req), req.body, actorOf(req)));
  updateVacancy = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.updateVacancy(req.params.id, orgOf(req), req.body, actorOf(req)));
  deleteVacancy = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.deleteVacancy(req.params.id, orgOf(req), actorOf(req)));

  // Postulaciones / candidatos
  listApplications = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.listApplications(orgOf(req), req.query as never));
  getApplication = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.getApplication(req.params.id, orgOf(req)));
  createApplication = async (req: Request, res: Response) =>
    created(res, await recruitmentService.createApplication(orgOf(req), req.body, actorOf(req)));
  updateApplication = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.updateApplication(req.params.id, orgOf(req), req.body, actorOf(req)));
  moveStage = async (req: Request, res: Response) =>
    ok(
      res,
      await recruitmentService.moveStage(
        req.params.id,
        orgOf(req),
        req.body.stage,
        req.body.rejectedReason,
        actorOf(req),
      ),
    );
  updateCandidate = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.updateCandidate(req.params.id, orgOf(req), req.body, actorOf(req)));
  deleteApplication = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.deleteApplication(req.params.id, orgOf(req), actorOf(req)));

  // Entrevistas
  addInterview = async (req: Request, res: Response) =>
    created(res, await recruitmentService.addInterview(req.params.id, orgOf(req), req.body, actorOf(req)));
  updateInterview = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.updateInterview(req.params.id, orgOf(req), req.body, actorOf(req)));
  deleteInterview = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.deleteInterview(req.params.id, orgOf(req), actorOf(req)));

  // Documentos
  seedDocuments = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.seedRequiredDocuments(req.params.id, orgOf(req)));
  addDocument = async (req: Request, res: Response) =>
    created(res, await recruitmentService.addDocument(req.params.id, orgOf(req), req.body, actorOf(req)));
  updateDocument = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.updateDocument(req.params.id, orgOf(req), req.body, actorOf(req)));
  deleteDocument = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.deleteDocument(req.params.id, orgOf(req), actorOf(req)));

  // Oferta
  upsertOffer = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.upsertOffer(req.params.id, orgOf(req), req.body, actorOf(req)));
  updateOfferStatus = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.updateOfferStatus(req.params.id, orgOf(req), req.body, actorOf(req)));

  // Onboarding
  seedOnboarding = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.seedOnboarding(req.params.id, orgOf(req)));
  addOnboardingTask = async (req: Request, res: Response) =>
    created(res, await recruitmentService.addOnboardingTask(req.params.id, orgOf(req), req.body, actorOf(req)));
  updateOnboardingTask = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.updateOnboardingTask(req.params.id, orgOf(req), req.body, actorOf(req)));
  deleteOnboardingTask = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.deleteOnboardingTask(req.params.id, orgOf(req), actorOf(req)));

  // Contratar
  hire = async (req: Request, res: Response) =>
    created(res, await recruitmentService.hire(req.params.id, orgOf(req), req.body, actorOf(req)));

  // Trazabilidad: origen de contratación de un empleado
  originForEmployee = async (req: Request, res: Response) =>
    ok(res, await recruitmentService.originForEmployee(req.params.id, orgOf(req)));
}

export const recruitmentController = new RecruitmentController();
