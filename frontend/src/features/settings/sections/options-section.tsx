import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
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
  useCreateOption,
  useDeleteOption,
  useOptions,
  useUpdateOption,
} from '@/features/catalog/catalog.api';
import { getErrorMessage } from '@/lib/api';
import type { CatalogCategory, CatalogOption } from '@/types';

// Categorías cuyo valor es un código con lógica asociada (se muestra el código).
const CODE_BASED = new Set<CatalogCategory>([
  'DOCUMENT_TYPE',
  'CONTRACT_TYPE',
  'EMPLOYEE_STATUS',
  'FILE_TYPE',
]);

interface ListDef {
  category: CatalogCategory;
  title: string;
  description?: string;
}

const GROUPS: { heading: string; lists: ListDef[] }[] = [
  {
    heading: 'Datos personales',
    lists: [
      { category: 'DOCUMENT_TYPE', title: 'Tipos de documento' },
      { category: 'EMPLOYEE_STATUS', title: 'Estados del empleado', description: 'Los del sistema no se eliminan.' },
      { category: 'BLOOD_TYPE', title: 'Grupo sanguíneo' },
      { category: 'NATIONALITY', title: 'Nacionalidad' },
      { category: 'COUNTRY', title: 'País' },
    ],
  },
  {
    heading: 'Organización',
    lists: [
      { category: 'COST_CENTER', title: 'Centros de costo' },
      { category: 'WORK_LOCATION', title: 'Sedes / centros de trabajo' },
    ],
  },
  {
    heading: 'Contrato y documentos',
    lists: [
      { category: 'CONTRACT_TYPE', title: 'Tipos de contrato' },
      { category: 'FILE_TYPE', title: 'Tipos de documento adjunto' },
    ],
  },
  {
    heading: 'Grupo familiar',
    lists: [{ category: 'RELATIONSHIP', title: 'Parentescos' }],
  },
  {
    heading: 'Seguridad social',
    lists: [
      { category: 'EPS', title: 'EPS (Salud)' },
      { category: 'PENSION_FUND', title: 'Fondo de pensión' },
      { category: 'SEVERANCE_FUND', title: 'Fondo de cesantías' },
      { category: 'COMPENSATION_FUND', title: 'Caja de compensación' },
      { category: 'ARL', title: 'ARL' },
    ],
  },
  {
    heading: 'Bancarios',
    lists: [
      { category: 'BANK', title: 'Bancos / Entidades' },
      { category: 'ACCOUNT_TYPE', title: 'Tipos de cuenta' },
    ],
  },
];

export function OptionsSection() {
  return (
    <div className="space-y-8">
      {GROUPS.map((group) => (
        <div key={group.heading}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {group.heading}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {group.lists.map((l) => (
              <OptionList key={l.category} {...l} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function OptionList({ category, title, description }: ListDef) {
  const codeBased = CODE_BASED.has(category);
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
    if (label.trim().length < 1) return toast.error('El nombre es obligatorio.');
    // En listas de valores el código es igual a la etiqueta.
    const finalCode = codeBased ? code.trim().toUpperCase() : label.trim();
    try {
      if (editing) {
        await updateOption.mutateAsync({
          id: editing.id,
          label,
          ...(codeBased && !editing.isSystem && finalCode !== editing.code
            ? { code: finalCode }
            : {}),
        });
        toast.success('Opción actualizada');
      } else {
        if (codeBased && finalCode.length < 1) return toast.error('El código es obligatorio.');
        await createOption.mutateAsync({ category, code: finalCode, label });
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{title}</CardTitle>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={openNew}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="max-h-64 space-y-1.5 overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : (
          options?.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-md border border-border/60 px-2.5 py-1.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                {codeBased && (
                  <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
                    {o.code}
                  </Badge>
                )}
                <span className="truncate text-sm">{o.label}</span>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(o)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {o.isSystem ? (
                  <span className="flex h-7 w-7 items-center justify-center text-muted-foreground/40">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
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
            {codeBased && (
              <div className="space-y-1.5">
                <Label>Código</Label>
                <Input
                  value={code}
                  disabled={!!editing && editing.isSystem}
                  placeholder="Ej: CC"
                  onChange={(e) => setCode(e.target.value)}
                />
                {editing && editing.isSystem ? (
                  <p className="text-xs text-muted-foreground">
                    Opción del sistema: el código no se puede cambiar.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Se actualizará en todos los registros que lo usen.
                  </p>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Nombre visible</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
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
