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

/** Empleado en formato liviano para selectores (sin paginación). */
export interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  email?: string | null;
  photoUrl?: string | null;
  status: string;
  position?: { title: string } | null;
  user?: { id: string; isActive: boolean } | null;
}

export interface PortalAccess {
  hasAccess: boolean;
  email: string | null;
  isActive: boolean;
}

/** Estado de acceso al portal de un empleado. */
export function usePortalAccess(employeeId: string) {
  return useQuery({
    queryKey: ['portal-access', employeeId],
    queryFn: async () => {
      const { data } = await api.get<{ data: PortalAccess }>(`/employees/${employeeId}/portal-access`);
      return data.data;
    },
    enabled: !!employeeId,
  });
}

/** Crea el acceso al portal (contraseña = número de documento). */
export function useCreatePortalAccess(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/employees/${employeeId}/portal-access`);
      return data.data as PortalAccess;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-access', employeeId] });
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

/** Activa o inhabilita el acceso al portal. */
export function useSetPortalActive(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (isActive: boolean) => {
      const { data } = await api.patch(`/employees/${employeeId}/portal-access`, { isActive });
      return data.data as PortalAccess;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-access', employeeId] });
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export interface BulkPortalResult {
  created: number;
  skipped: number;
  errors: { name?: string; documentNumber?: string; message: string }[];
}

/** Crea accesos al portal para varios empleados. */
export function useBulkPortalAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (employeeIds: string[]) => {
      const { data } = await api.post('/employees/portal-access/bulk', { employeeIds });
      return data.data as BulkPortalResult;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

/** Lista completa de empleados para selectores (registro de ausencias, etc.). */
export function useEmployeeOptions() {
  return useQuery({
    queryKey: ['employees', 'select'],
    queryFn: async () => {
      const { data } = await api.get<{ data: EmployeeOption[] }>('/employees/select');
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
  positionId?: string;
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
