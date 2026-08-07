import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  FileText,
  Upload,
  Trash2,
  CalendarPlus,
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { formatCurrency, formatDate, getInitials, toDateInput } from '@/lib/utils';
import {
  useApplication,
  useMoveStage,
  useHire,
  useAddInterview,
  useUpdateInterview,
  useDeleteInterview,
  useSeedDocuments,
  useUpdateDocument,
  useAddDocument,
  useUpsertOffer,
  useUpdateOfferStatus,
  useSeedOnboarding,
  useUpdateOnboardingTask,
  useRecruitmentCatalog,
  STAGE_LABELS,
  INTERVIEW_TYPE_LABELS,
  PIPELINE_STAGES,
  type Application,
  type ApplicationStage,
  type ContractModality,
  type InterviewType,
  type OnboardingStatus,
} from '../recruitment.api';

const readFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const ALL_STAGES: ApplicationStage[] = [...PIPELINE_STAGES, 'REJECTED', 'WITHDRAWN'];

export function ApplicationDetailPage() {
  const { id = '' } = useParams();
  const { data: app, isLoading } = useApplication(id);
  const move = useMoveStage();
  const [hireOpen, setHireOpen] = useState(false);

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando...</p>;
  if (!app) return <p className="text-sm text-muted-foreground">Postulación no encontrada.</p>;

  const c = app.candidate;
  const isHired = app.stage === 'HIRED';

  return (
    <div>
      <Link
        to={`/recruitment/vacancies/${app.vacancy.id}`}
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        {app.vacancy.title}
      </Link>

      <PageHeader title={`${c.firstName} ${c.lastName}`} description={app.vacancy.title}>
        <Select
          value={app.stage}
          onValueChange={(v) => move.mutate({ id: app.id, stage: v as ApplicationStage })}
          disabled={isHired}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setHireOpen(true)} disabled={isHired || !app.offer}>
          <UserCheck className="mr-2 h-4 w-4" />
          {isHired ? 'Contratado' : 'Contratar'}
        </Button>
      </PageHeader>

      {isHired && (
        <Card className="mb-6 flex items-center gap-3 border-success/40 bg-success/5 p-4">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <p className="text-sm">
            Candidato contratado.{' '}
            {app.hiredEmployeeId && (
              <Link to={`/employees`} className="font-medium text-primary hover:underline">
                Ver en Empleados
              </Link>
            )}
          </p>
        </Card>
      )}

      <Tabs defaultValue="profile">
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="interviews">Entrevistas ({app.interviews.length})</TabsTrigger>
          <TabsTrigger value="documents">Documentos ({app.documents.length})</TabsTrigger>
          <TabsTrigger value="offer">Oferta / Contrato</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab app={app} />
        </TabsContent>
        <TabsContent value="interviews">
          <InterviewsTab app={app} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab app={app} />
        </TabsContent>
        <TabsContent value="offer">
          <OfferTab app={app} />
        </TabsContent>
        <TabsContent value="onboarding">
          <OnboardingTab app={app} />
        </TabsContent>
      </Tabs>

      <HireDialog applicationId={app.id} open={hireOpen} onOpenChange={setHireOpen} />
    </div>
  );
}

// ------------------------------- Perfil -------------------------------

