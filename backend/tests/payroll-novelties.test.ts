import { describe, it, expect } from 'vitest';
import {
  overtimeAmount,
  overtimeFactor,
} from '../src/config/payroll-novelties';

describe('overtimeFactor', () => {
  it('devuelve el factor de cada tipo de hora extra', () => {
    expect(overtimeFactor('OT_HED')).toBe(1.25); // diurna
    expect(overtimeFactor('OT_HEN')).toBe(1.75); // nocturna
    expect(overtimeFactor('OT_HEND')).toBe(2.5); // nocturna dominical/festivo
  });

  it('devuelve null para un código desconocido', () => {
    expect(overtimeFactor('NOPE')).toBeNull();
  });
});

describe('overtimeAmount', () => {
  it('valor = horas × (salario/240) × factor', () => {
    // (2.400.000 / 240) = 10.000 valor hora → 10h × 1.25 = 125.000
    expect(overtimeAmount(2_400_000, 10, 1.25)).toBe(125_000);
  });

  it('redondea al peso más cercano', () => {
    // (1.623.500 / 240) = 6.764,58 → × 2 × 1.25 = 16.911,45 → 16.911
    expect(overtimeAmount(1_623_500, 2, 1.25)).toBe(16_911);
  });
});
