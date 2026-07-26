import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AlertsResponse } from '@/types';

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data } = await api.get<{ data: AlertsResponse }>('/alerts');
      return data.data;
    },
    refetchInterval: 1000 * 60 * 5,
  });
}
