import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type NoveltyKind = 'EARNING' | 'DEDUCTION';

export interface Novelty {
  id: string;
  employeeId: string;
  kind: NoveltyKind;
  code: string;
  concept: string;
  amount: string;
  recurring: boolean;
  installments?: number | null;
  appliedCount: number;
  hours?: string | null;
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  employee?: { id: string; firstName: string; lastName: string; documentNumber: string };
}

export interface NoveltyCatalog {
  overtime: { code: string; label: string; factor: number }[];
  earnings: { code: string; label: string }[];
  deductions: { code: string; label: string }[];
}

export interface NoveltyPayload {
  employeeId: string;
  kind: NoveltyKind;
  code: string;
  concept?: string;
  amount?: number;
  hours?: number;
  recurring: boolean;
  installments?: number | null;
  notes?: string | null;
}

export function useNoveltyCatalog() {
  return useQuery({
    queryKey: ['novelties', 'catalog'],
    queryFn: async () => (await api.get<{ data: NoveltyCatalog }>('/novelties/catalog')).data.data,
    staleTime: Infinity,
  });
}

export function useNovelties(filters: { employeeId?: string; kind?: NoveltyKind; active?: string } = {}) {
  return useQuery({
    queryKey: ['novelties', filters],
    queryFn: async () => (await api.get<{ data: Novelty[] }>('/novelties', { params: filters })).data.data,
  });
}

export function useCreateNovelty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NoveltyPayload) => (await api.post('/novelties', payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['novelties'] }),
  });
}

export function useUpdateNovelty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; isActive?: boolean; amount?: number; concept?: string }) =>
      (await api.put(`/novelties/${id}`, body)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['novelties'] }),
  });
}

export function useDeleteNovelty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/novelties/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['novelties'] }),
  });
}
