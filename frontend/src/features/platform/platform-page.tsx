import { Building2, Users, UserCheck, Briefcase } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePlatformOrganizations, usePlatformSummary } from './platform.api';
import { formatDate, formatNumber } from '@/lib/utils';

export function PlatformPage() {
  const { data: summary, isLoading } = usePlatformSummary();
  const { data: orgs } = usePlatformOrganizations();

  return (
    <div>
      <PageHeader
        title="Plataforma"
        description="Vista global de todas las empresas registradas en Progrexa."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <StatCard title="Empresas" value={formatNumber(summary?.organizations)} icon={Building2} accent="primary" />
            <StatCard title="Usuarios" value={formatNumber(summary?.users)} icon={Users} accent="primary" />
            <StatCard title="Empleados" value={formatNumber(summary?.employees)} icon={Briefcase} accent="success" />
            <StatCard title="Empleados activos" value={formatNumber(summary?.activeEmployees)} icon={UserCheck} accent="success" />
          </>
        )}
      </div>

      <Card className="mt-6">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold">Empresas registradas</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>NIT</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Usuarios</TableHead>
              <TableHead>Empleados</TableHead>
              <TableHead>Registrada</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs?.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <p className="font-medium">{o.name}</p>
                  {o.email && <p className="text-xs text-muted-foreground">{o.email}</p>}
                </TableCell>
                <TableCell className="text-muted-foreground">{o.nit}</TableCell>
                <TableCell className="text-muted-foreground">{o.city ?? '—'}</TableCell>
                <TableCell>{o._count.users}</TableCell>
                <TableCell>{o._count.employees}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant={o.isActive ? 'success' : 'destructive'}>
                    {o.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
