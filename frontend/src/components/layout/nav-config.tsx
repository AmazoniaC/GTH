import {
  LayoutDashboard,
  Users,
  Wallet,
  Calculator,
  Settings,
  UserCog,
  Bell,
  Network,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  /** Si se define, el ítem solo se muestra a estos roles. */
  roles?: UserRole[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Configuración de navegación. Añadir un nuevo módulo es tan simple como
 * agregar una nueva sección o ítem aquí.
 */
export const navSections: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Panel', to: '/dashboard', icon: LayoutDashboard },
      { label: 'Alertas', to: '/alerts', icon: Bell },
    ],
  },
  {
    title: 'Talento Humano',
    items: [
      { label: 'Empleados', to: '/employees', icon: Users, end: true },
      { label: 'Organigrama', to: '/organization', icon: Network },
    ],
  },
  {
    title: 'Nómina',
    items: [
      { label: 'Nóminas', to: '/payroll', icon: Wallet, end: true },
      { label: 'Simulador', to: '/payroll/simulator', icon: Calculator },
    ],
  },
  {
    title: 'Sistema',
    items: [
      {
        label: 'Usuarios',
        to: '/users',
        icon: UserCog,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      { label: 'Configuración', to: '/settings', icon: Settings },
    ],
  },
];
