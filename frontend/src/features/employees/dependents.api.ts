import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Dependent } from '@/types';

export function useDependents(employeeId: string) {
  return useQuery({
    queryKey: ['dependents', employeeId],
    queryFn: async () => {
      const { data } = await api.get<{ data: Dependent[] }>(
        `/employees/${employeeId}/dependents`,
      );
      return data.data;
    },
    enabled: !!employeeId,
  });
}

function useInvalidate(employeeId: string) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['dependents', employeeId] });
}

export function useCreateDependent(employeeId: string) {
  const invalidate = useInvalidate(employeeId);
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post(`/employees/${employeeId}/dependents`, payload);
      return data.data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateDependent(employeeId: string) {
  const invalidate = useInvalidate(employeeId);
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.put(`/dependents/${id}`, payload);
      return data.data;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteDependent(employeeId: string) {
  const invalidate = useInvalidate(employeeId);
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/dependents/${id}`);
    },
    onSuccess: invalidate,
  });
}
