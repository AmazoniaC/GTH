import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  Building2,
  UserCheck,
  UserMinus,
  Users,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PayrollStatusBadge } from '@/components/shared/status-badges';
import { useDashboardSummary } from './dashboard.api';
import { formatCurrency, formatNumber } from '@/lib/utils';

const CHART_COLORS = ['#2563eb', '#0ea5e9', '#6366f1', '#8b5cf6', '#14b8a6', '#f59e0b'];
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Panel de control" description="Resumen general de tu organización." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const emp = data?.employees;
  const trendData = (data?.payrollTrend ?? []).map((p) => ({
    name: `${MONTHS[p.month - 1]} ${String(p.year).slice(2)}`,
    neto: Number(p.totalNet),
    costo: Number(p.totalEmployerCost),
  }));
  const deptData = (data?.employeesByDepartment ?? []).map((d) => ({
    name: d.department,
    total: d.count,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Panel de control" description="Resumen general de tu organización.">
        <Button asChild>
          <Link to="/payroll">
            <Wallet className="h-4 w-4" /> Ir a nómina
          </Link>
        </Button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total empleados" value={formatNumber(emp?.total)} icon={Users} accent="primary" />
        <StatCard title="Activos" value={formatNumber(emp?.active)} icon={UserCheck} accent="success" />
        <StatCard title="En licencia" value={formatNumber(emp?.onLeave)} icon={UserMinus} accent="warning" />
        <StatCard title="Departamentos" value={formatNumber(data?.departments)} icon={Building2} accent="primary" />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Costo de nómina</CardTitle>
            <CardDescription>Neto pagado vs. costo total empleador (últimos periodos)</CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <EmptyChart message="Aún no has procesado nóminas." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trendData} margin={{ left: 4, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 12,
                      fontSize: 13,
                    }}
                  />
                  <Area type="monotone" dataKey="costo" name="Costo empleador" stroke="#14b8a6" strokeWidth={2} fill="url(#gCost)" />
                  <Area type="monotone" dataKey="neto" name="Neto pagado" stroke="#2563eb" strokeWidth={2} fill="url(#gNet)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Última nómina</CardTitle>
            <CardDescription>Estado del periodo más reciente</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.lastPayroll ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{data.lastPayroll.name}</p>
                  <PayrollStatusBadge status={data.lastPayroll.status} />
                </div>
                <div className="rounded-xl bg-primary/5 p-4">
                  <p className="text-xs text-muted-foreground">Neto pagado</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {formatCurrency(data.lastPayroll.totalNet)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/60 p-4">
                  <p className="text-xs text-muted-foreground">Costo total empleador</p>
                  <p className="text-xl font-semibold mt-1">
                    {formatCurrency(data.lastPayroll.totalEmployerCost)}
                  </p>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/payroll">
                    Ver nóminas <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Wallet className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground mt-3">Sin nóminas procesadas</p>
                <Button variant="link" asChild>
                  <Link to="/payroll">Procesar primera nómina</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribución por departamento */}
      <Card>
        <CardHeader>
          <CardTitle>Empleados por departamento</CardTitle>
          <CardDescription>Distribución del personal en la organización</CardDescription>
        </CardHeader>
        <CardContent>
          {deptData.length === 0 ? (
            <EmptyChart message="No hay datos de departamentos." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deptData} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="total" name="Empleados" radius={[6, 6, 0, 0]} maxBarSize={64}>
                  {deptData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
