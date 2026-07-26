import { api } from '@/lib/api';
import type { AuthUser } from '@/types';

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: async (payload: { email: string; password: string }) => {
    const { data } = await api.post<{ data: AuthResponse }>('/auth/login', payload);
    return data.data;
  },
  register: async (payload: {
    organizationName: string;
    nit: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    const { data } = await api.post<{ data: AuthResponse }>('/auth/register', payload);
    return data.data;
  },
  me: async () => {
    const { data } = await api.get<{ data: AuthUser & { organization: unknown } }>('/auth/me');
    return data.data;
  },
};
