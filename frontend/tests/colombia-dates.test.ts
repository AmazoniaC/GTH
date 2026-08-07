import { describe, it, expect } from 'vitest';
import {
  countBusinessDays,
  countCalendarDays,
  previewAbsenceDays,
} from '../src/lib/colombia-dates';

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

describe('countCalendarDays', () => {
  it('cuenta días inclusivos', () => {
    expect(countCalendarDays(utc(2024, 1, 1), utc(2024, 1, 31))).toBe(31);
  });

  it('rango invertido cuenta cero', () => {
    expect(countCalendarDays(utc(2024, 2, 1), utc(2024, 1, 1))).toBe(0);
  });
});

describe('countBusinessDays', () => {
  it('excluye fines de semana', () => {
    expect(countBusinessDays(utc(2025, 1, 13), utc(2025, 1, 17))).toBe(5);
  });

  it('excluye festivos colombianos', () => {
    // Lunes 6 de enero 2025 es festivo (Reyes).
    expect(countBusinessDays(utc(2025, 1, 6), utc(2025, 1, 10))).toBe(4);
  });
});

describe('previewAbsenceDays', () => {
  it('cuenta días hábiles de una ausencia', () => {
    expect(previewAbsenceDays('2025-01-13', '2025-01-17', 'BUSINESS')).toBe(5);
  });

  it('cuenta días calendario de una ausencia', () => {
    expect(previewAbsenceDays('2025-01-01', '2025-01-31', 'CALENDAR')).toBe(31);
  });

  it('devuelve cero con fechas vacías o invertidas', () => {
    expect(previewAbsenceDays('', '2025-01-10', 'BUSINESS')).toBe(0);
    expect(previewAbsenceDays('2025-01-31', '2025-01-01', 'CALENDAR')).toBe(0);
  });
});
