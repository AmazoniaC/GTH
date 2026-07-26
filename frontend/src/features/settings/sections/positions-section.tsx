import { useState } from 'react';
import { toast } from 'sonner';
import { BriefcaseBusiness, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useDepartments, usePositions } from '@/features/employees/employees.api';
import {
  useCreatePosition,
  useDeletePosition,
  useUpdatePosition,
} from '@/features/catalog/catalog.api';
import { getErrorMessage } from '@/lib/api';
import type { Position } from '@/types';

export function PositionsSection() {
  const { data: positions, isLoading } = usePositions();
  const { data: departments } = useDepartments();
  const createPos = useCreatePosition();
  const updatePos = useUpdatePosition();
  const deletePos = useDeletePosition();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState({ code: '', title: '', departmentId: '' });

  const openNew = () => {
    setEditing(null);
    setForm({ code: '', title: '', departmentId: '' });
    setOpen(true);
  };
  const openEdit = (p: Position) => {
    setEditing(p);
    setForm({ code: p.code ?? '', title: p.title, departmentId: p.departmentId ?? '' });
    setOpen(true);
  };

  const save = async () => {
    if (form.title.trim().length < 2) {
      toast.error('El nombre del cargo es obligatorio.');
      return;
    }
    const payload = {
      title: form.title,
      code: form.code || undefined,
      departmentId: form.departmentId || null,
    };
    try {
      if (editing) {
        await updatePos.mutateAsync({ id: editing.id, ...payload });
        toast.success('Cargo actualizado');
      } else {
        await createPos.mutateAsync(payload);
        toast.success('Cargo creado');
      }
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const remove = async (p: Position) => {
    if (!confirm(`¿Eliminar el cargo "${p.title}"?`)) return;
    try {
      await deletePos.mutateAsync(p.id);
      toast.success('Cargo eliminado');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <BriefcaseBusiness className="h-4 w-4 text-primary" /> Cargos
        </CardTitle>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Empleados</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Badge>{p.code ?? '—'}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.department?.name ?? '—'}
                  </TableCell>
                  <TableCell>{p._count?.employees ?? 0}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => remove(p)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar cargo' : 'Nuevo cargo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>ID del cargo</Label>
              <Input
                placeholder="Se genera automáticamente (ej: CAR-001)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Déjalo vacío para que el sistema asigne el ID automáticamente.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Nombre del cargo</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Departamento</Label>
              <Select
                value={form.departmentId}
                onValueChange={(v) => setForm({ ...form, departmentId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={createPos.isPending || updatePos.isPending}>
              {(createPos.isPending || updatePos.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
