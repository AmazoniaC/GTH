import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LifeBuoy, LogOut } from 'lucide-react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { authApi } from '@/features/auth/auth.api';
import { useAuthStore } from '@/features/auth/auth.store';
import type { AppModule } from '@/types';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const impersonation = useAuthStore((s) => s.impersonation);
  const exitImpersonation = useAuthStore((s) => s.exitImpersonation);

  // Refresca el usuario (rol, flag de plataforma, módulos, etc.) al entrar.
  useEffect(() => {
    authApi
      .me()
      .then((me) =>
        setUser({
          id: me.id,
          email: me.email,
          firstName: me.firstName,
          lastName: me.lastName,
          role: me.role,
          organizationId: me.organizationId,
          avatarUrl: me.avatarUrl,
          isPlatformOwner: me.isPlatformOwner,
          modules: (me.organization as { modules?: AppModule[] } | undefined)?.modules,
        }),
      )
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExitSupport = () => {
    exitImpersonation();
    navigate('/platform');
  };

  // El dueño de plataforma (fuera de modo soporte) solo gestiona empresas
  // y consulta el manual de uso.
  const ownerAllowed = ['/platform', '/manual'];
  const ownerOnly = !!user?.isPlatformOwner && !impersonation;
  if (ownerOnly && !ownerAllowed.includes(location.pathname)) {
    return <Navigate to="/platform" replace />;
  }
  // Nadie más puede entrar al panel de plataforma.
  if (!ownerOnly && location.pathname === '/platform') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {impersonation && (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
            <span className="inline-flex items-center gap-1.5">
              <LifeBuoy className="h-4 w-4" />
              Modo soporte: estás dentro de <strong>{impersonation.organizationName}</strong>
            </span>
            <button
              onClick={handleExitSupport}
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-950/10 px-2.5 py-1 text-xs font-semibold hover:bg-amber-950/20"
            >
              <LogOut className="h-3.5 w-3.5" />
              Salir del soporte
            </button>
          </div>
        )}
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
