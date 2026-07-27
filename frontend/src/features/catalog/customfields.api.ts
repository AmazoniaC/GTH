import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CustomFieldDefinition } from '@/types';

export function useCustomFields() {
  return useQuery({
    queryKey: ['custom-fields'],
    queryFn: async () => {
      const { data } = await api.get<{ data: CustomFieldDefinition[] }>('/custom-fields');
      return data.data;
    },
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['custom-fields'] });
}

export function useCreateCustomField() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post('/custom-fields', payload);
      return data.data;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteCustomField() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/custom-fields/${id}`);
    },
    onSuccess: invalidate,
  });
}
