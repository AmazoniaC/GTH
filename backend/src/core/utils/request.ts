import { Request } from 'express';
import type { Actor } from '../../modules/audit/audit.service';

/**
 * Helpers de contexto de la petición autenticada. Evitan repetir la
 * extracción de `organizationId` y del actor de auditoría en cada controlador.
 * Deben usarse tras el middleware `authenticate` (que rellena `req.auth`).
 */

/** Empresa (tenant) del usuario autenticado. */
export const orgOf = (req: Request): string => req.auth!.organizationId;

/** Actor para la bitácora de auditoría. */
export const actorOf = (req: Request): Actor => ({
  userId: req.auth!.sub,
  userName: req.auth!.email,
});
