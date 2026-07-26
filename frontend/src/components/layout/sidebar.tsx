import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navSections } from './nav-config';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
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
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent text-white font-bold text-lg shadow-lg">
              G
            </div>
            <div className="leading-tight">
              <p className="font-bold tracking-tight">GTH</p>
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
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
                {section.title}
              </p>
              <ul className="space-y-1">
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
            </div>
          ))}
        </nav>

        {/* Pie */}
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-lg bg-sidebar-border/50 p-3">
            <p className="text-xs font-medium text-sidebar-foreground">GTH Suite</p>
            <p className="text-[11px] text-sidebar-muted mt-0.5">v1.0 · Colombia 🇨🇴</p>
          </div>
        </div>
      </aside>
    </>
  );
}
