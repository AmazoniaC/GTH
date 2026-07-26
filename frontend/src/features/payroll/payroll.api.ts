import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PayrollConfig, PayrollPeriod, Payslip, SimulationResult } from '@/types';

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
