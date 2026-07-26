import { Request, Response } from 'express';
import { authService } from './auth.service';
import { ok, created } from '../../core/utils/apiResponse';

export class AuthController {
  register = async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    return created(res, result);
  };

  login = async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    return ok(res, result);
  };

  refresh = async (req: Request, res: Response) => {
    const result = await authService.refresh(req.body.refreshToken);
    return ok(res, result);
  };

  me = async (req: Request, res: Response) => {
    const result = await authService.me(req.auth!.sub);
    return ok(res, result);
  };
}

export const authController = new AuthController();
