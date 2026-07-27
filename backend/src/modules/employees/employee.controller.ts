import { Request, Response } from 'express';
import { employeeService } from './employee.service';
import { created, ok } from '../../core/utils/apiResponse';
import type { Actor } from '../audit/audit.service';

const actorOf = (req: Request): Actor => ({
  userId: req.auth!.sub,
  userName: req.auth!.email,
});

export class EmployeeController {
  list = async (req: Request, res: Response) => {
    const { items, meta } = await employeeService.list(
      req.auth!.organizationId,
      req.query as never,
    );
    return ok(res, items, meta);
  };

  getById = async (req: Request, res: Response) => {
    const employee = await employeeService.getById(req.params.id, req.auth!.organizationId);
    return ok(res, employee);
  };

  getByDocument = async (req: Request, res: Response) => {
    const employee = await employeeService.getByDocument(
      req.params.documentNumber,
      req.auth!.organizationId,
    );
    return ok(res, employee);
  };

  create = async (req: Request, res: Response) => {
    const employee = await employeeService.create(req.auth!.organizationId, req.body, actorOf(req));
    return created(res, employee);
  };

  update = async (req: Request, res: Response) => {
    const employee = await employeeService.update(
      req.params.id,
      req.auth!.organizationId,
      req.body,
      actorOf(req),
    );
    return ok(res, employee);
  };

  remove = async (req: Request, res: Response) => {
    const result = await employeeService.remove(
      req.params.id,
      req.auth!.organizationId,
      actorOf(req),
    );
    return ok(res, result);
  };

  orgChart = async (req: Request, res: Response) => {
    const data = await employeeService.orgChart(req.auth!.organizationId);
    return ok(res, data);
  };

  exportAll = async (req: Request, res: Response) => {
    const data = await employeeService.exportAll(req.auth!.organizationId);
    return ok(res, data);
  };
}

export const employeeController = new EmployeeController();
