import { lazy, Suspense, type ComponentType } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { LoginPage } from '@/features/auth/pages/login-page';
import { useAuthStore } from '@/features/auth/auth.store';

/**
 * Páginas cargadas de forma diferida (code-splitting por ruta). Cada página se
 * descarga solo cuando el usuario la visita, reduciendo el tamaño del paquete
 * inicial y acelerando la primera carga. El inicio de sesión y el layout se
 * mantienen en el paquete principal por ser la puerta de entrada.
 */
const named = <T extends Record<string, unknown>, K extends keyof T>(
  loader: () => Promise<T>,
  key: K,
) => lazy(() => loader().then((m) => ({ default: m[key] as ComponentType })));

const DashboardPage = named(() => import('@/features/dashboard/dashboard-page'), 'DashboardPage');
const EmployeesPage = named(() => import('@/features/employees/pages/employees-page'), 'EmployeesPage');
const EmployeeDetailPage = named(
  () => import('@/features/employees/pages/employee-detail-page'),
  'EmployeeDetailPage',
);
const PayrollPage = named(() => import('@/features/payroll/pages/payroll-page'), 'PayrollPage');
const PayrollPeriodPage = named(
  () => import('@/features/payroll/pages/payroll-period-page'),
  'PayrollPeriodPage',
);
const PayslipPage = named(() => import('@/features/payroll/pages/payslip-page'), 'PayslipPage');
const PayrollSimulatorPage = named(
  () => import('@/features/payroll/pages/payroll-simulator-page'),
  'PayrollSimulatorPage',
);
const SettingsPage = named(() => import('@/features/settings/settings-page'), 'SettingsPage');
const UsersPage = named(() => import('@/features/users/pages/users-page'), 'UsersPage');
const OrgChartPage = named(() => import('@/features/organization/org-chart-page'), 'OrgChartPage');
const AlertsPage = named(() => import('@/features/alerts/pages/alerts-page'), 'AlertsPage');
const AuditLogPage = named(() => import('@/features/audit/pages/audit-log-page'), 'AuditLogPage');
const PortalPage = named(() => import('@/features/portal/portal-page'), 'PortalPage');
const PlatformPage = named(() => import('@/features/platform/platform-page'), 'PlatformPage');
const AbsencesPage = named(() => import('@/features/absences/pages/absences-page'), 'AbsencesPage');
const ManualPage = named(() => import('@/features/manual/manual-page'), 'ManualPage');
const DocumentsPage = named(() => import('@/features/documents-gen/pages/documents-page'), 'DocumentsPage');
const ReportsPage = named(() => import('@/features/reports/pages/reports-page'), 'ReportsPage');
const NoveltiesPage = named(() => import('@/features/novelties/pages/novelties-page'), 'NoveltiesPage');
const LiquidationsPage = named(
  () => import('@/features/liquidations/pages/liquidations-page'),
  'LiquidationsPage',
);
const NewLiquidationPage = named(
  () => import('@/features/liquidations/pages/new-liquidation-page'),
  'NewLiquidationPage',
);
const LiquidationDetailPage = named(
  () => import('@/features/liquidations/pages/liquidation-detail-page'),
  'LiquidationDetailPage',
);
const VacanciesPage = named(() => import('@/features/recruitment/pages/vacancies-page'), 'VacanciesPage');
const VacancyDetailPage = named(
  () => import('@/features/recruitment/pages/vacancy-detail-page'),
  'VacancyDetailPage',
);
const ApplicationDetailPage = named(
  () => import('@/features/recruitment/pages/application-detail-page'),
  'ApplicationDetailPage',
);

/** Indicador de carga mientras se descarga el módulo de una ruta. */
function RouteFallback() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
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
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/absences" element={<AbsencesPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/organization" element={<OrgChartPage />} />
          <Route path="/recruitment" element={<VacanciesPage />} />
          <Route path="/recruitment/vacancies/:id" element={<VacancyDetailPage />} />
          <Route path="/recruitment/applications/:id" element={<ApplicationDetailPage />} />
          <Route path="/employees/:documentNumber" element={<EmployeeDetailPage />} />
          <Route path="/payroll" element={<PayrollPage />} />
          <Route path="/payroll/simulator" element={<PayrollSimulatorPage />} />
          <Route path="/payroll/novelties" element={<NoveltiesPage />} />
          <Route path="/payroll/liquidations" element={<LiquidationsPage />} />
          <Route path="/payroll/liquidations/new" element={<NewLiquidationPage />} />
          <Route path="/payroll/liquidations/:id" element={<LiquidationDetailPage />} />
          <Route path="/payroll/periods/:id" element={<PayrollPeriodPage />} />
          <Route path="/payroll/payslips/:id" element={<PayslipPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/platform" element={<PlatformPage />} />
          <Route path="/manual" element={<ManualPage />} />
          <Route path="/audit" element={<AuditLogPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </Suspense>
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
