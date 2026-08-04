import { Request, Response } from 'express';
import { payrollService } from './payroll.service';
import { created, ok } from '../../core/utils/apiResponse';

export class PayrollController {
  // --- Configuración ---
  getConfig = async (req: Request, res: Response) => {
    const year = Number(req.query.year) || new Date().getFullYear();
    const config = await payrollService.getConfig(req.auth!.organizationId, year);
    return ok(res, config);
  };

  upsertConfig = async (req: Request, res: Response) => {
    const config = await payrollService.upsertConfig(req.auth!.organizationId, req.body);
    return ok(res, config);
  };

  // --- Simulador ---
  simulate = async (req: Request, res: Response) => {
    const result = await payrollService.simulate(req.auth!.organizationId, req.body);
    return ok(res, result);
  };

  // --- Periodos ---
  listPeriods = async (req: Request, res: Response) => {
    const year = req.query.year ? Number(req.query.year) : undefined;
    const status = req.query.status as string | undefined;
    const periods = await payrollService.listPeriods(req.auth!.organizationId, { year, status });
    return ok(res, periods);
  };

  getPeriod = async (req: Request, res: Response) => {
    const period = await payrollService.getPeriod(req.params.id, req.auth!.organizationId);
    return ok(res, period);
  };

  createPeriod = async (req: Request, res: Response) => {
    const period = await payrollService.createPeriod(req.auth!.organizationId, req.body);
    return created(res, period);
  };

  updatePeriodStatus = async (req: Request, res: Response) => {
    const period = await payrollService.updatePeriodStatus(
      req.params.id,
      req.auth!.organizationId,
      req.body.status,
    );
    return ok(res, period);
  };

  deletePeriod = async (req: Request, res: Response) => {
    const result = await payrollService.deletePeriod(req.params.id, req.auth!.organizationId);
    return ok(res, result);
  };

  periodForPrint = async (req: Request, res: Response) => {
    const data = await payrollService.periodForPrint(req.params.id, req.auth!.organizationId);
    return ok(res, data);
  };

  // --- Desprendible ---
  getPayslip = async (req: Request, res: Response) => {
    const payslip = await payrollService.getPayslip(req.params.id, req.auth!.organizationId);
    return ok(res, payslip);
  };
}

export const payrollController = new PayrollController();
