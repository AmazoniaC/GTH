import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types';

interface Session {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  /** Sesión de soporte activa (dueño de plataforma dentro de una empresa). */
  impersonation: { organizationName: string } | null;
  /** Sesión original del dueño, guardada para poder regresar. */
  ownerSession: Session | null;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  /** Entra como soporte a una empresa, preservando la sesión del dueño. */
  impersonate: (
    user: AuthUser,
    accessToken: string,
    refreshToken: string,
    organizationName: string,
  ) => void;
  /** Regresa a la sesión del dueño de plataforma. */
  exitImpersonation: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      impersonation: null,
      ownerSession: null,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      impersonate: (user, accessToken, refreshToken, organizationName) => {
        const { user: owner, accessToken: at, refreshToken: rt } = get();
        set({
          ownerSession: owner && at && rt ? { user: owner, accessToken: at, refreshToken: rt } : null,
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          impersonation: { organizationName },
        });
      },
      exitImpersonation: () => {
        const prev = get().ownerSession;
        if (prev) {
          set({
            user: prev.user,
            accessToken: prev.accessToken,
            refreshToken: prev.refreshToken,
            isAuthenticated: true,
            impersonation: null,
            ownerSession: null,
          });
        } else {
          set({ impersonation: null, ownerSession: null });
        }
      },
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          impersonation: null,
          ownerSession: null,
        }),
    }),
    { name: 'gth-auth' },
  ),
);
