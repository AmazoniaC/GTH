import {
  LayoutDashboard,
  Users,
  Wallet,
  Calculator,
  Settings,
  UserCog,
  Bell,
  Network,
  History,
  UserCircle,
  Globe,
  CalendarDays,
  BookOpen,
  FileText,
  BarChart3,
  Receipt,
  type LucideIcon,
} from 'lucide-react';
import type { AppModule, UserRole } from '@/types';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  /** Si se define, el ítem solo se muestra a estos roles. */
  roles?: UserRole[];
  /** Si es true, solo lo ve el dueño de plataforma. */
  platformOnly?: boolean;
  /** Si se define, el ítem requiere que la empresa tenga este módulo activo. */
  module?: AppModule;
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
      { label: 'Mi Portal', to: '/portal', icon: UserCircle, roles: ['EMPLOYEE'] },
      { label: 'Panel', to: '/dashboard', icon: LayoutDashboard },
      {
        label: 'Reportes',
        to: '/reports',
        icon: BarChart3,
        roles: ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'],
      },
      { label: 'Alertas', to: '/alerts', icon: Bell },
    ],
  },
  {
    title: 'Talento Humano',
    items: [
      { label: 'Empleados', to: '/employees', icon: Users, end: true, module: 'EMPLOYEES' },
      { label: 'Ausencias', to: '/absences', icon: CalendarDays, module: 'EMPLOYEES' },
      { label: 'Documentos', to: '/documents', icon: FileText, module: 'EMPLOYEES' },
      { label: 'Organigrama', to: '/organization', icon: Network, module: 'EMPLOYEES' },
    ],
  },
  {
    title: 'Nómina',
    items: [
      { label: 'Nóminas', to: '/payroll', icon: Wallet, end: true, module: 'PAYROLL' },
      { label: 'Novedades', to: '/payroll/novelties', icon: Receipt, module: 'PAYROLL' },
      { label: 'Liquidaciones', to: '/payroll/liquidations', icon: FileText, module: 'PAYROLL' },
      { label: 'Simulador', to: '/payroll/simulator', icon: Calculator, module: 'PAYROLL' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Plataforma', to: '/platform', icon: Globe, platformOnly: true },
      // Visible al dueño de plataforma y a los administradores de cada empresa.
      {
        label: 'Manual de uso',
        to: '/manual',
        icon: BookOpen,
        platformOnly: true,
        roles: ['ADMIN'],
      },
      {
        label: 'Usuarios',
        to: '/users',
        icon: UserCog,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Auditoría',
        to: '/audit',
        icon: History,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      { label: 'Configuración', to: '/settings', icon: Settings },
    ],
  },
];