function ProfileTab({ app }: { app: Application }) {
  const c = app.candidate;
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {getInitials(c.firstName, c.lastName)}
        </span>
        <div>
          <p className="font-semibold">
            {c.firstName} {c.lastName}
          </p>
          <p className="text-sm text-muted-foreground">{c.currentPosition ?? 'Candidato'}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Documento">{c.documentNumber ?? '—'}</Field>
        <Field label="Correo">{c.email ?? '—'}</Field>
        <Field label="Teléfono">{c.phone ?? '—'}</Field>
        <Field label="Ciudad">{c.city ?? '—'}</Field>
        <Field label="Fuente">{c.source ?? '—'}</Field>
        <Field label="Aspiración salarial">
          {c.expectedSalary ? formatCurrency(c.expectedSalary) : '—'}
        </Field>
        <Field label="Postulado el">{formatDate(app.appliedAt)}</Field>
        <Field label="LinkedIn">
          {c.linkedinUrl ? (
            <a href={c.linkedinUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
              Ver perfil
            </a>
          ) : (
            '—'
          )}
        </Field>
        <Field label="Hoja de vida">
          {c.resumeUrl ? (
            <a href={c.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
              <FileText className="h-4 w-4" /> Abrir
            </a>
          ) : (
            '—'
          )}
        </Field>
      </div>
      {c.notes && (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground">Notas</p>
          <p className="whitespace-pre-wrap text-sm">{c.notes}</p>
        </div>
      )}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{children}</p>
    </div>
  );
}

// ----------------------------- Entrevistas -----------------------------

function InterviewsTab({ app }: { app: Application }) {
  const add = useAddInterview();
  const upd = useUpdateInterview();
  const del = useDeleteInterview();
  const [type, setType] = useState<InterviewType>('VIRTUAL');
  const [scheduledAt, setScheduledAt] = useState('');
  const [interviewerName, setInterviewerName] = useState('');
  const [location, setLocation] = useState('');

  const submit = async () => {
    if (!scheduledAt) {
      toast.error('Indica la fecha y hora.');
      return;
    }
    try {
      await add.mutateAsync({
        id: app.id,
        type,
        scheduledAt: new Date(scheduledAt).toISOString(),
        interviewerName: interviewerName || null,
        location: location || null,
      });
      toast.success('Entrevista programada.');
      setScheduledAt('');
      setInterviewerName('');
      setLocation('');
    } catch {
      toast.error('No se pudo programar.');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="space-y-3 p-5 lg:col-span-1">
        <p className="font-medium">Programar entrevista</p>
        <div>
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as InterviewType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(INTERVIEW_TYPE_LABELS) as InterviewType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {INTERVIEW_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Fecha y hora</Label>
          <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        </div>
        <div>
          <Label>Entrevistador</Label>
          <Input value={interviewerName} onChange={(e) => setInterviewerName(e.target.value)} />
        </div>
        <div>
          <Label>Sala o enlace</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <Button className="w-full" onClick={submit} disabled={add.isPending}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Programar
        </Button>
      </Card>

      <div className="space-y-3 lg:col-span-2">
        {app.interviews.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">Sin entrevistas programadas.</Card>
        ) : (
          app.interviews.map((iv) => (
            <Card key={iv.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{INTERVIEW_TYPE_LABELS[iv.type]}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(iv.scheduledAt)} · {new Date(iv.scheduledAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {iv.interviewerName && <p className="text-sm">Entrevistador: {iv.interviewerName}</p>}
                  {iv.location && <p className="text-sm text-muted-foreground">{iv.location}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={iv.status === 'COMPLETED' ? 'success' : 'secondary'}>
                    {iv.status === 'SCHEDULED' ? 'Programada' : iv.status === 'COMPLETED' ? 'Realizada' : iv.status === 'NO_SHOW' ? 'No asistió' : 'Cancelada'}
                  </Badge>
                  <button onClick={() => del.mutate(iv.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {iv.status === 'SCHEDULED' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => upd.mutate({ id: iv.id, status: 'COMPLETED' })}>
                    Marcar realizada
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => upd.mutate({ id: iv.id, status: 'NO_SHOW' })}>
                    No asistió
                  </Button>
                </div>
              )}
              {iv.status === 'COMPLETED' && (
                <div className="mt-3 grid gap-2 sm:grid-cols-[120px_1fr]">
                  <div>
                    <Label className="text-xs">Puntaje (1-5)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      defaultValue={iv.score ?? ''}
                      onBlur={(e) =>
                        e.target.value && upd.mutate({ id: iv.id, score: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Retroalimentación</Label>
                    <Textarea
                      defaultValue={iv.feedback ?? ''}
                      rows={2}
                      onBlur={(e) => upd.mutate({ id: iv.id, feedback: e.target.value || null })}
                    />
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ------------------------------ Documentos ------------------------------

function DocumentsTab({ app }: { app: Application }) {
  const seed = useSeedDocuments();
  const upd = useUpdateDocument();
  const add = useAddDocument();
  const [uploading, setUploading] = useState<string | null>(null);

  const verifiedCount = app.documents.filter((d) => d.verified).length;
  const requiredPending = app.documents.filter((d) => d.required && !d.verified).length;

  const onUpload = async (docId: string, file: File) => {
    setUploading(docId);
    try {
      const dataUrl = await readFile(file);
      await upd.mutateAsync({ id: docId, fileUrl: dataUrl });
      toast.success('Documento adjuntado.');
    } catch {
      toast.error('No se pudo adjuntar.');
    } finally {
      setUploading(null);
    }
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">Validación de documentos</p>
          <p className="text-sm text-muted-foreground">
            {verifiedCount}/{app.documents.length} verificados · {requiredPending} obligatorios pendientes
          </p>
        </div>
        {app.documents.length === 0 && (
          <Button variant="outline" onClick={() => seed.mutate(app.id)} disabled={seed.isPending}>
            Cargar checklist obligatorio
          </Button>
        )}
      </div>

      {app.documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no hay documentos. Usa “Cargar checklist obligatorio” para crear la lista estándar de Colombia.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {app.documents.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {d.verified ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  {d.name}
                  {d.required && <Badge variant="outline">Obligatorio</Badge>}
                </p>
                {d.fileUrl && (
                  <a href={d.fileUrl} target="_blank" rel="noreferrer" className="ml-6 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> Ver archivo
                  </a>
                )}
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onUpload(d.id, e.target.files[0])}
                />
                <span className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs hover:bg-accent">
                  <Upload className="h-3 w-3" />
                  {uploading === d.id ? 'Subiendo...' : d.fileUrl ? 'Reemplazar' : 'Adjuntar'}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Verificado</span>
                <Switch checked={d.verified} onCheckedChange={(v) => upd.mutate({ id: d.id, verified: v })} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            add.mutate({ id: app.id, type: 'OTHER', name: 'Documento adicional', required: false })
          }
        >
          + Agregar documento
        </Button>
      </div>
    </Card>
  );
}

// -------------------------------- Oferta --------------------------------

function OfferTab({ app }: { app: Application }) {
  const { data: catalog } = useRecruitmentCatalog();
  const upsert = useUpsertOffer();
  const status = useUpdateOfferStatus();
  const offer = app.offer;

  const [form, setForm] = useState({
    modality: (offer?.modality ?? app.vacancy.modality ?? 'INDEFINITE') as ContractModality,
    positionTitle: offer?.positionTitle ?? app.vacancy.title ?? '',
    baseSalary: offer?.baseSalary ? String(offer.baseSalary) : '',
    startDate: offer?.startDate ? toDateInput(offer.startDate) : '',
    endDate: offer?.endDate ? toDateInput(offer.endDate) : '',
    probationDays: offer?.probationDays != null ? String(offer.probationDays) : '',
    isIntegralSalary: offer?.isIntegralSalary ?? false,
    transportAllowance: offer?.transportAllowance ?? true,
    workScheduleNote: offer?.workScheduleNote ?? '',
  });
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const rule = catalog?.modalities.find((m) => m.code === form.modality);

  const save = async () => {
    if (!form.baseSalary || Number(form.baseSalary) <= 0) {
      toast.error('Indica el salario base.');
      return;
    }
    if (!form.startDate) {
      toast.error('Indica la fecha de inicio.');
      return;
    }
    try {
      await upsert.mutateAsync({
        id: app.id,
        modality: form.modality,
        positionTitle: form.positionTitle || null,
        baseSalary: Number(form.baseSalary),
        isIntegralSalary: form.isIntegralSalary,
        transportAllowance: form.transportAllowance,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        probationDays: form.probationDays ? Number(form.probationDays) : null,
        workScheduleNote: form.workScheduleNote || null,
      });
      toast.success('Oferta guardada.');
    } catch (e) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'No se pudo guardar.');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="space-y-3 p-5 lg:col-span-2">
        <p className="font-medium">Condiciones del contrato</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Modalidad</Label>
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
            <Label>Cargo</Label>
            <Input value={form.positionTitle} onChange={(e) => set('positionTitle', e.target.value)} />
          </div>
          <div>
            <Label>Salario base</Label>
            <Input type="number" value={form.baseSalary} onChange={(e) => set('baseSalary', e.target.value)} />
          </div>
          <div>
            <Label>Jornada / horario</Label>
            <Input value={form.workScheduleNote} onChange={(e) => set('workScheduleNote', e.target.value)} />
          </div>
          <div>
            <Label>Fecha de inicio</Label>
            <Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </div>
          <div>
            <Label>Fecha fin {rule?.requiresEndDate ? '*' : '(si aplica)'}</Label>
            <Input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
          </div>
          <div>
            <Label>Período de prueba (días)</Label>
            <Input
              type="number"
              value={form.probationDays}
              onChange={(e) => set('probationDays', e.target.value)}
              placeholder="Sugerido por ley"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-6 pt-1">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={form.isIntegralSalary} onCheckedChange={(v) => set('isIntegralSalary', v)} />
            Salario integral
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={form.transportAllowance} onCheckedChange={(v) => set('transportAllowance', v)} />
            Auxilio de transporte
          </label>
        </div>
        {rule?.note && <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{rule.note}</p>}
        <Button onClick={save} disabled={upsert.isPending}>
          {offer ? 'Actualizar oferta' : 'Generar oferta'}
        </Button>
      </Card>

      <Card className="space-y-3 p-5">
        <p className="font-medium">Estado de la oferta</p>
        {!offer ? (
          <p className="text-sm text-muted-foreground">Genera la oferta para gestionar su envío y firma.</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              <Badge variant={offer.status === 'ACCEPTED' ? 'success' : 'secondary'}>
                {offer.status === 'DRAFT'
                  ? 'Borrador'
                  : offer.status === 'SENT'
                    ? 'Enviada'
                    : offer.status === 'ACCEPTED'
                      ? 'Aceptada'
                      : offer.status === 'DECLINED'
                        ? 'Rechazada'
                        : 'Vencida'}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              {offer.status === 'DRAFT' && (
                <Button size="sm" variant="outline" onClick={() => status.mutate({ id: app.id, status: 'SENT' })}>
                  Marcar como enviada
                </Button>
              )}
              {(offer.status === 'SENT' || offer.status === 'DRAFT') && (
                <Button size="sm" variant="outline" onClick={() => status.mutate({ id: app.id, status: 'ACCEPTED' })}>
                  Marcar aceptada
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm">Contrato firmado</span>
              <Switch
                checked={offer.signedByCandidate}
                onCheckedChange={(v) => status.mutate({ id: app.id, signedByCandidate: v })}
              />
            </div>
            {offer.signedAt && (
              <p className="text-xs text-muted-foreground">Firmado el {formatDate(offer.signedAt)}</p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

// ------------------------------ Onboarding ------------------------------

const ONBOARDING_STATUS_LABELS: Record<OnboardingStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En proceso',
  DONE: 'Completada',
  NA: 'No aplica',
};

function OnboardingTab({ app }: { app: Application }) {
  const seed = useSeedOnboarding();
  const upd = useUpdateOnboardingTask();
  const { data: catalog } = useRecruitmentCatalog();

  const catLabel = (code: string) =>
    catalog?.onboardingCategories.find((c) => c.code === code)?.label ?? code;

  const grouped = app.onboardingTasks.reduce<Record<string, typeof app.onboardingTasks>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});
  const done = app.onboardingTasks.filter((t) => t.status === 'DONE').length;

  if (app.onboardingTasks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="mb-3 text-sm text-muted-foreground">
          Genera el plan de vinculación: firma, afiliaciones a seguridad social, dotación, inducción y
          seguimiento del período de prueba.
        </p>
        <Button onClick={() => seed.mutate(app.id)} disabled={seed.isPending}>
          Generar plan de onboarding
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="mb-4">
        <p className="font-medium">Plan de vinculación</p>
        <p className="text-sm text-muted-foreground">
          {done}/{app.onboardingTasks.length} tareas completadas
        </p>
      </div>
      <div className="space-y-5">
        {Object.entries(grouped).map(([cat, tasks]) => (
          <div key={cat}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {catLabel(cat)}
            </p>
            <div className="space-y-2">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <button
                    onClick={() => upd.mutate({ id: t.id, status: t.status === 'DONE' ? 'PENDING' : 'DONE' })}
                  >
                    {t.status === 'DONE' ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <span className={`flex-1 text-sm ${t.status === 'DONE' ? 'text-muted-foreground line-through' : ''}`}>
                    {t.title}
                  </span>
                  <Select
                    value={t.status}
                    onValueChange={(v) => upd.mutate({ id: t.id, status: v as OnboardingStatus })}
                  >
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ONBOARDING_STATUS_LABELS) as OnboardingStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {ONBOARDING_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ------------------------------ Contratar ------------------------------

function HireDialog({
  applicationId,
  open,
  onOpenChange,
}: {
  applicationId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const hire = useHire();
  const [employeeCode, setEmployeeCode] = useState('');
  const [arlRiskClass, setArlRiskClass] = useState('1');

  const submit = async () => {
    try {
      const res = await hire.mutateAsync({
        id: applicationId,
        employeeCode: employeeCode || null,
        arlRiskClass: Number(arlRiskClass) || 1,
      });
      toast.success(`Empleado creado (${(res as { employeeCode?: string }).employeeCode ?? ''}).`);
      onOpenChange(false);
    } catch (e) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'No se pudo contratar.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar contratación</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Se creará el empleado y su contrato en el módulo de Talento Humano a partir de la oferta
          definida, y se generará el plan de onboarding.
        </p>
        <div className="space-y-3">
          <div>
            <Label>Código de empleado (opcional)</Label>
            <Input
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              placeholder="Por defecto: número de documento"
            />
          </div>
          <div>
            <Label>Clase de riesgo ARL (1-5)</Label>
            <Input type="number" min="1" max="5" value={arlRiskClass} onChange={(e) => setArlRiskClass(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={hire.isPending}>
            <UserCheck className="mr-2 h-4 w-4" />
            Contratar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
