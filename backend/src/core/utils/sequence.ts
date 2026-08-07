import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

/** Prefijos de los consecutivos por serie de documento. */
const PREFIX: Record<string, string> = {
  LIQUIDATION: 'LIQ',
  PAYSLIP: 'NOM',
  DOCUMENT: 'DOC',
  VACANCY: 'VAC',
};

export function formatDocNumber(series: string, n: number): string {
  return `${PREFIX[series] ?? 'DOC'}-${String(n).padStart(6, '0')}`;
}

type Client = Prisma.TransactionClient | typeof prisma;

/**
 * Reserva un bloque de `count` consecutivos para una serie de la empresa y
 * devuelve el primer número reservado. Incrementa el contador de forma
 * atómica (una sola escritura), de modo que sirve tanto para uno como para
 * generaciones masivas.
 */
export async function reserveNumbers(
  organizationId: string,
  series: string,
  count = 1,
  client: Client = prisma,
): Promise<number> {
  const row = await client.documentSequence.upsert({
    where: { organizationId_series: { organizationId, series } },
    create: { organizationId, series, current: count },
    update: { current: { increment: count } },
  });
  return row.current - count + 1;
}

/** Reserva un único número y lo devuelve ya formateado. */
export async function nextDocNumber(
  organizationId: string,
  series: string,
  client: Client = prisma,
): Promise<string> {
  const n = await reserveNumbers(organizationId, series, 1, client);
  return formatDocNumber(series, n);
}
