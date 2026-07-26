import { Request, Response } from 'express';
import { contractService } from './contract.service';
import { created, ok } from '../../core/utils/apiResponse';

export class ContractController {
  list = async (req: Request, res: Response) => {
    const data = await contractService.listContracts(
      req.params.employeeId,
      req.auth!.organizationId,
    );
    return ok(res, data);
  };

  add = async (req: Request, res: Response) => {
    const data = await contractService.addContract(
      req.params.employeeId,
      req.auth!.organizationId,
      req.body,
    );
    return created(res, data);
  };

  update = async (req: Request, res: Response) => {
    const data = await contractService.updateContract(
      req.params.id,
      req.auth!.organizationId,
      req.body,
    );
    return ok(res, data);
  };

  remove = async (req: Request, res: Response) => {
    const data = await contractService.deleteContract(req.params.id, req.auth!.organizationId);
    return ok(res, data);
  };

  salaryHistory = async (req: Request, res: Response) => {
    const data = await contractService.listSalaryChanges(
      req.params.employeeId,
      req.auth!.organizationId,
    );
    return ok(res, data);
  };

  addSalaryChange = async (req: Request, res: Response) => {
    const data = await contractService.addSalaryChange(
      req.params.employeeId,
      req.auth!.organizationId,
      req.body,
    );
    return created(res, data);
  };
}

export const contractController = new ContractController();
