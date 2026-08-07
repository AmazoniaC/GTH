import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { toNumber } from '../src/core/utils/decimal';

describe('toNumber', () => {
  it('devuelve el número tal cual', () => {
    expect(toNumber(1500)).toBe(1500);
    expect(toNumber(0)).toBe(0);
  });

  it('convierte un Decimal de Prisma', () => {
    expect(toNumber(new Prisma.Decimal('1234.56'))).toBe(1234.56);
  });

  it('es null-safe: null/undefined devuelven 0 (no lanza)', () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
  });
});
