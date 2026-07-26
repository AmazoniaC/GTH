import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Department, Employee, OrgNode, Paginated, Position } from '@/types';

export function useOrgChart() {
  return useQuery({
    queryKey: ['employees', 'org-chart'],
    queryFn: async () => {
      const { data } = await api.get<{ data: OrgNode[] }>('/employees/org-chart');
      return data.data;
    },
  });
}

/** Devuelve todos los empleados de la organización (para exportar). */
export async function fetchAllEmployees(): Promise<Employee[]> {
  const { data } = await api.get<{ data: Employee[] }>('/employees/export');
  return data.data;
}

interface EmployeeFilters {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  departmentId?: string;
}

export function useEmployees(filters: EmployeeFilters) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Employee>>('/employees', { params: filters });
      return data;
    },
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: Employee }>(`/employees/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

/** Busca un empleado por su cédula (identificador visible / de la URL). */
export function useEmployeeByDocument(documentNumber: string) {
  return useQuery({
    queryKey: ['employees', 'by-document', documentNumber],
    queryFn: async () => {
      const { data } = await api.get<{ data: Employee }>(
        `/employees/by-document/${documentNumber}`,
      );
      return data.data;
    },
    enabled: !!documentNumber,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post<{ data: Employee }>('/employees', payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateEmployee(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.put<{ data: Employee }>(`/employees/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/employees/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['catalog', 'departments'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Department[] }>('/catalog/departments');
      return data.data;
    },
  });
}

export function usePositions() {
  return useQuery({
    queryKey: ['catalog', 'positions'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Position[] }>('/catalog/positions');
      return data.data;
    },
  });
}
