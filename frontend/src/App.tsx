import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '@/components/layout/main-layout';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { LoginPage } from '@/features/auth/pages/login-page';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { EmployeesPage } from '@/features/employees/pages/employees-page';
import { EmployeeDetailPage } from '@/features/employees/pages/employee-detail-page';
import { PayrollPage } from '@/features/payroll/pages/payroll-page';
import { PayrollPeriodPage } from '@/features/payroll/pages/payroll-period-page';
import { PayslipPage } from '@/features/payroll/pages/payslip-page';
import { PayrollSimulatorPage } from '@/features/payroll/pages/payroll-simulator-page';
import { SettingsPage } from '@/features/settings/settings-page';
import { UsersPage } from '@/features/users/pages/users-page';
import { OrgChartPage } from '@/features/organization/org-chart-page';
import { AlertsPage } from '@/features/alerts/pages/alerts-page';
import { AuditLogPage } from '@/features/audit/pages/audit-log-page';
import { PortalPage } from '@/features/portal/portal-page';
import { PlatformPage } from '@/features/platform/platform-page';
import { AbsencesPage } from '@/features/absences/pages/absences-page';
import { useAuthStore } from '@/features/auth/auth.store';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/portal" element={<PortalPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/absences" element={<AbsencesPage />} />
        <Route path="/organization" element={<OrgChartPage />} />
        <Route path="/employees/:documentNumber" element={<EmployeeDetailPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/payroll/simulator" element={<PayrollSimulatorPage />} />
        <Route path="/payroll/periods/:id" element={<PayrollPeriodPage />} />
        <Route path="/payroll/payslips/:id" element={<PayslipPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/platform" element={<PlatformPage />} />
        <Route path="/audit" element={<AuditLogPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

/** Redirige al inicio adecuado según el rol. */
function HomeRedirect() {
  const role = useAuthStore((s) => s.user?.role);
  const isPlatformOwner = useAuthStore((s) => s.user?.isPlatformOwner);
  const impersonation = useAuthStore((s) => s.impersonation);
  // El dueño de plataforma (fuera de modo soporte) va al panel de plataforma.
  if (isPlatformOwner && !impersonation) return <Navigate to="/platform" replace />;
  return <Navigate to={role === 'EMPLOYEE' ? '/portal' : '/dashboard'} replace />;
}
