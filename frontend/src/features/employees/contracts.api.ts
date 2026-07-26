import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Contract, SalaryChange } from '@/types';

export function useContracts(employeeId: string) {
  return useQuery({
    queryKey: ['contracts', employeeId],
    queryFn: async () => {
      const { data } = await api.get<{ data: Contract[] }>(
        `/employees/${employeeId}/contracts`,
      );
      return data.data;
    },
    enabled: !!employeeId,
  });
}

export function useSalaryHistory(employeeId: string) {
  return useQuery({
    queryKey: ['salary-history', employeeId],
    queryFn: async () => {
      const { data } = await api.get<{ data: SalaryChange[] }>(
        `/employees/${employeeId}/salary-history`,
      );
      return data.data;
    },
    enabled: !!employeeId,
  });
}

function useInvalidateEmployee(employeeId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['contracts', employeeId] });
    qc.invalidateQueries({ queryKey: ['salary-history', employeeId] });
    qc.invalidateQueries({ queryKey: ['employees'] });
    qc.invalidateQueries({ queryKey: ['alerts'] });
  };
}

export function useAddContract(employeeId: string) {
  const invalidate = useInvalidateEmployee(employeeId);
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post(`/employees/${employeeId}/contracts`, payload);
      return data.data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateContract(employeeId: string) {
  const invalidate = useInvalidateEmployee(employeeId);
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.put(`/contracts/${id}`, payload);
      return data.data;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteContract(employeeId: string) {
  const invalidate = useInvalidateEmployee(employeeId);
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/contracts/${id}`);
    },
    onSuccess: invalidate,
  });
}

export function useAddSalaryChange(employeeId: string) {
  const invalidate = useInvalidateEmployee(employeeId);
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post(`/employees/${employeeId}/salary-changes`, payload);
      return data.data;
    },
    onSuccess: invalidate,
  });
}
