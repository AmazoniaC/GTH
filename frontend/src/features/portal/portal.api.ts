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

export function useRequestAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      type: string;
      startDate: string;
      endDate: string;
      reason?: string;
      notes?: string;
    }) => {
      const { data } = await api.post('/me/absence-requests', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal'] }),
  });
}

export function useCancelMyRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/me/absence-requests/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal'] }),
  });
}

export function useIsManager() {
  return useQuery({
    queryKey: ['portal', 'is-manager'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { isManager: boolean } }>('/me/is-manager');
      return data.data.isManager;
    },
    retry: false,
  });
}

export function useTeamApprovals(enabled: boolean) {
  return useQuery({
    queryKey: ['portal', 'team-approvals'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Absence[] }>('/me/team/approvals');
      return data.data;
    },
    enabled,
    retry: false,
  });
}

export function useReviewTeamRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      decision,
      note,
    }: {
      id: string;
      decision: 'APPROVE' | 'REJECT';
      note?: string;
    }) => {
      const { data } = await api.patch(`/me/team/approvals/${id}/review`, { decision, note });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal'] }),
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
