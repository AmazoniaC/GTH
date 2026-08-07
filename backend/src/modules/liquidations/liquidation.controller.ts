import { Request, Response } from 'express';
import { liquidationService } from './liquidation.service';
import { ok, created } from '../../core/utils/apiResponse';
import type { Actor } from '../audit/audit.service';

import { actorOf, orgOf } from '../../core/utils/request';

export class LiquidationController {
  reasons = async (_req: Request, res: Response) => ok(res, liquidationService.reasons());

  compute = async (req: Request, res: Response) =>
    ok(res, await liquidationService.compute(orgOf(req), req.body));

  create = async (req: Request, res: Response) =>
    created(res, await liquidationService.create(orgOf(req), req.body, actorOf(req)));

  list = async (req: Request, res: Response) => ok(res, await liquidationService.list(orgOf(req)));

  getById = async (req: Request, res: Response) =>
    ok(res, await liquidationService.getById(req.params.id, orgOf(req)));

  remove = async (req: Request, res: Response) =>
    ok(res, await liquidationService.remove(req.params.id, orgOf(req), actorOf(req)));
}

export const liquidationController = new LiquidationController();
