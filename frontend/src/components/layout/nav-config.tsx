import {
  LayoutDashboard,
  Users,
  Wallet,
  Calculator,
  Settings,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
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
    items: [{ label: 'Panel', to: '/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Talento Humano',
    items: [{ label: 'Empleados', to: '/employees', icon: Users }],
  },
  {
    title: 'Nómina',
    items: [
      { label: 'Nóminas', to: '/payroll', icon: Wallet, end: true },
      { label: 'Simulador', to: '/payroll/simulator', icon: Calculator },
      { label: 'Parámetros', to: '/payroll/config', icon: SlidersHorizontal },
    ],
  },
  {
    title: 'Sistema',
    items: [{ label: 'Configuración', to: '/settings', icon: Settings }],
  },
];
