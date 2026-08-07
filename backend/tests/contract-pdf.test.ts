import { describe, it, expect } from 'vitest';
import { renderContractPdf, ContractData } from '../src/modules/recruitment/contract-pdf';

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

const base: ContractData = {
  org: {
    name: 'ACME S.A.S.',
    legalName: 'ACME SAS',
    nit: '900123456-7',
    address: 'Calle 1 # 2-3',
    city: 'Medellín',
    phone: '6041234567',
    email: 'rh@acme.co',
    logoUrl: null,
    legalRepresentative: 'Juan Pérez',
  },
  candidate: { firstName: 'Ana', lastName: 'Gómez', documentType: 'CC', documentNumber: '1234567890' },
  vacancyTitle: 'Analista de nómina',
  offer: {
    modality: 'INDEFINITE',
    positionTitle: 'Analista de nómina',
    baseSalary: 2_500_000,
    isIntegralSalary: false,
    transportAllowance: true,
    paymentFrequency: 'MONTHLY',
    startDate: utc(2026, 3, 1),
    endDate: null,
    probationDays: 60,
    workScheduleNote: null,
  },
};

const isPdf = (b: Buffer) => b.subarray(0, 5).toString('latin1') === '%PDF-';

describe('renderContractPdf', () => {
  it('genera un PDF válido para término indefinido', async () => {
    const buf = await renderContractPdf(base);
    expect(isPdf(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(1000);
  });

  it('genera un PDF válido para término fijo con fecha fin y salario integral', async () => {
    const buf = await renderContractPdf({
      ...base,
      offer: {
        ...base.offer,
        modality: 'FIXED_TERM',
        endDate: utc(2026, 9, 1),
        isIntegralSalary: true,
        probationDays: 30,
        paymentFrequency: 'BIWEEKLY',
        workScheduleNote: 'Lunes a viernes, 8:00 a.m. a 5:00 p.m.',
      },
    });
    expect(isPdf(buf)).toBe(true);
  });

  it('genera un PDF cuando no hay período de prueba (aprendizaje)', async () => {
    const buf = await renderContractPdf({
      ...base,
      offer: { ...base.offer, modality: 'LEARNING', probationDays: 0 },
    });
    expect(isPdf(buf)).toBe(true);
  });
});
