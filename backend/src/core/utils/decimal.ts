import { Prisma } from '@prisma/client';

/** Valor numérico que puede llegar como Decimal de Prisma, número o nulo. */
export type Numeric = Prisma.Decimal | number | null | undefined;

/**
 * Convierte un valor Decimal/number/null a `number` de forma segura.
 *
 * Única implementación en la app (antes se repetía en cada servicio). Es
 * null-safe: un valor ausente devuelve 0 en lugar de lanzar error.
 */
export const toNumber = (d: Numeric): number =>
  d == null ? 0 : typeof d === 'number' ? d : Number(d.toString());
