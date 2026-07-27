import { useState } from 'react';
import { toast } from 'sonner';
import { Briefcase, GraduationCap, Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CatalogSelect } from '@/components/shared/catalog-select';
import {
  useCreateEducation,
  useCreateExperience,
  useDeleteEducation,
  useDeleteExperience,
  useEducation,
  useExperience,
} from '../resume.api';
import { usePermissions } from '@/features/auth/use-permissions';
import { formatDate } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';

export function ResumeSection({ employeeId }: { employeeId: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <EducationCard employeeId={employeeId} />
      <ExperienceCard employeeId={employeeId} />
    </div>
  );
}

function EducationCard({ employeeId }: { employeeId: string }) {
  const { data, isLoading } = useEducation(employeeId);
  const create = useCreateEducation(employeeId);
  const del = useDeleteEducation(employeeId);
  const { canManageEmployees } = usePermissions();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ level: '', institution: '', title: '', endDate: '', isCompleted: true });

  const save = async () => {
    if (!form.level || form.institution.trim().length < 2)
      return toast.error('Nivel e institución son obligatorios.');
    try {
      await create.mutateAsync({
        level: form.level,
        institution: form.institution,
        title: form.title || undefined,
        endDate: form.endDate || undefined,
        isCompleted: form.isCompleted,
      });
      toast.success('Formación agregada');
      setForm({ level: '', institution: '', title: '', endDate: '', isCompleted: true });
      setOpen(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="h-4 w-4 text-primary" /> Formación académica
        </CardTitle>
        {canManageEmployees && (
          <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : data && data.length > 0 ? (
          data.map((e) => (
            <div key={e.id} className="flex items-start justify-between border-b border-border/60 pb-3 last:border-0">
              <div>
                <p className="text-sm font-medium">{e.title || e.level}</p>
                <p className="text-xs text-muted-foreground">
                  {e.institution} · {e.level}
                  {e.endDate ? ` · ${formatDate(e.endDate)}` : ''}
                </p>
                {!e.isCompleted && <Badge variant="warning" className="mt-1">En curso</Badge>}
              </div>
              {canManageEmployees && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => del.mutate(e.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Sin formación registrada.</p>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva formación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nivel educativo</Label>
              <CatalogSelect category="EDUCATION_LEVEL" value={form.level} onChange={(v) => setForm({ ...form, level: v })} />
            </div>
            <div className="space-y-1.5">
              <Label>Institución</Label>
              <Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Título / programa</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 items-end gap-4">
              <div className="space-y-1.5">
                <Label>Fecha de grado</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <Switch checked={form.isCompleted} onCheckedChange={(c) => setForm({ ...form, isCompleted: c })} />
                Finalizado
              </label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ExperienceCard({ employeeId }: { employeeId: string }) {
  const { data, isLoading } = useExperience(employeeId);
  const create = useCreateExperience(employeeId);
  const del = useDeleteExperience(employeeId);
  const { canManageEmployees } = usePermissions();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ company: '', position: '', startDate: '', endDate: '', isCurrent: false, responsibilities: '' });

  const save = async () => {
    if (form.company.trim().length < 2 || form.position.trim().length < 2)
      return toast.error('Empresa y cargo son obligatorios.');
    try {
      await create.mutateAsync({
        company: form.company,
        position: form.position,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        isCurrent: form.isCurrent,
        responsibilities: form.responsibilities || undefined,
      });
      toast.success('Experiencia agregada');
      setForm({ company: '', position: '', startDate: '', endDate: '', isCurrent: false, responsibilities: '' });
      setOpen(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Briefcase className="h-4 w-4 text-primary" /> Experiencia laboral
        </CardTitle>
        {canManageEmployees && (
          <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : data && data.length > 0 ? (
          data.map((x) => (
            <div key={x.id} className="flex items-start justify-between border-b border-border/60 pb-3 last:border-0">
              <div>
                <p className="text-sm font-medium">{x.position}</p>
                <p className="text-xs text-muted-foreground">
                  {x.company}
                  {x.startDate ? ` · ${formatDate(x.startDate)}` : ''}
                  {x.isCurrent ? ' · Actual' : x.endDate ? ` – ${formatDate(x.endDate)}` : ''}
                </p>
                {x.responsibilities && (
                  <p className="mt-1 text-xs text-muted-foreground/80 line-clamp-2">{x.responsibilities}</p>
                )}
              </div>
              {canManageEmployees && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => del.mutate(x.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Sin experiencia registrada.</p>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva experiencia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Empresa</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Cargo</Label>
                <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Desde</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Hasta</Label>
                <Input type="date" value={form.endDate} disabled={form.isCurrent} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.isCurrent} onCheckedChange={(c) => setForm({ ...form, isCurrent: c })} />
              Trabajo actual
            </label>
            <div className="space-y-1.5">
              <Label>Responsabilidades</Label>
              <Textarea value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
