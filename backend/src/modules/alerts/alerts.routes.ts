import { Router } from 'express';
import { alertsService } from './alerts.service';
import { authenticate } from '../../core/middlewares/auth.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ok } from '../../core/utils/apiResponse';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => ok(res, await alertsService.getAlerts(req.auth!.organizationId))),
);

export const alertsRoutes = router;
