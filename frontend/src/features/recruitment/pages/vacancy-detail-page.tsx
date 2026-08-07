import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Plus, UserPlus, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency, getInitials } from '@/lib/utils';
import {
  useVacancy,
  useCreateApplication,
  useMoveStage,
  PIPELINE_STAGES,
  STAGE_LABELS,
  VACANCY_STATUS_LABELS,
  WORK_MODE_LABELS,
  type ApplicationStage,
} from '../recruitment.api';

interface PipeApplication {
  id: string;
  stage: ApplicationStage;
  rating?: number | null;
  candidate: { id: string; firstName: string; lastName: string; email?: string | null };
  _count?: { interviews: number };
}

export function VacancyDetailPage() {
  const { id = '' } = useParams();
  const { data: vacancy, isLoading } = useVacancy(id);
  const [addOpen, setAddOpen] = useState(false);

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando...</p>;
  if (!vacancy) return <p className="text-sm text-muted-foreground">Vacante no encontrada.</p>;

  const applications: PipeApplication[] = vacancy.applications ?? [];

  return (
    <div>
      <Link to="/recruitment" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver a vacantes
      </Link>

      <PageHeader title={vacancy.title} description={`${vacancy.code} · ${WORK_MODE_LABELS[vacancy.workMode]}`}>
        <Badge variant="secondary">{VACANCY_STATUS_LABELS[vacancy.status]}</Badge>
        <Button onClick={() => setAddOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Postular candidato
        </Button>
      </PageHeader>

      <Card className="mb-6 grid gap-4 p-5 sm:grid-cols-3">
        <Info label="Salario">
          {vacancy.salaryMin || vacancy.salaryMax
            ? `${formatCurrency(vacancy.salaryMin)} – ${formatCurrency(vacancy.salaryMax)}`
            : 'A convenir'}
        </Info>
        <Info label="Plazas">{vacancy.openings}</Info>
        <Info label="Jefe solicitante">{vacancy.hiringManager ?? '—'}</Info>
        {vacancy.description && (
          <div className="sm:col-span-3">
            <p className="text-xs font-medium text-muted-foreground">Descripción</p>
            <p className="whitespace-pre-wrap text-sm">{vacancy.description}</p>
          </div>
        )}
        {vacancy.requirements && (
          <div className="sm:col-span-3">
            <p className="text-xs font-medium text-muted-foreground">Requisitos</p>
            <p className="whitespace-pre-wrap text-sm">{vacancy.requirements}</p>
          </div>
        )}
      </Card>

      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Proceso de selección</h2>
      <div className="grid grid-flow-col auto-cols-[minmax(220px,1fr)] gap-3 overflow-x-auto pb-3">
        {PIPELINE_STAGES.map((stage) => {
          const items = applications.filter((a) => a.stage === stage);
          return (
            <div key={stage} className="rounded-xl bg-muted/40 p-2">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold">{STAGE_LABELS[stage]}</span>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((a) => (
                  <PipelineCard key={a.id} application={a} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <AddCandidateDialog vacancyId={id} open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{children}</p>
    </div>
  );
}

function PipelineCard({ application }: { application: PipeApplication }) {
  const move = useMoveStage();
  const c = application.candidate;

  return (
    <Link to={`/recruitment/applications/${application.id}`}>
      <Card className="p-3 transition-shadow hover:shadow-md">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {getInitials(c.firstName, c.lastName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {c.firstName} {c.lastName}
            </p>
            {c.email && <p className="truncate text-xs text-muted-foreground">{c.email}</p>}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        {(application._count?.interviews ?? 0) > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {application._count?.interviews} entrevista(s)
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          {application.stage !== 'REJECTED' && (
            <button
              className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive hover:bg-destructive/20"
              onClick={(e) => {
                e.preventDefault();
                move.mutate({ id: application.id, stage: 'REJECTED' });
              }}
            >
              Descartar
            </button>
          )}
        </div>
      </Card>
    </Link>
  );
}

function AddCandidateDialog({
  vacancyId,
  open,
  onOpenChange,
}: {
  vacancyId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const create = useCreateApplication();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    documentNumber: '',
    email: '',
    phone: '',
    city: '',
    source: '',
    currentPosition: '',
    expectedSalary: '',
    linkedinUrl: '',
    notes: '',
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('Nombre y apellido son obligatorios.');
      return;
    }
    try {
      await create.mutateAsync({
        vacancyId,
        candidate: {
          firstName: form.firstName,
          lastName: form.lastName,
          documentNumber: form.documentNumber || null,
          email: form.email || null,
          phone: form.phone || null,
          city: form.city || null,
          source: form.source || null,
          currentPosition: form.currentPosition || null,
          expectedSalary: form.expectedSalary ? Number(form.expectedSalary) : null,
          linkedinUrl: form.linkedinUrl || null,
          notes: form.notes || null,
        },
      });
      toast.success('Candidato postulado.');
      onOpenChange(false);
      setForm({
        firstName: '',
        lastName: '',
        documentNumber: '',
        email: '',
        phone: '',
        city: '',
        source: '',
        currentPosition: '',
        expectedSalary: '',
        linkedinUrl: '',
        notes: '',
      });
    } catch (e) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'No se pudo postular.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Postular candidato</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nombres *</Label>
              <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
            </div>
            <div>
              <Label>Apellidos *</Label>
              <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>N.º de documento</Label>
              <Input value={form.documentNumber} onChange={(e) => set('documentNumber', e.target.value)} />
            </div>
            <div>
              <Label>Ciudad</Label>
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Correo</Label>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cargo actual</Label>
              <Input value={form.currentPosition} onChange={(e) => set('currentPosition', e.target.value)} />
            </div>
            <div>
              <Label>Aspiración salarial</Label>
              <Input type="number" value={form.expectedSalary} onChange={(e) => set('expectedSalary', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fuente</Label>
              <Input value={form.source} onChange={(e) => set('source', e.target.value)} placeholder="Referido, portal..." />
            </div>
            <div>
              <Label>LinkedIn</Label>
              <Input value={form.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Postular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
