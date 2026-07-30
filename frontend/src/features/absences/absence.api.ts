import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Absence, AbsenceStatus, VacationBalance } from '@/types';

export interface AbsenceFilters {
  employeeId?: string;
  type?: string;
  status?: AbsenceStatus;
  from?: string;
  to?: string;
}

export interface AbsencePayload {
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  status?: AbsenceStatus;
  entity?: string | null;
  supportNumber?: string | null;
  diagnosis?: string | null;
  reason?: string | null;
  notes?: string | null;
  documentUrl?: string | null;
}

export function useAbsences(filters: AbsenceFilters = {}) {
  return useQuery({
    queryKey: ['absences', filters],
    queryFn: async () => {
      const { data } = await api.get<{ data: Absence[] }>('/absences', { params: filters });
      return data.data;
    },
  });
}

export function useVacationBalance(employeeId?: string) {
  return useQuery({
    queryKey: ['absences', 'balance', employeeId],
    queryFn: async () => {
      const { data } = await api.get<{ data: VacationBalance }>(
        `/absences/employees/${employeeId}/balance`,
      );
      return data.data;
    },
    enabled: !!employeeId,
  });
}

export function useCreateAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AbsencePayload) => {
      const { data } = await api.post<{ data: Absence }>('/absences', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['absences'] }),
  });
}

export function useUpdateAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<AbsencePayload> & { id: string }) => {
      const { data } = await api.patch<{ data: Absence }>(`/absences/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['absences'] }),
  });
}

export function useDeleteAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/absences/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['absences'] }),
  });
}

/** Solicitudes pendientes de aprobación (RRHH/Admin: toda la empresa). */
export function useAbsenceApprovals() {
  return useQuery({
    queryKey: ['absences', 'approvals'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Absence[] }>('/absences/approvals');
      return data.data;
    },
  });
}

/** Conteo de solicitudes pendientes (para insignias). */
export function usePendingCount() {
  return useQuery({
    queryKey: ['absences', 'pending-count'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { pending: number } }>('/absences/pending-count');
      return data.data.pending;
    },
  });
}

/** Aprueba o rechaza una solicitud (RRHH/Admin). */
export function useReviewAbsence() {
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
      const { data } = await api.patch(`/absences/${id}/review`, { decision, note });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['absences'] }),
  });
}

export function useAddVacationAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      employeeId: string;
      days: number;
      reason?: string;
      effectiveDate?: string;
    }) => {
      const { data } = await api.post<{ data: VacationBalance }>('/absences/adjustments', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['absences'] }),
  });
}
