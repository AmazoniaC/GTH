import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navSections } from './nav-config';
import { useAuthStore } from '@/features/auth/auth.store';
import { LogoMark } from '@/components/brand/logo';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const COLLAPSE_KEY = 'sidebar:collapsed';

function loadCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const role = useAuthStore((s) => s.user?.role);
  const isPlatformOwner = useAuthStore((s) => s.user?.isPlatformOwner);
  const impersonating = useAuthStore((s) => s.impersonation);
  const modules = useAuthStore((s) => s.user?.modules);
  const isEmployee = role === 'EMPLOYEE';
  // El dueño de plataforma (sin estar en modo soporte) solo gestiona empresas.
  const ownerOnly = !!isPlatformOwner && !impersonating;
  // El empleado (autoservicio) solo ve su portal y su configuración.
  const employeeAllowed = new Set(['/portal', '/settings']);

  const sections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // Ítems visibles al dueño de plataforma y, además, a ciertos roles de
        // empresa (ej: el manual de uso lo ven el super admin y los admins).
        if (item.platformOnly && item.roles) {
          if (isPlatformOwner) return true;
          if (ownerOnly) return false;
          return !!role && item.roles.includes(role);
        }
        if (item.platformOnly) return !!isPlatformOwner;
        // El dueño de plataforma solo ve el panel de plataforma.
        if (ownerOnly) return false;
        // Módulos deshabilitados para la empresa no se muestran.
        if (item.module && !(modules ?? []).includes(item.module)) return false;
        if (item.roles) return !!role && item.roles.includes(role);
        return isEmployee ? employeeAllowed.has(item.to) : true;
      }),
    }))
    .filter((section) => section.items.length > 0);

  // Sección que contiene la ruta activa (para abrirla automáticamente).
  const activeTitle = sections.find((s) =>
    s.items.some(
      (i) =>
        location.pathname === i.to ||
        (i.to !== '/' && !i.end && location.pathname.startsWith(`${i.to}/`)),
    ),
  )?.title;

  const [collapsed, setCollapsed] = useState<Set<string>>(loadCollapsed);

  const persist = (next: Set<string>) => {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...next]));
    return next;
  };

  const toggleSection = (title: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return persist(next);
    });

  // Al navegar, abre la sección de la página actual si estaba colapsada.
  useEffect(() => {
    if (!activeTitle) return;
    setCollapsed((prev) => {
      if (!prev.has(activeTitle)) return prev;
      const next = new Set(prev);
      next.delete(activeTitle);
      return persist(next);
    });
  }, [activeTitle]);

  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:static lg:translate-x-0 print:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9 shrink-0" />
            <div className="leading-tight">
              <p className="font-extrabold tracking-tight">Progrexa</p>
              <p className="text-[10px] uppercase tracking-widest text-sidebar-muted">
                Talento Humano
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-sidebar-muted hover:bg-sidebar-border lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {sections.map((section) => {
            const isOpen = !collapsed.has(section.title);
            return (
              <div key={section.title} className="mb-4">
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted transition-colors hover:text-sidebar-foreground"
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 transition-transform duration-200', isOpen ? '' : '-rotate-90')}
                  />
                </button>
                {isOpen && (
                  <ul className="mt-1 space-y-1">
                    {section.items.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.end}
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                              isActive
                                ? 'bg-sidebar-accent text-white shadow-md'
                                : 'text-sidebar-muted hover:bg-sidebar-border hover:text-sidebar-foreground',
                            )
                          }
                        >
                          <item.icon className="h-[18px] w-[18px]" />
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* Pie */}
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-lg bg-sidebar-border/50 p-3">
            <p className="text-xs font-medium text-sidebar-foreground">Progrexa</p>
            <p className="text-[11px] text-sidebar-muted mt-0.5">v1.0 · Colombia 🇨🇴</p>
          </div>
        </div>
      </aside>
    </>
  );
}
