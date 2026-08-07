/**
 * Utilidades matemáticas puras (sin dependencias de infraestructura).
 *
 * Se mantienen aparte de `decimal.ts` para que los motores de cálculo puros
 * (nómina, liquidación) las usen sin arrastrar `@prisma/client`.
 */

/** Redondea al entero más cercano (pesos). */
export const round = (n: number): number => Math.round(n);

/** Redondea a dos decimales. */
export const round2 = (n: number): number => Math.round(n * 100) / 100;
