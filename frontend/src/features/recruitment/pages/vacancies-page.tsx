import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Briefcase, Users, CalendarClock, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { formatCurrency } from '@/lib/utils';
import {
  useVacancies,
  useCreateVacancy,
  useRecruitmentCatalog,
  useRecruitmentSummary,
  VACANCY_STATUS_LABELS,
  WORK_MODE_LABELS,
  type ContractModality,
  type VacancyStatus,
  type WorkMode,
} from '../recruitment.api';

const STATUS_VARIANT: Record<VacancyStatus, string> = {
  OPEN: 'bg-success/15 text-success',
  DRAFT: 'bg-muted text-muted-foreground',
  PAUSED: 'bg-warning/20 text-warning-foreground',
  CLOSED: 'bg-muted text-muted-foreground',
  FILLED: 'bg-primary/15 text-primary',
  CANCELLED: 'bg-destructive/10 text-destructive',
};

export function VacanciesPage() {
  const [status, setStatus] = useState<VacancyStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: vacancies, isLoading } = useVacancies({
    status: status === 'ALL' ? undefined : status,
    search: search || undefined,
  });
  const { data: summary } = useRecruitmentSummary();

  return (
    <div>
      <PageHeader title="Contratación" description="Vacantes y procesos de selección">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva vacante
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Vacantes abiertas" value={summary?.openVacancies ?? 0} icon={Briefcase} />
        <StatCard title="Vacantes totales" value={summary?.totalVacancies ?? 0} icon={Briefcase} accent="primary" />
        <StatCard
          title="Candidatos en proceso"
          value={Object.entries(summary?.byStage ?? {})
            .filter(([s]) => !['HIRED', 'REJECTED', 'WITHDRAWN'].includes(s))
            .reduce((a, [, n]) => a + n, 0)}
          icon={Users}
          accent="warning"
        />
        <StatCard
          title="Entrevistas próximas"
          value={summary?.upcomingInterviews ?? 0}
          icon={CalendarClock}
          accent="success"
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por título, código o ciudad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={(v) => setStatus(v as VacancyStatus | 'ALL')}>
          <SelectTrigger className="sm:max-w-[200px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            {(Object.keys(VACANCY_STATUS_LABELS) as VacancyStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {VACANCY_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando vacantes...</p>
      ) : !vacancies?.length ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No hay vacantes registradas. Crea la primera con “Nueva vacante”.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vacancies.map((v) => (
            <Link key={v.id} to={`/recruitment/vacancies/${v.id}`}>
              <Card className="h-full p-5 transition-shadow hover:shadow-md">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{v.code}</p>
                    <h3 className="font-semibold leading-tight">{v.title}</h3>
                  </div>
                  <span
                    className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_VARIANT[v.status]}`}
                  >
                    {VACANCY_STATUS_LABELS[v.status]}
                  </span>
                </div>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{WORK_MODE_LABELS[v.workMode]}</Badge>
                  {v.location && (
                    <Badge variant="outline" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {v.location}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {v.salaryMin || v.salaryMax
                      ? `${formatCurrency(v.salaryMin)} – ${formatCurrency(v.salaryMax)}`
                      : 'Salario a convenir'}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {v.applicationsCount ?? 0}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {v.openings} {v.openings === 1 ? 'plaza' : 'plazas'}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <VacancyDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function VacancyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: catalog } = useRecruitmentCatalog();
  const create = useCreateVacancy();
  const [form, setForm] = useState({
    title: '',
    modality: 'INDEFINITE' as ContractModality,
    workMode: 'ONSITE' as WorkMode,
    location: '',
    salaryMin: '',
    salaryMax: '',
    openings: '1',
    hiringManager: '',
    description: '',
    requirements: '',
  });

  const modalityNote = useMemo(
    () => catalog?.modalities.find((m) => m.code === form.modality)?.note,
    [catalog, form.modality],
  );

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (form.title.trim().length < 2) {
      toast.error('El título de la vacante es obligatorio.');
      return;
    }
    try {
      await create.mutateAsync({
        title: form.title,
        modality: form.modality,
        workMode: form.workMode,
        location: form.location || null,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        openings: Number(form.openings) || 1,
        hiringManager: form.hiringManager || null,
        description: form.description || null,
        requirements: form.requirements || null,
        status: 'OPEN',
      });
      toast.success('Vacante creada.');
      onOpenChange(false);
      setForm({
        title: '',
        modality: 'INDEFINITE',
        workMode: 'ONSITE',
        location: '',
        salaryMin: '',
        salaryMax: '',
        openings: '1',
        hiringManager: '',
        description: '',
        requirements: '',
      });
    } catch (e) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'No se pudo crear.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva vacante</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Título del cargo *</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Ej: Analista de nómina" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Modalidad de contrato</Label>
              <Select value={form.modality} onValueChange={(v) => set('modality', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {catalog?.modalities.map((m) => (
                    <SelectItem key={m.code} value={m.code}>
                      {m.label}
                      {m.isDefault ? ' (recomendado)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Modelo de trabajo</Label>
              <Select value={form.workMode} onValueChange={(v) => set('workMode', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(WORK_MODE_LABELS) as WorkMode[]).map((w) => (
                    <SelectItem key={w} value={w}>
                      {WORK_MODE_LABELS[w]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {modalityNote && (
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{modalityNote}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Salario mínimo</Label>
              <Input type="number" value={form.salaryMin} onChange={(e) => set('salaryMin', e.target.value)} />
            </div>
            <div>
              <Label>Salario máximo</Label>
              <Input type="number" value={form.salaryMax} onChange={(e) => set('salaryMax', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ciudad / sede</Label>
              <Input value={form.location} onChange={(e) => set('location', e.target.value)} />
            </div>
            <div>
              <Label>N.º de plazas</Label>
              <Input type="number" min="1" value={form.openings} onChange={(e) => set('openings', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Jefe solicitante</Label>
            <Input value={form.hiringManager} onChange={(e) => set('hiringManager', e.target.value)} />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} />
          </div>
          <div>
            <Label>Requisitos</Label>
            <Textarea value={form.requirements} onChange={(e) => set('requirements', e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            Crear vacante
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
