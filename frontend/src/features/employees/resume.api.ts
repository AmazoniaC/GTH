import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Education, WorkExperience } from '@/types';

export function useEducation(employeeId: string) {
  return useQuery({
    queryKey: ['education', employeeId],
    queryFn: async () => {
      const { data } = await api.get<{ data: Education[] }>(`/employees/${employeeId}/educations`);
      return data.data;
    },
    enabled: !!employeeId,
  });
}

export function useExperience(employeeId: string) {
  return useQuery({
    queryKey: ['experience', employeeId],
    queryFn: async () => {
      const { data } = await api.get<{ data: WorkExperience[] }>(
        `/employees/${employeeId}/experiences`,
      );
      return data.data;
    },
    enabled: !!employeeId,
  });
}

function mutations(employeeId: string, resource: 'educations' | 'experiences', key: string) {
  return {
    create: (payload: Record<string, unknown>) =>
      api.post(`/employees/${employeeId}/${resource}`, payload).then((r) => r.data.data),
    remove: (id: string) => api.delete(`/${resource}/${id}`),
    key,
  };
}

export function useCreateEducation(employeeId: string) {
  const qc = useQueryClient();
  const m = mutations(employeeId, 'educations', 'education');
  return useMutation({
    mutationFn: m.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['education', employeeId] }),
  });
}
export function useDeleteEducation(employeeId: string) {
  const qc = useQueryClient();
  const m = mutations(employeeId, 'educations', 'education');
  return useMutation({
    mutationFn: m.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['education', employeeId] }),
  });
}
export function useCreateExperience(employeeId: string) {
  const qc = useQueryClient();
  const m = mutations(employeeId, 'experiences', 'experience');
  return useMutation({
    mutationFn: m.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['experience', employeeId] }),
  });
}
export function useDeleteExperience(employeeId: string) {
  const qc = useQueryClient();
  const m = mutations(employeeId, 'experiences', 'experience');
  return useMutation({
    mutationFn: m.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['experience', employeeId] }),
  });
}
