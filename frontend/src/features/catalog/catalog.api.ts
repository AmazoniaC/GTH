import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CatalogCategory, CatalogOption } from '@/types';

// ---------------- Opciones configurables ----------------
export function useOptions(category?: CatalogCategory) {
  return useQuery({
    queryKey: ['catalog', 'options', category ?? 'all'],
    queryFn: async () => {
      const { data } = await api.get<{ data: CatalogOption[] }>('/catalog/options', {
        params: category ? { category } : undefined,
      });
      return data.data;
    },
  });
}

function useInvalidate(keys: unknown[][]) {
  const qc = useQueryClient();
  return () => keys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
}

export function useCreateOption() {
  const invalidate = useInvalidate([['catalog', 'options']]);
  return useMutation({
    mutationFn: async (payload: { category: CatalogCategory; code: string; label: string }) => {
      const { data } = await api.post('/catalog/options', payload);
      return data.data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateOption() {
  const invalidate = useInvalidate([['catalog', 'options']]);
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; label?: string; isActive?: boolean }) => {
      const { data } = await api.put(`/catalog/options/${id}`, payload);
      return data.data;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteOption() {
  const invalidate = useInvalidate([['catalog', 'options']]);
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/catalog/options/${id}`);
    },
    onSuccess: invalidate,
  });
}

// ---------------- Departamentos ----------------
export function useCreateDepartment() {
  const invalidate = useInvalidate([['catalog', 'departments']]);
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const { data } = await api.post('/catalog/departments', payload);
      return data.data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateDepartment() {
  const invalidate = useInvalidate([['catalog', 'departments']]);
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; description?: string }) => {
      const { data } = await api.put(`/catalog/departments/${id}`, payload);
      return data.data;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteDepartment() {
  const invalidate = useInvalidate([['catalog', 'departments']]);
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/catalog/departments/${id}`);
    },
    onSuccess: invalidate,
  });
}

// ---------------- Cargos ----------------
interface PositionPayload {
  title: string;
  code?: string;
  description?: string;
  departmentId?: string | null;
}

export function useCreatePosition() {
  const invalidate = useInvalidate([['catalog', 'positions']]);
  return useMutation({
    mutationFn: async (payload: PositionPayload) => {
      const { data } = await api.post('/catalog/positions', payload);
      return data.data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdatePosition() {
  const invalidate = useInvalidate([['catalog', 'positions']]);
  return useMutation({
    mutationFn: async ({ id, ...payload }: PositionPayload & { id: string }) => {
      const { data } = await api.put(`/catalog/positions/${id}`, payload);
      return data.data;
    },
    onSuccess: invalidate,
  });
}

export function useDeletePosition() {
  const invalidate = useInvalidate([['catalog', 'positions']]);
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/catalog/positions/${id}`);
    },
    onSuccess: invalidate,
  });
}
