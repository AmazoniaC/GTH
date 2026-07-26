import { Request, Response } from 'express';
import { userService } from './user.service';
import { created, ok } from '../../core/utils/apiResponse';

export class UserController {
  list = async (req: Request, res: Response) => {
    const users = await userService.list(req.auth!.organizationId);
    return ok(res, users);
  };

  create = async (req: Request, res: Response) => {
    const user = await userService.create(req.auth!.organizationId, req.body);
    return created(res, user);
  };

  update = async (req: Request, res: Response) => {
    const user = await userService.update(req.params.id, req.auth!.organizationId, req.body);
    return ok(res, user);
  };

  remove = async (req: Request, res: Response) => {
    const result = await userService.remove(
      req.params.id,
      req.auth!.organizationId,
      req.auth!.sub,
    );
    return ok(res, result);
  };

  updateProfile = async (req: Request, res: Response) => {
    const user = await userService.updateProfile(req.auth!.sub, req.body);
    return ok(res, user);
  };
}

export const userController = new UserController();
