import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CalendarDays, Plane, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOptions } from '@/features/catalog/catalog.api';
import { usePermissions } from '@/features/auth/use-permissions';
import { useAbsences, useDeleteAbsence, useVacationBalance } from './absence.api';
import { AbsenceFormDialog } from './absence-form-dialog';
import { STATUS_META } from './absence-meta';
import { formatDate } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';
import type { Absence } from '@/types';

/** Sección de Vacaciones y Ausencias dentro de la ficha del empleado. */
export function AbsencesSection({ employeeId }: { employeeId: string }) {
  const { data: absences } = useAbsences({ employeeId });
  const { data: balance } = useVacationBalance(employeeId);
  const { data: types } = useOptions('ABSENCE_TYPE');
  const deleteAbsence = useDeleteAbsence();
  const { canManageEmployees } = usePermissions();

  const typeLabel = useMemo(
    () => Object.fromEntries((types ?? []).map((t) => [t.code, t.label])),
    [types],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Absence | null>(null);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (a: Absence) => {
    setEditing(a);
    setFormOpen(true);
  };
  const remove = (a: Absence) => {
    if (!confirm('¿Eliminar esta ausencia?')) return;
    deleteAbsence.mutate(a.id, {
      onSuccess: () => toast.success('Ausencia eliminada.'),
      onError: (e) => toast.error(getErrorMessage(e)),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4 text-primary" /> Vacaciones y ausencias
        </CardTitle>
        {canManageEmployees && (
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" /> Registrar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {balance && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
            <Plane className="h-4 w-4 text-primary" />
            <span>
              Saldo de vacaciones: <strong>{balance.available}</strong> días disponibles
              <span className="text-muted-foreground">
                {' '}
                (causadas {balance.accrued} · tomadas {balance.taken})
              </span>
            </span>
          </div>
        )}

        {absences && absences.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Días</TableHead>
                <TableHead>Estado</TableHead>
                {canManageEmployees && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {absences.map((a) => {
                const st = STATUS_META[a.status];
                return (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">{typeLabel[a.type] ?? a.type}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(a.startDate)} → {formatDate(a.endDate)}
                    </TableCell>
                    <TableCell>{Number(a.days)}</TableCell>
                    <TableCell>
                      <Badge variant={st.variant as never}>{st.label}</Badge>
                    </TableCell>
                    {canManageEmployees && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => remove(a)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">No hay ausencias registradas.</p>
        )}
      </CardContent>

      <AbsenceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        absence={editing}
        defaultEmployeeId={employeeId}
      />
    </Card>
  );
}
