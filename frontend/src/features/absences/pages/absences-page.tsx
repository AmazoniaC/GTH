import { useMemo, useState } from 'react';
import { Plus, Plane, MoreHorizontal, Pencil, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useOptions } from '@/features/catalog/catalog.api';
import { useEmployeeOptions } from '@/features/employees/employees.api';
import {
  useAbsences,
  useDeleteAbsence,
  useUpdateAbsence,
  useVacationBalance,
  useAddVacationAdjustment,
  useAbsenceApprovals,
  useReviewAbsence,
  usePendingCount,
} from '../absence.api';
import { AbsenceFormDialog } from '../absence-form-dialog';
import { GROUP_LABEL, STATUS_META, STATUS_OPTIONS, metaFor } from '../absence-meta';
import { formatDate } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';
import type { Absence, AbsenceStatus } from '@/types';

export function AbsencesPage() {
  const [tab, setTab] = useState('list');
  const { data: pending } = usePendingCount();
  return (
    <div>
      <PageHeader
        title="Vacaciones y Ausencias"
        description="Gestiona vacaciones, incapacidades, licencias y permisos del personal."
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="list">Ausencias</TabsTrigger>
          <TabsTrigger value="approvals">
            Solicitudes
            {!!pending && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                {pending}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="balances">Saldos de vacaciones</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <AbsenceList />
        </TabsContent>
        <TabsContent value="approvals">
          <ApprovalsTab />
        </TabsContent>
        <TabsContent value="balances">
          <VacationBalances />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApprovalsTab() {
  const { data: types } = useOptions('ABSENCE_TYPE');
  const { data: approvals, isLoading } = useAbsenceApprovals();
  const review = useReviewAbsence();
  const typeLabel = useMemo(
    () => Object.fromEntries((types ?? []).map((t) => [t.code, t.label])),
    [types],
  );

  const decide = (id: string, decision: 'APPROVE' | 'REJECT') => {
    let note: string | undefined;
    if (decision === 'REJECT') {
      note = window.prompt('Motivo del rechazo (opcional):') ?? undefined;
    }
    review.mutate(
      { id, decision, note },
      {
        onSuccess: () => toast.success(decision === 'APPROVE' ? 'Solicitud aprobada.' : 'Solicitud rechazada.'),
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );
  };

  return (
    <Card className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empleado</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Periodo</TableHead>
            <TableHead>Días</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead className="text-right">Decisión</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {approvals?.map((a) => (
            <TableRow key={a.id}>
              <TableCell>
                <p className="font-medium">
                  {a.employee?.firstName} {a.employee?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{a.employee?.documentNumber}</p>
              </TableCell>
              <TableCell className="text-sm">{typeLabel[a.type] ?? a.type}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(a.startDate)} → {formatDate(a.endDate)}
              </TableCell>
              <TableCell>{Number(a.days)}</TableCell>
              <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                {a.reason || '—'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => decide(a.id, 'APPROVE')}
                    disabled={review.isPending}
                  >
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => decide(a.id, 'REJECT')}
                    disabled={review.isPending}
                  >
                    Rechazar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {!isLoading && approvals?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                No hay solicitudes pendientes.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function AbsenceList() {
  const { data: types } = useOptions('ABSENCE_TYPE');
  const typeLabel = useMemo(
    () => Object.fromEntries((types ?? []).map((t) => [t.code, t.label])),
    [types],
  );

  const [filters, setFilters] = useState<{ type?: string; status?: AbsenceStatus }>({});
  const { data: absences, isLoading } = useAbsences(filters);
  const updateAbsence = useUpdateAbsence();
  const deleteAbsence = useDeleteAbsence();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Absence | null>(null);
  const [toDelete, setToDelete] = useState<Absence | null>(null);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (a: Absence) => {
    setEditing(a);
    setFormOpen(true);
  };

  const changeStatus = (a: Absence, status: AbsenceStatus) => {
    updateAbsence.mutate(
      { id: a.id, status },
      {
        onSuccess: () => toast.success('Estado actualizado.'),
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteAbsence.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success('Ausencia eliminada.');
        setToDelete(null);
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    });
  };

  return (
    <div className="mt-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div>
            <Label className="mb-1.5 block text-xs">Tipo</Label>
            <Select
              value={filters.type ?? 'ALL'}
              onValueChange={(v) => setFilters((f) => ({ ...f, type: v === 'ALL' ? undefined : v }))}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los tipos</SelectItem>
                {(types ?? [])
                  .filter((t) => t.isActive)
                  .map((t) => (
                    <SelectItem key={t.id} value={t.code}>
                      {t.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Estado</Label>
            <Select
              value={filters.status ?? 'ALL'}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, status: v === 'ALL' ? undefined : (v as AbsenceStatus) }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_META[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          Registrar ausencia
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead>Días</TableHead>
              <TableHead>Nómina</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {absences?.map((a) => {
              const meta = metaFor(a.type);
              const st = STATUS_META[a.status];
              return (
                <TableRow key={a.id}>
                  <TableCell>
                    <p className="font-medium">
                      {a.employee?.firstName} {a.employee?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.employee?.documentNumber}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{typeLabel[a.type] ?? a.type}</p>
                    <p className="text-xs text-muted-foreground">{GROUP_LABEL[meta.group]}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(a.startDate)} → {formatDate(a.endDate)}
                  </TableCell>
                  <TableCell>{Number(a.days)}</TableCell>
                  <TableCell>
                    {a.affectsPayroll ? (
                      <Badge variant="default" className="text-[10px]">
                        Afecta
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={st.variant as never}>{st.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openEdit(a)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {STATUS_OPTIONS.filter((s) => s !== a.status).map((s) => (
                          <DropdownMenuItem key={s} onClick={() => changeStatus(a, s)}>
                            Marcar: {STATUS_META[s].label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setToDelete(a)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {!isLoading && absences?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No hay ausencias registradas con esos filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AbsenceFormDialog open={formOpen} onOpenChange={setFormOpen} absence={editing} />

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar ausencia</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar esta ausencia de {toDelete?.employee?.firstName}{' '}
            {toDelete?.employee?.lastName}? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteAbsence.isPending}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VacationBalances() {
  const { data: employees } = useEmployeeOptions();
  const [employeeId, setEmployeeId] = useState('');
  const { data: balance } = useVacationBalance(employeeId || undefined);
  const addAdjustment = useAddVacationAdjustment();

  const [adjOpen, setAdjOpen] = useState(false);
  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');

  const saveAdjustment = () => {
    const value = Number(days);
    if (!value) return toast.error('Indica los días (positivos o negativos).');
    addAdjustment.mutate(
      { employeeId, days: value, reason: reason || undefined },
      {
        onSuccess: () => {
          toast.success('Saldo ajustado.');
          setAdjOpen(false);
          setDays('');
          setReason('');
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );
  };

  return (
    <div className="mt-4 space-y-4">
      <Card className="p-5">
        <Label className="mb-1.5 block text-xs">Empleado</Label>
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger className="max-w-md">
            <SelectValue placeholder="Selecciona un empleado para ver su saldo" />
          </SelectTrigger>
          <SelectContent>
            {employees?.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.firstName} {e.lastName} · {e.documentNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {balance && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BalanceCard label="Disponible" value={balance.available} highlight />
            <BalanceCard label="Causado" value={balance.accrued} />
            <BalanceCard label="Tomado" value={balance.taken} />
            <BalanceCard label="Ajustes" value={balance.adjustments} />
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setAdjOpen(true)}>
              <Wallet className="h-4 w-4" />
              Ajustar saldo
            </Button>
          </div>

          {balance.adjustmentHistory.length > 0 && (
            <Card>
              <div className="border-b border-border px-5 py-3 text-sm font-semibold">
                Historial de ajustes
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balance.adjustmentHistory.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDate(h.effectiveDate)}
                      </TableCell>
                      <TableCell className={h.days < 0 ? 'text-destructive' : 'text-success'}>
                        {h.days > 0 ? '+' : ''}
                        {h.days}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{h.reason ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}

      {!employeeId && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Plane className="mb-3 h-10 w-10 opacity-40" />
          <p>Selecciona un empleado para ver su saldo de vacaciones.</p>
        </div>
      )}

      <Dialog open={adjOpen} onOpenChange={setAdjOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar saldo de vacaciones</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Días (+ suma, − descuenta)</Label>
              <Input
                type="number"
                step="0.5"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="Ej: 5 o -2"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Motivo</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveAdjustment} disabled={addAdjustment.isPending}>
              Guardar ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BalanceCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card className={`p-5 ${highlight ? 'border-primary/40 bg-primary/5' : ''}`}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${highlight ? 'text-primary' : ''}`}>{value}</p>
      <p className="text-xs text-muted-foreground">días</p>
    </Card>
  );
}
