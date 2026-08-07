import { Request, Response } from 'express';
import { certificateService } from './certificate.service';
import { ok, created } from '../../core/utils/apiResponse';
import type { Actor } from '../audit/audit.service';

import { actorOf, orgOf } from '../../core/utils/request';

export class CertificateController {
  variables = async (_req: Request, res: Response) => ok(res, certificateService.variables());

  listTemplates = async (req: Request, res: Response) =>
    ok(res, await certificateService.listTemplates(orgOf(req)));

  createTemplate = async (req: Request, res: Response) =>
    created(res, await certificateService.createTemplate(orgOf(req), req.body, actorOf(req)));

  updateTemplate = async (req: Request, res: Response) =>
    ok(res, await certificateService.updateTemplate(req.params.id, orgOf(req), req.body, actorOf(req)));

  removeTemplate = async (req: Request, res: Response) =>
    ok(res, await certificateService.removeTemplate(req.params.id, orgOf(req), actorOf(req)));

  render = async (req: Request, res: Response) =>
    ok(res, await certificateService.render(orgOf(req), req.body, actorOf(req)));
}

export const certificateController = new CertificateController();
