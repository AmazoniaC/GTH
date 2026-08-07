import { describe, it, expect } from 'vitest';
import {
  absenceAffectsPayroll,
  getAbsenceRule,
} from '../src/config/absence-rules';

describe('getAbsenceRule', () => {
  it('las vacaciones consumen saldo y las paga el empleador', () => {
    const r = getAbsenceRule('VACATION');
    expect(r.consumesVacation).toBe(true);
    expect(r.payroll).toBe('PAID_EMPLOYER');
    expect(r.dayCount).toBe('BUSINESS');
  });

  it('la incapacidad general se cuenta en calendario y requiere entidad', () => {
    const r = getAbsenceRule('SICK_GENERAL');
    expect(r.payroll).toBe('INCAPACITY_GENERAL');
    expect(r.dayCount).toBe('CALENDAR');
    expect(r.requiresEntity).toBe(true);
  });

  it('un tipo personalizado usa el comportamiento neutro por defecto', () => {
    const r = getAbsenceRule('CUSTOM_X', 'Mi permiso especial');
    expect(r.label).toBe('Mi permiso especial');
    expect(r.group).toBe('PERMIT');
    expect(r.dayCount).toBe('BUSINESS');
    expect(r.consumesVacation).toBe(false);
    expect(r.payroll).toBe('PAID_EMPLOYER');
  });
});

describe('absenceAffectsPayroll', () => {
  it('las ausencias pagadas por el empleador no afectan la nómina', () => {
    expect(absenceAffectsPayroll('VACATION')).toBe(false);
    expect(absenceAffectsPayroll('PERMIT_PAID')).toBe(false);
  });

  it('incapacidades y licencias no remuneradas sí la afectan', () => {
    expect(absenceAffectsPayroll('SICK_GENERAL')).toBe(true);
    expect(absenceAffectsPayroll('LICENSE_UNPAID')).toBe(true);
    expect(absenceAffectsPayroll('PERMIT_UNPAID')).toBe(true);
  });
});
