import { Request, Response } from 'express';
import { noveltyService } from './novelty.service';
import { ok, created } from '../../core/utils/apiResponse';
import type { Actor } from '../audit/audit.service';

const actorOf = (req: Request): Actor => ({ userId: req.auth!.sub, userName: req.auth!.email });
const orgOf = (req: Request) => req.auth!.organizationId;

export class NoveltyController {
  catalog = async (_req: Request, res: Response) => ok(res, noveltyService.catalog());

  list = async (req: Request, res: Response) =>
    ok(res, await noveltyService.list(orgOf(req), req.query as never));

  create = async (req: Request, res: Response) =>
    created(res, await noveltyService.create(orgOf(req), req.body, actorOf(req)));

  update = async (req: Request, res: Response) =>
    ok(res, await noveltyService.update(req.params.id, orgOf(req), req.body, actorOf(req)));

  remove = async (req: Request, res: Response) =>
    ok(res, await noveltyService.remove(req.params.id, orgOf(req), actorOf(req)));
}

export const noveltyController = new NoveltyController();
