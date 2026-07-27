import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { authApi } from '@/features/auth/auth.api';
import { useAuthStore } from '@/features/auth/auth.store';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);

  // Refresca el usuario (rol, flag de plataforma, etc.) al entrar.
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
        }),
      )
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
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
