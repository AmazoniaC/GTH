import { Request, Response } from 'express';
import { noveltyService } from './novelty.service';
import { ok, created } from '../../core/utils/apiResponse';
import type { Actor } from '../audit/audit.service';

import { actorOf, orgOf } from '../../core/utils/request';

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
