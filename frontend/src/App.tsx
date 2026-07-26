import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '@/components/layout/main-layout';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { LoginPage } from '@/features/auth/pages/login-page';
import { RegisterPage } from '@/features/auth/pages/register-page';
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/organization" element={<OrgChartPage />} />
        <Route path="/employees/:documentNumber" element={<EmployeeDetailPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/payroll/simulator" element={<PayrollSimulatorPage />} />
        <Route path="/payroll/periods/:id" element={<PayrollPeriodPage />} />
        <Route path="/payroll/payslips/:id" element={<PayslipPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
