import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  useCreateOption,
  useDeleteOption,
  useOptions,
  useUpdateOption,
} from '@/features/catalog/catalog.api';
import { getErrorMessage } from '@/lib/api';
import type { CatalogCategory, CatalogOption } from '@/types';

export function OptionsSection() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <OptionList
        category="DOCUMENT_TYPE"
        title="Tipos de documento"
        description="CC, CE, pasaporte, etc."
      />
      <OptionList
        category="CONTRACT_TYPE"
        title="Tipos de contrato"
        description="Indefinido, fijo, obra o labor…"
      />
      <OptionList
        category="EMPLOYEE_STATUS"
        title="Estados del empleado"
        description="Solo se pueden renombrar (afectan la nómina)."
      />
    </div>
  );
}

function OptionList({
  category,
  title,
  description,
}: {
  category: CatalogCategory;
  title: string;
  description: string;
}) {
  const { data: options, isLoading } = useOptions(category);
  const createOption = useCreateOption();
  const updateOption = useUpdateOption();
  const deleteOption = useDeleteOption();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogOption | null>(null);
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');

  const openNew = () => {
    setEditing(null);
    setCode('');
    setLabel('');
    setOpen(true);
  };
  const openEdit = (o: CatalogOption) => {
    setEditing(o);
    setCode(o.code);
    setLabel(o.label);
    setOpen(true);
  };

  const save = async () => {
    if (label.trim().length < 1) {
      toast.error('El nombre visible es obligatorio.');
      return;
    }
    try {
      if (editing) {
        await updateOption.mutateAsync({ id: editing.id, label });
        toast.success('Opción actualizada');
      } else {
        if (code.trim().length < 1) {
          toast.error('El código es obligatorio.');
          return;
        }
        await createOption.mutateAsync({ category, code: code.trim().toUpperCase(), label });
        toast.success('Opción creada');
      }
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const remove = async (o: CatalogOption) => {
    if (!confirm(`¿Eliminar "${o.label}"?`)) return;
    try {
      await deleteOption.mutateAsync(o.id);
      toast.success('Opción eliminada');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const canAdd = category !== 'EMPLOYEE_STATUS';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {canAdd && (
            <Button size="sm" variant="ghost" onClick={openNew}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : (
          options?.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {o.code}
                </Badge>
                <span className="text-sm">{o.label}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(o)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {o.isSystem ? (
                  <span
                    className="flex h-8 w-8 items-center justify-center text-muted-foreground/50"
                    title="Opción del sistema"
                  >
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => remove(o)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar opción' : `Nueva opción · ${title}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Código</Label>
              <Input
                value={code}
                disabled={!!editing}
                placeholder="Ej: RC"
                onChange={(e) => setCode(e.target.value)}
              />
              {editing && (
                <p className="text-xs text-muted-foreground">El código no se puede cambiar.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Nombre visible</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={createOption.isPending || updateOption.isPending}>
              {(createOption.isPending || updateOption.isPending) && (
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
