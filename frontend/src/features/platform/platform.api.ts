import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AppModule, AuthUser } from '@/types';

/** Módulos disponibles para asignar a una empresa. */
export const AVAILABLE_MODULES: { key: AppModule; label: string; description: string }[] = [
  { key: 'EMPLOYEES', label: 'Gestión de Empleados', description: 'Empleados y organigrama' },
  { key: 'PAYROLL', label: 'Nómina', description: 'Liquidación y simulador' },
  {
    key: 'RECRUITMENT',
    label: 'Contratación y Selección',
    description: 'Vacantes, candidatos, entrevistas y onboarding',
  },
];

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
  modules: AppModule[];
  maxEmployees: number | null;
  createdAt: string;
  _count: { users: number; employees: number };
}

export interface CreateOrgInput {
  organizationName: string;
  nit: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  modules: AppModule[];
  maxEmployees: number | null;
}

export interface UpdateOrgInput {
  id: string;
  name?: string;
  isActive?: boolean;
  modules?: AppModule[];
  maxEmployees?: number | null;
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

/** Crea una nueva empresa con su administrador. */
export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOrgInput) => {
      const { data } = await api.post('/platform/organizations', input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform'] }),
  });
}

/** Actualiza la configuración de una empresa (estado, módulos, límite). */
export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateOrgInput) => {
      const { data } = await api.patch(`/platform/organizations/${id}`, body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform'] }),
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
