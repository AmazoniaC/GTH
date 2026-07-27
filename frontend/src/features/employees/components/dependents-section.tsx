import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CatalogSelect } from '@/components/shared/catalog-select';
import {
  useCreateDependent,
  useDeleteDependent,
  useDependents,
  useUpdateDependent,
} from '../dependents.api';
import { usePermissions } from '@/features/auth/use-permissions';
import { formatDate } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';
import type { Dependent } from '@/types';

const empty = {
  relationship: '',
  firstName: '',
  lastName: '',
  documentNumber: '',
  birthDate: '',
  isBeneficiary: true,
};

export function DependentsSection({ employeeId }: { employeeId: string }) {
  const { data: dependents, isLoading } = useDependents(employeeId);
  const create = useCreateDependent(employeeId);
  const update = useUpdateDependent(employeeId);
  const remove = useDeleteDependent(employeeId);
  const { canManageEmployees } = usePermissions();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Dependent | null>(null);
  const [form, setForm] = useState(empty);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const openEdit = (d: Dependent) => {
    setEditing(d);
    setForm({
      relationship: d.relationship,
      firstName: d.firstName,
      lastName: d.lastName,
      documentNumber: d.documentNumber ?? '',
      birthDate: d.birthDate ? d.birthDate.slice(0, 10) : '',
      isBeneficiary: d.isBeneficiary,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.relationship) return toast.error('Selecciona el parentesco.');
    if (form.firstName.trim().length < 2 || form.lastName.trim().length < 2)
      return toast.error('Nombre y apellido son obligatorios.');
    const payload = {
      relationship: form.relationship,
      firstName: form.firstName,
      lastName: form.lastName,
      documentNumber: form.documentNumber || undefined,
      birthDate: form.birthDate || undefined,
      isBeneficiary: form.isBeneficiary,
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...payload });
        toast.success('Beneficiario actualizado');
      } else {
        await create.mutateAsync(payload);
        toast.success('Beneficiario agregado');
      }
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const del = async (d: Dependent) => {
    if (!confirm(`¿Eliminar a ${d.firstName} ${d.lastName}?`)) return;
    try {
      await remove.mutateAsync(d.id);
      toast.success('Beneficiario eliminado');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-primary" /> Grupo familiar / beneficiarios
        </CardTitle>
        {canManageEmployees && (
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
        ) : dependents && dependents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Parentesco</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Nacimiento</TableHead>
                <TableHead>Beneficiario</TableHead>
                {canManageEmployees && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {dependents.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    {d.firstName} {d.lastName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{d.relationship}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.documentNumber ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {d.birthDate ? formatDate(d.birthDate) : '—'}
                  </TableCell>
                  <TableCell>
                    {d.isBeneficiary ? (
                      <Badge variant="success">Sí</Badge>
                    ) : (
                      <Badge variant="secondary">No</Badge>
                    )}
                  </TableCell>
                  {canManageEmployees && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => del(d)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="p-6 text-sm text-muted-foreground">Sin beneficiarios registrados.</p>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar beneficiario' : 'Nuevo beneficiario'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Parentesco</Label>
              <CatalogSelect
                category="RELATIONSHIP"
                value={form.relationship}
                onChange={(v) => setForm({ ...form, relationship: v })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombres</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Apellidos</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Documento</Label>
                <Input
                  value={form.documentNumber}
                  onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de nacimiento</Label>
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.isBeneficiary}
                onCheckedChange={(c) => setForm({ ...form, isBeneficiary: c })}
              />
              Beneficiario de prestaciones (caja de compensación)
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
