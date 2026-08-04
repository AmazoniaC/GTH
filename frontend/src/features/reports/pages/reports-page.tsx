import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Download, Users, Wallet, CalendarOff, ShieldCheck, TrendingDown, Plane } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useHeadcountReport,
  usePayrollReport,
  useAbsenteeismReport,
  useComplianceReport,
  type LabelValue,
} from '../reports.api';
import { exportCsv } from '@/lib/export-csv';
import { formatCurrency, formatNumber } from '@/lib/utils';

const COLORS = ['#2563eb', '#0ea5e9', '#6366f1', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444', '#10b981'];

export function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reportes y analítica"
        description="Indicadores de planta, costos de nómina, ausentismo y cumplimiento."
      />
      <Tabs defaultValue="headcount">
        <TabsList>
          <TabsTrigger value="headcount">Planta</TabsTrigger>
          <TabsTrigger value="payroll">Costos</TabsTrigger>
          <TabsTrigger value="absence">Ausentismo</TabsTrigger>
          <TabsTrigger value="compliance">Cumplimiento</TabsTrigger>
        </TabsList>
        <TabsContent value="headcount"><HeadcountTab /></TabsContent>
        <TabsContent value="payroll"><PayrollTab /></TabsContent>
        <TabsContent value="absence"><AbsenceTab /></TabsContent>
        <TabsContent value="compliance"><ComplianceTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------- Planta -------------------------------- */
function HeadcountTab() {
  const { data, isLoading } = useHeadcountReport();
  if (isLoading || !data) return <Loading />;
  const exportAll = () => {
    const rows: (string | number)[][] = [];
    const push = (section: string, arr: LabelValue[]) => arr.forEach((x) => rows.push([section, x.label, x.value]));
    push('Por área', data.byDepartment);
    push('Por contrato', data.byContractType);
    push('Por género', data.byGender);
    push('Por sede', data.byLocation);
    push('Antigüedad', data.bySeniority);
    push('Edad', data.byAge);
    data.turnover.forEach((t) => rows.push(['Rotación', t.label, `+${t.hires} / -${t.exits}`]));
    exportCsv('reporte-planta', ['Sección', 'Categoría', 'Valor'], rows);
  };
  return (
    <TabWrap onExport={exportAll}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total" value={formatNumber(data.totals.total)} icon={Users} />
        <Kpi label="Activos" value={formatNumber(data.totals.active)} icon={Users} accent />
        <Kpi label="En ausencia" value={formatNumber(data.totals.onLeave)} icon={CalendarOff} />
        <Kpi label="Rotación 12m" value={`${data.turnoverRate}%`} icon={TrendingDown} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarCard title="Empleados por área" data={data.byDepartment} />
        <PieCard title="Por tipo de contrato" data={data.byContractType} />
        <PieCard title="Por género" data={data.byGender} />
        <BarCard title="Por antigüedad" data={data.bySeniority} />
        <BarCard title="Por rango de edad" data={data.byAge} />
        <Card>
          <CardHeader><CardTitle className="text-base">Altas y bajas (12 meses)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.turnover}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="hires" name="Altas" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="exits" name="Bajas" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </TabWrap>
  );
}

/* ------------------------------- Costos -------------------------------- */
function PayrollTab() {
  const nowYear = new Date().getFullYear();
  const [year, setYear] = useState(nowYear);
  const { data, isLoading } = usePayrollReport(year);
  const years = Array.from({ length: 5 }, (_, i) => nowYear - i);

  const exportAll = () => {
    const rows: (string | number)[][] = data
      ? data.monthly.map((m) => [m.label, m.earnings, m.deductions, m.net, m.employerCost])
      : [];
    exportCsv(`reporte-costos-${year}`, ['Mes', 'Devengado', 'Deducciones', 'Neto', 'Costo empleador'], rows);
  };

  return (
    <TabWrap
      onExport={exportAll}
      filters={
        <div>
          <Label className="mb-1.5 block text-xs">Año</Label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      }
    >
      {isLoading || !data ? (
        <Loading />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Costo empleador (año)" value={formatCurrency(data.totals.employerCost)} icon={Wallet} accent />
            <Kpi label="Neto pagado (año)" value={formatCurrency(data.totals.net)} icon={Wallet} />
            <Kpi label="Salario promedio" value={formatCurrency(data.averageSalary)} icon={Wallet} />
            <Kpi label="Empleados liquidados" value={formatNumber(data.employees)} icon={Users} />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Tendencia mensual</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.monthly}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="employerCost" name="Costo empleador" stroke="#14b8a6" strokeWidth={2} />
                  <Line type="monotone" dataKey="net" name="Neto pagado" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <BarCard title="Costo del empleador por área" data={data.byDepartment} currency />
            <BarCard title="Distribución salarial (SMMLV)" data={data.salaryDistribution} />
          </div>
        </>
      )}
    </TabWrap>
  );
}

