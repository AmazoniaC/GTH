import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface LabelValue {
  label: string;
  value: number;
}

export interface HeadcountReport {
  totals: { total: number; active: number; terminated: number; onLeave: number };
  byDepartment: LabelValue[];
  byContractType: LabelValue[];
  byGender: LabelValue[];
  byLocation: LabelValue[];
  bySeniority: LabelValue[];
  byAge: LabelValue[];
  turnover: { label: string; hires: number; exits: number }[];
  turnoverRate: number;
}

export interface PayrollReport {
  year: number;
  monthly: { label: string; net: number; employerCost: number; earnings: number; deductions: number }[];
  totals: { net: number; employerCost: number; earnings: number; deductions: number };
  byDepartment: LabelValue[];
  salaryDistribution: LabelValue[];
  averageSalary: number;
  employees: number;
}

export interface AbsenteeismReport {
  totalDays: number;
  avgDaysPerEmployee: number;
  byType: LabelValue[];
  byGroup: LabelValue[];
  byDepartment: LabelValue[];
  incapacityByOrigin: LabelValue[];
  topEmployees: { name: string; days: number }[];
  vacationLiability: { days: number; value: number };
}

export interface ComplianceReport {
  alerts: { CONTRACT: number; PROBATION: number; DOCUMENT: number; BIRTHDAY: number };
  alertItems: {
    id: string;
    category: string;
    title: string;
    detail: string;
    employeeName: string;
    date: string | null;
  }[];
  habeasData: { consented: number; pending: number; total: number };
  eps: LabelValue[];
  pension: LabelValue[];
  arl: LabelValue[];
  compensationFund: LabelValue[];
}

export function useHeadcountReport() {
  return useQuery({
    queryKey: ['reports', 'headcount'],
    queryFn: async () => (await api.get<{ data: HeadcountReport }>('/reports/headcount')).data.data,
  });
}

export function usePayrollReport(year: number) {
  return useQuery({
    queryKey: ['reports', 'payroll', year],
    queryFn: async () =>
      (await api.get<{ data: PayrollReport }>('/reports/payroll', { params: { year } })).data.data,
  });
}

export function useAbsenteeismReport(from: string, to: string) {
  return useQuery({
    queryKey: ['reports', 'absenteeism', from, to],
    queryFn: async () =>
      (await api.get<{ data: AbsenteeismReport }>('/reports/absenteeism', { params: { from, to } }))
        .data.data,
  });
}

export function useComplianceReport() {
  return useQuery({
    queryKey: ['reports', 'compliance'],
    queryFn: async () => (await api.get<{ data: ComplianceReport }>('/reports/compliance')).data.data,
  });
}
