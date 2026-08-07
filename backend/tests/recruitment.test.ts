import { describe, it, expect } from 'vitest';
import {
  CONTRACT_MODALITIES,
  MAX_PROBATION_DAYS,
  isProbationValid,
  suggestedProbationDays,
} from '../src/config/recruitment';

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

describe('CONTRACT_MODALITIES', () => {
  it('el término indefinido es la modalidad por defecto (Ley 2466/2025)', () => {
    const def = CONTRACT_MODALITIES.filter((m) => m.isDefault);
    expect(def).toHaveLength(1);
    expect(def[0].code).toBe('INDEFINITE');
  });

  it('término fijo y ocasional requieren fecha de finalización', () => {
    expect(CONTRACT_MODALITIES.find((m) => m.code === 'FIXED_TERM')?.requiresEndDate).toBe(true);
    expect(CONTRACT_MODALITIES.find((m) => m.code === 'OCCASIONAL')?.requiresEndDate).toBe(true);
  });
});

describe('suggestedProbationDays', () => {
  it('indefinido sugiere el máximo legal de 2 meses', () => {
    expect(suggestedProbationDays('INDEFINITE', utc(2026, 1, 1))).toBe(MAX_PROBATION_DAYS);
  });

  it('fijo inferior a 1 año usa 1/5 del término', () => {
    // 6 meses ≈ 181 días → 1/5 ≈ 36 días.
    const days = suggestedProbationDays('FIXED_TERM', utc(2026, 1, 1), utc(2026, 7, 1));
    expect(days).toBe(Math.round(181 / 5));
  });

  it('fijo de 1 año o más se topa en 2 meses', () => {
    expect(suggestedProbationDays('FIXED_TERM', utc(2026, 1, 1), utc(2027, 1, 1))).toBe(
      MAX_PROBATION_DAYS,
    );
  });

  it('el contrato de aprendizaje no tiene período de prueba', () => {
    expect(suggestedProbationDays('LEARNING', utc(2026, 1, 1))).toBe(0);
  });
});

describe('isProbationValid', () => {
  it('rechaza períodos que exceden 2 meses en indefinido', () => {
    expect(isProbationValid('INDEFINITE', 61, utc(2026, 1, 1))).toBe(false);
    expect(isProbationValid('INDEFINITE', 60, utc(2026, 1, 1))).toBe(true);
  });

  it('rechaza períodos mayores a 1/5 del término en fijos cortos', () => {
    // 6 meses → máximo ≈ 36 días.
    expect(isProbationValid('FIXED_TERM', 45, utc(2026, 1, 1), utc(2026, 7, 1))).toBe(false);
    expect(isProbationValid('FIXED_TERM', 30, utc(2026, 1, 1), utc(2026, 7, 1))).toBe(true);
  });

  it('no admite períodos negativos', () => {
    expect(isProbationValid('INDEFINITE', -1, utc(2026, 1, 1))).toBe(false);
  });
});
