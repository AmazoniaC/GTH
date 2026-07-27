import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Organization {
  id: string;
  name: string;
  nit: string;
  legalName?: string | null;
  legalRepresentative?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logoUrl?: string | null;
}

export function useOrganization() {
  return useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Organization }>('/organization');
      return data.data;
    },
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Organization>) => {
      const { data } = await api.put<{ data: Organization }>('/organization', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organization'] }),
  });
}