/* ----------------------------- Ausentismo ------------------------------ */
function AbsenceTab() {
  const y = new Date().getFullYear();
  const [from, setFrom] = useState(`${y}-01-01`);
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const { data, isLoading } = useAbsenteeismReport(from, to);

  const exportAll = () => {
    const rows: (string | number)[][] = [];
    data?.byType.forEach((x) => rows.push(['Por tipo', x.label, x.value]));
    data?.byDepartment.forEach((x) => rows.push(['Por área', x.label, x.value]));
    data?.topEmployees.forEach((x) => rows.push(['Top empleados', x.name, x.days]));
    exportCsv('reporte-ausentismo', ['Sección', 'Categoría', 'Días'], rows);
  };

  return (
    <TabWrap
      onExport={exportAll}
      filters={
        <div className="flex gap-2">
          <div><Label className="mb-1.5 block text-xs">Desde</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label className="mb-1.5 block text-xs">Hasta</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
      }
    >
      {isLoading || !data ? (
        <Loading />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Días de ausencia" value={formatNumber(data.totalDays)} icon={CalendarOff} accent />
            <Kpi label="Promedio por empleado" value={`${data.avgDaysPerEmployee} días`} icon={CalendarOff} />
            <Kpi label="Pasivo de vacaciones" value={`${formatNumber(data.vacationLiability.days)} días`} icon={Plane} />
            <Kpi label="Valor pasivo vacaciones" value={formatCurrency(data.vacationLiability.value)} icon={Wallet} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <BarCard title="Días por tipo" data={data.byType} />
            <PieCard title="Por grupo" data={data.byGroup} />
            <PieCard title="Incapacidades por origen" data={data.incapacityByOrigin} />
            <BarCard title="Días por área" data={data.byDepartment} />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Empleados con más ausencias</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Empleado</TableHead><TableHead className="text-right">Días</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.topEmployees.map((e, i) => (
                    <TableRow key={i}><TableCell>{e.name}</TableCell><TableCell className="text-right">{e.days}</TableCell></TableRow>
                  ))}
                  {data.topEmployees.length === 0 && (
                    <TableRow><TableCell colSpan={2} className="py-6 text-center text-muted-foreground">Sin ausencias en el periodo.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </TabWrap>
  );
}

/* ---------------------------- Cumplimiento ----------------------------- */
function ComplianceTab() {
  const { data, isLoading } = useComplianceReport();
  if (isLoading || !data) return <Loading />;
  const exportAll = () => {
    const rows: (string | number)[][] = [];
    data.eps.forEach((x) => rows.push(['EPS', x.label, x.value]));
    data.pension.forEach((x) => rows.push(['Pensión', x.label, x.value]));
    data.arl.forEach((x) => rows.push(['ARL', x.label, x.value]));
    data.compensationFund.forEach((x) => rows.push(['Caja', x.label, x.value]));
    exportCsv('reporte-cumplimiento', ['Categoría', 'Entidad', 'Empleados'], rows);
  };
  return (
    <TabWrap onExport={exportAll}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Contratos por vencer" value={formatNumber(data.alerts.CONTRACT)} icon={ShieldCheck} />
        <Kpi label="Fin período prueba" value={formatNumber(data.alerts.PROBATION)} icon={ShieldCheck} />
        <Kpi label="Documentos por vencer" value={formatNumber(data.alerts.DOCUMENT)} icon={ShieldCheck} />
        <Kpi
          label="Habeas Data pendiente"
          value={`${data.habeasData.pending} / ${data.habeasData.total}`}
          icon={ShieldCheck}
          accent={data.habeasData.pending > 0}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarCard title="Empleados por EPS" data={data.eps} />
        <BarCard title="Por fondo de pensión" data={data.pension} />
        <BarCard title="Por ARL" data={data.arl} />
        <BarCard title="Por caja de compensación" data={data.compensationFund} />
      </div>
    </TabWrap>
  );
}

/* ----------------------------- Componentes ----------------------------- */
function TabWrap({
  children,
  onExport,
  filters,
}: {
  children: React.ReactNode;
  onExport: () => void;
  filters?: React.ReactNode;
}) {
  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>{filters}</div>
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4" /> Exportar a Excel
        </Button>
      </div>
      {children}
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? 'border-primary/40 bg-primary/5' : ''}>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={`mt-1 text-xl font-bold ${accent ? 'text-primary' : ''}`}>{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${accent ? 'text-primary' : 'text-muted-foreground/40'}`} />
      </CardContent>
    </Card>
  );
}

function BarCard({ title, data, currency }: { title: string; data: LabelValue[]; currency?: boolean }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin datos.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, data.length * 34)}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" hide tickFormatter={(v) => (currency ? `${(v / 1e6).toFixed(0)}M` : String(v))} />
              <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => (currency ? formatCurrency(v) : v)} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function PieCard({ title, data }: { title: string; data: LabelValue[] }) {
  const total = data.reduce((a, x) => a + x.value, 0);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin datos.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" innerRadius={50} outerRadius={90} paddingAngle={2}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function Loading() {
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
    </div>
  );
}
