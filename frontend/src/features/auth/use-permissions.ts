import { useAuthStore } from './auth.store';

/**
 * Deriva los permisos del usuario autenticado a partir de su rol.
 * - isAdmin: puede editar y eliminar cualquier registro.
 * - canManageEmployees / canManagePayroll: gestores de cada área.
 */
export function usePermissions() {
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  return {
    role,
    isAdmin,
    canManageEmployees: isAdmin || role === 'HR_MANAGER',
    canManagePayroll: isAdmin || role === 'PAYROLL_MANAGER',
  };
}
