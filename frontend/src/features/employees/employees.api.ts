import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Department, Employee, Paginated, Position } from '@/types';

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
