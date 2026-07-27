import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
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
import { useCreateCustomField, useCustomFields, useDeleteCustomField } from '@/features/catalog/customfields.api';
import { getErrorMessage } from '@/lib/api';
import type { CustomFieldType } from '@/types';

const TYPE_LABEL: Record<CustomFieldType, string> = {
  TEXT: 'Texto',
  NUMBER: 'Número',
  DATE: 'Fecha',
  BOOLEAN: 'Sí / No',
  SELECT: 'Lista',
};

export function CustomFieldsSection() {
  const { data: fields, isLoading } = useCustomFields();
  const create = useCreateCustomField();
  const del = useDeleteCustomField();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ label: string; type: CustomFieldType; section: string; options: string }>({
    label: '',
    type: 'TEXT',
    section: 'Adicional',
    options: '',
  });

  const save = async () => {
    if (form.label.trim().length < 1) return toast.error('El nombre es obligatorio.');
    try {
      await create.mutateAsync({
        label: form.label,
        type: form.type,
        section: form.section || 'Adicional',
        options:
          form.type === 'SELECT'
            ? form.options.split(',').map((o) => o.trim()).filter(Boolean)
            : undefined,
      });
      toast.success('Campo creado');
      setForm({ label: '', type: 'TEXT', section: 'Adicional', options: '' });
      setOpen(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const remove = async (id: string, label: string) => {
    if (!confirm(`¿Eliminar el campo "${label}"?`)) return;
    try {
      await del.mutateAsync(id);
      toast.success('Campo eliminado');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> Campos personalizados
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Agrega campos propios de tu empresa a la ficha del empleado (pestaña “Adicional”).
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Nuevo campo
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
        ) : fields && fields.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Sección</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.label}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{TYPE_LABEL[f.type]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{f.section}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => remove(f.id, f.label)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="p-6 text-sm text-muted-foreground">Aún no hay campos personalizados.</p>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo campo personalizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre del campo</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as CustomFieldType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_LABEL) as CustomFieldType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sección</Label>
                <Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
              </div>
            </div>
            {form.type === 'SELECT' && (
              <div className="space-y-1.5">
                <Label>Opciones (separadas por coma)</Label>
                <Input
                  value={form.options}
                  placeholder="Opción 1, Opción 2, Opción 3"
                  onChange={(e) => setForm({ ...form, options: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear campo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
