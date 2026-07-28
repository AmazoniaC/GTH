import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Absence, Employee, EmployeeDocument, Payslip, VacationBalance } from '@/types';

export function useMyProfile() {
  return useQuery({
    queryKey: ['portal', 'profile'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Employee }>('/me/employee');
      return data.data;
    },
    retry: false,
  });
}

export function useMyDocuments() {
  return useQuery({
    queryKey: ['portal', 'documents'],
    queryFn: async () => {
      const { data } = await api.get<{ data: EmployeeDocument[] }>('/me/documents');
      return data.data;
    },
    retry: false,
  });
}

export function useMyPayslips() {
  return useQuery({
    queryKey: ['portal', 'payslips'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Payslip[] }>('/me/payslips');
      return data.data;
    },
    retry: false,
  });
}

export function useMyAbsences() {
  return useQuery({
    queryKey: ['portal', 'absences'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Absence[] }>('/me/absences');
      return data.data;
    },
    retry: false,
  });
}

export function useMyVacationBalance() {
  return useQuery({
    queryKey: ['portal', 'vacation-balance'],
    queryFn: async () => {
      const { data } = await api.get<{ data: VacationBalance }>('/me/vacation-balance');
      return data.data;
    },
    retry: false,
  });
}

export function useUpdateMyContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.patch('/me/employee', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal', 'profile'] }),
  });
}

export async function downloadMyDocument(id: string) {
  const { data } = await api.get<{ data: EmployeeDocument }>(`/me/documents/${id}/download`);
  const doc = data.data;
  if (!doc.content) return;
  const link = document.createElement('a');
  link.href = doc.content;
  link.download = doc.fileName || doc.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
