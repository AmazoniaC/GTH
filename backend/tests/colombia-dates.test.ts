import { describe, it, expect } from 'vitest';
import {
  colombianHolidays,
  countBusinessDays,
  countCalendarDays,
  countDaysInPeriod,
} from '../src/core/utils/colombia-dates';

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

describe('colombianHolidays', () => {
  const h = colombianHolidays(2025);

  it('incluye los festivos fijos', () => {
    expect(h.has('2025-01-01')).toBe(true); // Año nuevo
    expect(h.has('2025-05-01')).toBe(true); // Día del trabajo
    expect(h.has('2025-07-20')).toBe(true); // Independencia
    expect(h.has('2025-08-07')).toBe(true); // Batalla de Boyacá
    expect(h.has('2025-12-08')).toBe(true); // Inmaculada Concepción
    expect(h.has('2025-12-25')).toBe(true); // Navidad
  });

  it('traslada San José al lunes siguiente (Ley Emiliani)', () => {
    expect(h.has('2025-03-19')).toBe(false);
    expect(h.has('2025-03-24')).toBe(true);
  });

  it('incluye Jueves y Viernes Santo sin trasladarlos', () => {
    expect(h.has('2025-04-17')).toBe(true); // Jueves Santo
    expect(h.has('2025-04-18')).toBe(true); // Viernes Santo
  });

  it('en 2025 San Pedro y Sagrado Corazón coinciden el lunes 30 de junio', () => {
    // San Pedro y San Pablo (dom 29 jun) se traslada al lunes 30, y el
    // Sagrado Corazón ya cae el lunes 30 → una sola fecha no laborable.
    expect(h.has('2025-06-30')).toBe(true);
    // Por esa coincidencia, 2025 tiene 17 fechas festivas distintas.
    expect(h.size).toBe(17);
  });
});

describe('countCalendarDays', () => {
  it('cuenta días inclusivos', () => {
    expect(countCalendarDays(utc(2024, 1, 1), utc(2024, 1, 31))).toBe(31);
  });

  it('un mismo día cuenta como uno', () => {
    expect(countCalendarDays(utc(2024, 1, 10), utc(2024, 1, 10))).toBe(1);
  });

  it('rango invertido cuenta cero', () => {
    expect(countCalendarDays(utc(2024, 1, 31), utc(2024, 1, 1))).toBe(0);
  });
});

describe('countBusinessDays', () => {
  it('excluye fines de semana', () => {
    // Lunes 13 a viernes 17 de enero 2025, sin festivos.
    expect(countBusinessDays(utc(2025, 1, 13), utc(2025, 1, 17))).toBe(5);
  });

  it('excluye festivos', () => {
    // Lunes 6 (Reyes, festivo) a viernes 10 de enero 2025 → 4 hábiles.
    expect(countBusinessDays(utc(2025, 1, 6), utc(2025, 1, 10))).toBe(4);
  });
});

describe('countDaysInPeriod', () => {
  it('recorta la ausencia al periodo liquidado', () => {
    // Ausencia 25 ene – 10 feb, periodo enero → 7 días de enero (calendario).
    expect(
      countDaysInPeriod(
        utc(2025, 1, 25),
        utc(2025, 2, 10),
        utc(2025, 1, 1),
        utc(2025, 1, 31),
        'CALENDAR',
      ),
    ).toBe(7);
  });

  it('devuelve cero si no hay solapamiento', () => {
    expect(
      countDaysInPeriod(
        utc(2025, 3, 1),
        utc(2025, 3, 5),
        utc(2025, 1, 1),
        utc(2025, 1, 31),
        'CALENDAR',
      ),
    ).toBe(0);
  });
});
