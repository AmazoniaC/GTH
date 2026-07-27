import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AuthUser } from '@/types';

export interface PlatformSummary {
  organizations: number;
  users: number;
  employees: number;
  activeEmployees: number;
}

export interface PlatformOrg {
  id: string;
  name: string;
  nit: string;
  city?: string | null;
  email?: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { users: number; employees: number };
}

export function usePlatformSummary() {
  return useQuery({
    queryKey: ['platform', 'summary'],
    queryFn: async () => {
      const { data } = await api.get<{ data: PlatformSummary }>('/platform/summary');
      return data.data;
    },
  });
}

export function usePlatformOrganizations() {
  return useQuery({
    queryKey: ['platform', 'organizations'],
    queryFn: async () => {
      const { data } = await api.get<{ data: PlatformOrg[] }>('/platform/organizations');
      return data.data;
    },
  });
}

/** Activa o desactiva una empresa. */
export function useToggleOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data } = await api.patch(`/platform/organizations/${id}`, { isActive });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform'] }),
  });
}

/** Elimina una empresa por completo. */
export function useDeleteOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/platform/organizations/${id}`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform'] }),
  });
}

export interface ImpersonateResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

/** Ingresa como soporte a una empresa (impersonación). */
export function useImpersonateOrganization() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{ data: ImpersonateResponse }>(
        `/platform/organizations/${id}/impersonate`,
      );
      return data.data;
    },
  });
}
