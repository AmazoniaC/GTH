import { Request, Response } from 'express';
import { documentService } from './document.service';
import { created, ok } from '../../core/utils/apiResponse';

export class DocumentController {
  list = async (req: Request, res: Response) => {
    const docs = await documentService.list(
      req.query.employeeId as string,
      req.auth!.organizationId,
    );
    return ok(res, docs);
  };

  create = async (req: Request, res: Response) => {
    const doc = await documentService.create(req.auth!.organizationId, req.body);
    return created(res, doc);
  };

  download = async (req: Request, res: Response) => {
    const doc = await documentService.getWithContent(req.params.id, req.auth!.organizationId);
    return ok(res, doc);
  };

  remove = async (req: Request, res: Response) => {
    const result = await documentService.remove(req.params.id, req.auth!.organizationId);
    return ok(res, result);
  };
}

export const documentController = new DocumentController();
