import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AuditLog, Paginated } from '@/types';

export function useAuditLog(params: { page: number; entity?: string; action?: string }) {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: async () => {
      const { data } = await api.get<Paginated<AuditLog>>('/audit', {
        params: { page: params.page, pageSize: 20, entity: params.entity, action: params.action },
      });
      return data;
    },
  });
}
