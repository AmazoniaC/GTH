import { useState } from 'react';
import { toast } from 'sonner';
import { Building2, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDepartments } from '@/features/employees/employees.api';
import {
  useCreateDepartment,
  useDeleteDepartment,
  useUpdateDepartment,
} from '@/features/catalog/catalog.api';
import { getErrorMessage } from '@/lib/api';
import type { Department } from '@/types';

export function DepartmentsSection() {
  const { data: departments, isLoading } = useDepartments();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const openNew = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setOpen(true);
  };
  const openEdit = (d: Department) => {
    setEditing(d);
    setName(d.name);
    setDescription(d.description ?? '');
    setOpen(true);
  };

  const save = async () => {
    if (name.trim().length < 2) {
      toast.error('El nombre es obligatorio.');
      return;
    }
    try {
      if (editing) {
        await updateDept.mutateAsync({ id: editing.id, name, description });
        toast.success('Departamento actualizado');
      } else {
        await createDept.mutateAsync({ name, description });
        toast.success('Departamento creado');
      }
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const remove = async (d: Department) => {
    if (!confirm(`¿Eliminar el departamento "${d.name}"?`)) return;
    try {
      await deleteDept.mutateAsync(d.id);
      toast.success('Departamento eliminado');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4 text-primary" /> Departamentos
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
                <TableHead>Nombre</TableHead>
                <TableHead>Empleados</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments?.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{d._count?.employees ?? 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => remove(d)}
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
            <DialogTitle>{editing ? 'Editar departamento' : 'Nuevo departamento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción (opcional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={createDept.isPending || updateDept.isPending}>
              {(createDept.isPending || updateDept.isPending) && (
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
