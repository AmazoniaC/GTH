import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileSpreadsheet, FileText, Loader2, Plus, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportEmployeesCsv, exportEmployeesPdf } from '../export';
import { ImportDialog } from '../components/import-dialog';
import { useDepartments, usePositions } from '../employees.api';
import { usePermissions } from '@/features/auth/use-permissions';
import { getErrorMessage } from '@/lib/api';
import { Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmployeeStatusBadge } from '@/components/shared/status-badges';
import { EmployeeForm } from '../components/employee-form';
import { useEmployees } from '../employees.api';
import { formatCurrency, getInitials } from '@/lib/utils';

export function EmployeesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [departmentId, setDepartmentId] = useState<string>('ALL');
  const [positionId, setPositionId] = useState<string>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { canManageEmployees } = usePermissions();
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();

  const runExport = async (kind: 'csv' | 'pdf') => {
    setExporting(true);
    try {
      if (kind === 'csv') await exportEmployeesCsv();
      else await exportEmployeesPdf();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  };

  const { data, isLoading } = useEmployees({
    page,
    pageSize: 10,
    search: search || undefined,
    status: status === 'ALL' ? undefined : status,
    departmentId: departmentId === 'ALL' ? undefined : departmentId,
    positionId: positionId === 'ALL' ? undefined : positionId,
  });

  const meta = data?.meta;

  return (
    <div>
      <PageHeader
        title="Empleados"
        description="Administra la información de tus colaboradores."
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => runExport('csv')}>
              <FileSpreadsheet className="h-4 w-4" /> Excel (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => runExport('pdf')}>
              <FileText className="h-4 w-4" /> PDF (imprimir)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {canManageEmployees && (
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" /> Importar
          </Button>
        )}
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> Nuevo empleado
        </Button>
      </PageHeader>

      {/* Filtros */}
      <Card className="p-4 mb-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, documento o código..."
              className="pl-10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={departmentId}
            onValueChange={(v) => {
              setDepartmentId(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las áreas</SelectItem>
              {departments?.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={positionId}
            onValueChange={(v) => {
              setPositionId(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los cargos</SelectItem>
              {positions?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="ACTIVE">Activos</SelectItem>
              <SelectItem value="ON_LEAVE">En licencia</SelectItem>
              <SelectItem value="SUSPENDED">Suspendidos</SelectItem>
              <SelectItem value="TERMINATED">Retirados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Cédula (ID)</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Salario</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((emp) => (
                  <TableRow
                    key={emp.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/employees/${emp.documentNumber}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {emp.photoUrl ? <AvatarImage src={emp.photoUrl} alt="" /> : null}
                          <AvatarFallback>
                            {getInitials(emp.firstName, emp.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{emp.position?.title ?? '—'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{emp.documentNumber}</TableCell>
                    <TableCell>{emp.position?.title ?? '—'}</TableCell>
                    <TableCell>{emp.department?.name ?? '—'}</TableCell>
                    <TableCell className="font-medium">
                      {emp.contracts?.[0]
                        ? formatCurrency(emp.contracts[0].baseSalary)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <EmployeeStatusBadge status={emp.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginación */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Página {meta.page} de {meta.totalPages} · {meta.total} empleados
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mt-4 font-medium">No hay empleados</p>
            <p className="text-sm text-muted-foreground">
              Comienza registrando tu primer colaborador.
            </p>
            <Button className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Nuevo empleado
            </Button>
          </div>
        )}
      </Card>

      <EmployeeForm open={formOpen} onOpenChange={setFormOpen} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
