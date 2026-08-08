import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/features/auth/auth.store';

const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inyecta el access token en cada petición.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresca el token automáticamente ante un 401.
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const store = useAuthStore.getState();

    if (
      error.response?.status === 401 &&
      !original._retry &&
      store.refreshToken &&
      !original.url?.includes('/auth/')
    ) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push((token) => {
            if (token) {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: store.refreshToken,
        });
        const newToken = data.data.accessToken as string;
        store.setTokens(newToken, data.data.refreshToken);
        pendingQueue.forEach((cb) => cb(newToken));
        pendingQueue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        pendingQueue.forEach((cb) => cb(null));
        pendingQueue = [];
        store.logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

/** Extrae un mensaje de error legible de una respuesta de la API. */
export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string })?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
