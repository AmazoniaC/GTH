import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FileText, Printer, Plus, Pencil, Trash2, Search, Lock } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEmployeeOptions } from '@/features/employees/employees.api';
import {
  useCreateTemplate,
  useDeleteTemplate,
  useDocumentTemplates,
  useRenderDocuments,
  useTemplateVariables,
  useUpdateTemplate,
  type DocumentTemplate,
} from '../documents.api';
import { printDocuments } from '../print-documents';
import { getErrorMessage } from '@/lib/api';

export function DocumentsPage() {
  return (
    <div>
      <PageHeader
        title="Documentos y certificados"
        description="Genera certificados laborales, contratos, paz y salvo y cartas a partir de plantillas."
      />
      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate">Generar</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
        </TabsList>
        <TabsContent value="generate">
          <GenerateTab />
        </TabsContent>
        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------- Generar --------------------------------- */

function GenerateTab() {
  const { data: templates } = useDocumentTemplates();
  const { data: employees = [] } = useEmployeeOptions();
  const render = useRenderDocuments();

  const [templateId, setTemplateId] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.documentNumber.includes(q),
    );
  }, [employees, search]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const allFilteredSelected = filtered.length > 0 && filtered.every((e) => selected.has(e.id));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((e) => next.delete(e.id));
      else filtered.forEach((e) => next.add(e.id));
      return next;
    });

  const generate = () => {
    if (!templateId) return toast.error('Selecciona una plantilla.');
    if (selected.size === 0) return toast.error('Selecciona al menos un empleado.');
    render.mutate(
      { templateId, employeeIds: [...selected] },
      {
        onSuccess: (result) => {
          printDocuments(result);
          toast.success(`${result.documents.length} documento(s) generado(s).`);
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );
  };

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Documento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Plantilla</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el documento a generar" />
              </SelectTrigger>
              <SelectContent>
                {(templates ?? [])
                  .filter((t) => t.isActive)
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
            El documento se genera con el membrete de tu empresa y espacio para la firma del
            representante legal. Podrás imprimirlo o guardarlo como PDF.
          </div>
          <Button className="w-full" onClick={generate} disabled={render.isPending}>
            <Printer className="h-4 w-4" />
            {render.isPending ? 'Generando…' : `Generar (${selected.size})`}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">2. Empleados</CardTitle>
          <Button variant="ghost" size="sm" onClick={toggleAll}>
            {allFilteredSelected ? 'Quitar todos' : 'Seleccionar todos'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre o documento…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {filtered.map((e) => (
              <label
                key={e.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 px-3 py-2 hover:bg-accent"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={selected.has(e.id)}
                  onChange={() => toggle(e.id)}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {e.firstName} {e.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {e.documentNumber} · {e.position?.title ?? 'Sin cargo'}
                  </p>
                </div>
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Sin empleados.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------ Plantillas ------------------------------- */

function TemplatesTab() {
  const { data: templates } = useDocumentTemplates();
  const del = useDeleteTemplate();

  const [editing, setEditing] = useState<DocumentTemplate | null>(null);
  const [open, setOpen] = useState(false);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (t: DocumentTemplate) => {
    setEditing(t);
    setOpen(true);
  };
  const remove = (t: DocumentTemplate) => {
    if (!confirm(`¿Eliminar la plantilla "${t.name}"?`)) return;
    del.mutate(t.id, {
      onSuccess: () => toast.success('Plantilla eliminada.'),
      onError: (e) => toast.error(getErrorMessage(e)),
    });
  };

  return (
    <div className="mt-4">
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Nueva plantilla
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(templates ?? []).map((t) => (
          <Card key={t.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" /> {t.name}
                </CardTitle>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {t.isSystem ? (
                    <span className="flex h-7 w-7 items-center justify-center text-muted-foreground/40">
                      <Lock className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => remove(t)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-4 whitespace-pre-wrap text-xs text-muted-foreground">
                {t.body}
              </p>
              {!t.isActive && (
                <Badge variant="outline" className="mt-2">
                  Inactiva
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <TemplateEditor open={open} onOpenChange={setOpen} template={editing} />
    </div>
  );
}

function TemplateEditor({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  template: DocumentTemplate | null;
}) {
  const { data: variables } = useTemplateVariables();
  const create = useCreateTemplate();
  const update = useUpdateTemplate();
  const isEdit = !!template;

  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sincroniza el estado al abrir.
  useEffect(() => {
    if (open) {
      setName(template?.name ?? '');
      setBody(template?.body ?? '');
    }
  }, [open, template]);

  const insertToken = (token: string) => {
    const el = textareaRef.current;
    if (!el) {
      setBody((b) => b + token);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    setBody((b) => b.slice(0, start) + token + b.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + token.length;
    });
  };

  const save = () => {
    if (name.trim().length < 2) return toast.error('El nombre es obligatorio.');
    if (body.trim().length < 1) return toast.error('El contenido es obligatorio.');
    const onDone = () => {
      toast.success(isEdit ? 'Plantilla actualizada.' : 'Plantilla creada.');
      onOpenChange(false);
    };
    if (isEdit && template) {
      update.mutate(
        { id: template.id, name, body },
        { onSuccess: onDone, onError: (e) => toast.error(getErrorMessage(e)) },
      );
    } else {
      create.mutate({ name, body }, { onSuccess: onDone, onError: (e) => toast.error(getErrorMessage(e)) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar plantilla' : 'Nueva plantilla'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-[1.6fr_1fr]">
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5 block">Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Contenido</Label>
              <Textarea
                ref={textareaRef}
                rows={16}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Variables</Label>
            <p className="mb-2 text-xs text-muted-foreground">
              Haz clic para insertarlas en el contenido.
            </p>
            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {(variables ?? []).map((g) => (
                <div key={g.group}>
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">{g.group}</p>
                  <div className="flex flex-wrap gap-1">
                    {g.items.map((v) => (
                      <button
                        key={v.token}
                        type="button"
                        onClick={() => insertToken(v.token)}
                        title={v.token}
                        className="rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px] hover:bg-accent"
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={create.isPending || update.isPending}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
