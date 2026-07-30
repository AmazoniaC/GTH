import { Request, Response } from 'express';
import { absenceService } from './absence.service';
import { ok, created } from '../../core/utils/apiResponse';
import type { Actor } from '../audit/audit.service';

const actorOf = (req: Request): Actor => ({ userId: req.auth!.sub, userName: req.auth!.email });
const orgOf = (req: Request) => req.auth!.organizationId;

export class AbsenceController {
  list = async (req: Request, res: Response) =>
    ok(res, await absenceService.list(orgOf(req), req.query as never));

  getById = async (req: Request, res: Response) =>
    ok(res, await absenceService.getById(req.params.id, orgOf(req)));

  create = async (req: Request, res: Response) =>
    created(res, await absenceService.create(orgOf(req), req.body, actorOf(req)));

  update = async (req: Request, res: Response) =>
    ok(res, await absenceService.update(req.params.id, orgOf(req), req.body, actorOf(req)));

  remove = async (req: Request, res: Response) =>
    ok(res, await absenceService.remove(req.params.id, orgOf(req), actorOf(req)));

  balance = async (req: Request, res: Response) =>
    ok(res, await absenceService.vacationBalance(req.params.employeeId, orgOf(req)));

  addAdjustment = async (req: Request, res: Response) =>
    created(res, await absenceService.addAdjustment(orgOf(req), req.body, actorOf(req)));

  approvals = async (req: Request, res: Response) =>
    ok(res, await absenceService.listApprovals(orgOf(req), req.auth!.sub, true));

  pendingCount = async (req: Request, res: Response) =>
    ok(res, { pending: await absenceService.pendingCount(orgOf(req)) });

  review = async (req: Request, res: Response) =>
    ok(
      res,
      await absenceService.review(req.params.id, orgOf(req), {
        reviewerUserId: req.auth!.sub,
        canApproveAll: true,
        decision: req.body.decision,
        note: req.body.note,
      }),
    );
}

export const absenceController = new AbsenceController();
