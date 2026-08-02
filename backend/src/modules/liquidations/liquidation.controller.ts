import { Request, Response } from 'express';
import { liquidationService } from './liquidation.service';
import { ok, created } from '../../core/utils/apiResponse';
import type { Actor } from '../audit/audit.service';

const actorOf = (req: Request): Actor => ({ userId: req.auth!.sub, userName: req.auth!.email });
const orgOf = (req: Request) => req.auth!.organizationId;

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
