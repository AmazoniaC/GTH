import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PayrollConfig, PayrollPeriod, Payslip, SimulationResult } from '@/types';
import type { PrintPeriod } from './print-payslips';

/** Descarga el periodo con todos sus desprendibles (para impresión masiva). */
export async function fetchPeriodForPrint(id: string): Promise<PrintPeriod> {
  const { data } = await api.get<{ data: PrintPeriod }>(`/payroll/periods/${id}/payslips-print`);
  return data.data;
}

export interface PilaRow {
  employee: string;
  documentType: string;
  documentNumber: string;
  eps: string;
  afp: string;
  arlEntity: string;
  ccfEntity: string;
  riskClass: number;
  days: number;
  ibc: number;
  health: number;
  pension: number;
  fsp: number;
  arl: number;
  ccf: number;
  sena: number;
  icbf: number;
  total: number;
}

export interface PilaData {
  period: { id: string; name: string; month: number; year: number };
  organization: { name: string; legalName: string | null; nit: string };
  count: number;
  rows: PilaRow[];
  totals: Omit<PilaRow, 'employee' | 'documentType' | 'documentNumber' | 'eps' | 'afp' | 'arlEntity' | 'ccfEntity' | 'riskClass' | 'days'>;
}

/** Liquidación de aportes (base PILA) de un periodo. */
export function usePeriodPila(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['payroll', 'pila', id],
    queryFn: async () => (await api.get<{ data: PilaData }>(`/payroll/periods/${id}/pila`)).data.data,
    enabled: enabled && !!id,
  });
}

/** Envía por correo el desprendible a cada empleado del periodo con correo. */
export async function sendPeriodPayslips(
  id: string,
): Promise<{ sent: number; skipped: number; failed: string[] }> {
  const { data } = await api.post<{ data: { sent: number; skipped: number; failed: string[] } }>(
    `/payroll/periods/${id}/send-payslips`,
  );
  return data.data;
}

export function usePayrollPeriods(filters?: { year?: number; status?: string }) {
  return useQuery({
    queryKey: ['payroll', 'periods', filters],
    queryFn: async () => {
      const { data } = await api.get<{ data: PayrollPeriod[] }>('/payroll/periods', {
        params: filters,
      });
      return data.data;
    },
  });
}

export function usePayrollPeriod(id: string) {
  return useQuery({
    queryKey: ['payroll', 'period', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: PayrollPeriod }>(`/payroll/periods/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function usePayslip(id: string) {
  return useQuery({
    queryKey: ['payroll', 'payslip', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: Payslip }>(`/payroll/payslips/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreatePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post<{ data: PayrollPeriod }>('/payroll/periods', payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdatePeriodStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch<{ data: PayrollPeriod }>(`/payroll/periods/${id}/status`, {
        status,
      });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeletePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/payroll/periods/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll'] });
    },
  });
}

export function useSimulate() {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post<{ data: SimulationResult }>('/payroll/simulate', payload);
      return data.data;
    },
  });
}

export function usePayrollConfig(year: number) {
  return useQuery({
    queryKey: ['payroll', 'config', year],
    queryFn: async () => {
      const { data } = await api.get<{ data: PayrollConfig }>('/payroll/config', {
        params: { year },
      });
      return data.data;
    },
  });
}

export function useUpsertConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.put<{ data: PayrollConfig }>('/payroll/config', payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'config'] });
    },
  });
}
