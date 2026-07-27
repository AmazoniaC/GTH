import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
