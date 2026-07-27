import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  UserCheck,
  Briefcase,
  MoreHorizontal,
  LogIn,
  Ban,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  usePlatformOrganizations,
  usePlatformSummary,
  useToggleOrganization,
  useDeleteOrganization,
  useImpersonateOrganization,
  type PlatformOrg,
} from './platform.api';
import { useAuthStore } from '@/features/auth/auth.store';
import { formatDate, formatNumber } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';

export function PlatformPage() {
  const navigate = useNavigate();
  const { data: summary, isLoading } = usePlatformSummary();
  const { data: orgs } = usePlatformOrganizations();
  const toggleOrg = useToggleOrganization();
  const deleteOrg = useDeleteOrganization();
  const impersonate = useImpersonateOrganization();
  const startImpersonation = useAuthStore((s) => s.impersonate);

  const [toDelete, setToDelete] = useState<PlatformOrg | null>(null);

  const handleImpersonate = (org: PlatformOrg) => {
    impersonate.mutate(org.id, {
      onSuccess: (data) => {
        startImpersonation(data.user, data.accessToken, data.refreshToken, org.name);
        toast.success(`Ingresaste como soporte a "${org.name}".`);
        navigate('/dashboard');
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  const handleToggle = (org: PlatformOrg) => {
    toggleOrg.mutate(
      { id: org.id, isActive: !org.isActive },
      {
        onSuccess: () =>
          toast.success(org.isActive ? 'Empresa desactivada.' : 'Empresa activada.'),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  };

  const handleDelete = () => {
    if (!toDelete) return;
    deleteOrg.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success(`Empresa "${toDelete.name}" eliminada.`);
        setToDelete(null);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

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
              <TableHead className="text-right">Acciones</TableHead>
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
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Acciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => handleImpersonate(o)}>
                        <LogIn className="mr-2 h-4 w-4" />
                        Entrar como soporte
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggle(o)}>
                        {o.isActive ? (
                          <>
                            <Ban className="mr-2 h-4 w-4" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Activar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setToDelete(o)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar empresa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {orgs?.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Aún no hay empresas registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Confirmación de eliminación */}
      <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar empresa</DialogTitle>
            <DialogDescription>
              Vas a eliminar <strong>{toDelete?.name}</strong> de forma permanente. Se borrarán
              todos sus usuarios, empleados, nóminas y datos asociados. Esta acción no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteOrg.isPending}>
              {deleteOrg.isPending ? 'Eliminando…' : 'Eliminar definitivamente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
