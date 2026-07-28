import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Download,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Receipt,
  UserRound,
  Plane,
  CalendarDays,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmployeeStatusBadge } from '@/components/shared/status-badges';
import {
  downloadMyDocument,
  useMyAbsences,
  useMyDocuments,
  useMyPayslips,
  useMyProfile,
  useMyVacationBalance,
  useUpdateMyContact,
} from './portal.api';
import { useOptions } from '@/features/catalog/catalog.api';
import { STATUS_META } from '@/features/absences/absence-meta';
import { useAuthStore } from '@/features/auth/auth.store';
import { formatCurrency, formatDate, fullName, getInitials } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';

export function PortalPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data: emp, isLoading, isError } = useMyProfile();
  const { data: documents } = useMyDocuments();
  const { data: payslips } = useMyPayslips();
  const { data: absences } = useMyAbsences();
  const { data: vacationBalance } = useMyVacationBalance();
  const { data: absenceTypes } = useOptions('ABSENCE_TYPE');
  const updateContact = useUpdateMyContact();
  const typeLabel = Object.fromEntries((absenceTypes ?? []).map((t) => [t.code, t.label]));

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ email: '', phone: '', mobile: '', address: '', city: '' });
  const [downloading, setDownloading] = useState<string | null>(null);

  const openEdit = () => {
    setForm({
      email: emp?.email ?? '',
      phone: emp?.phone ?? '',
      mobile: emp?.mobile ?? '',
      address: emp?.address ?? '',
      city: emp?.city ?? '',
    });
    setEditOpen(true);
  };

  const saveContact = async () => {
    try {
      await updateContact.mutateAsync(form);
      toast.success('Datos actualizados');
      setEditOpen(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const download = async (id: string) => {
    setDownloading(id);
    try {
      await downloadMyDocument(id);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDownloading(null);
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Mi portal" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (isError || !emp) {
    return (
      <div>
        <PageHeader title="Mi portal" description="Tu espacio personal." />
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <UserRound className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="mt-4 font-medium">Tu cuenta aún no está vinculada a un empleado</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Pídele a un administrador que vincule tu usuario con tu ficha de empleado desde
            Usuarios.
          </p>
        </Card>
      </div>
    );
  }

  const contract = emp.contracts?.[0];

  return (
    <div className="space-y-6">
      <PageHeader title={`Hola, ${user?.firstName} 👋`} description="Tu información personal y documentos." />

      {/* Perfil */}
      <Card>
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 text-2xl">
              {emp.photoUrl ? <AvatarImage src={emp.photoUrl} alt="" /> : null}
              <AvatarFallback>{getInitials(emp.firstName, emp.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{fullName(emp)}</h2>
                <EmployeeStatusBadge status={emp.status} />
              </div>
              <p className="text-muted-foreground">{emp.position?.title ?? '—'}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {emp.department?.name ?? '—'} · Ingreso {formatDate(emp.hireDate)}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={openEdit}>
            Actualizar mis datos
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mi información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={Mail} label="Correo" value={emp.email} />
            <Row icon={Phone} label="Celular" value={emp.mobile ?? emp.phone} />
            <Row icon={MapPin} label="Dirección" value={emp.address} />
            <Row icon={MapPin} label="Ciudad" value={emp.city} />
            {contract && (
              <Row icon={Receipt} label="Salario" value={formatCurrency(contract.baseSalary)} />
            )}
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mis documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {documents && documents.length > 0 ? (
              documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">{d.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => download(d.id)} disabled={downloading === d.id}>
                    {downloading === d.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No tienes documentos.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vacaciones y ausencias */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plane className="h-4 w-4 text-primary" /> Mis vacaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vacationBalance ? (
              <div className="grid grid-cols-3 gap-3 text-center">
                <BalanceStat label="Disponibles" value={vacationBalance.available} highlight />
                <BalanceStat label="Causadas" value={vacationBalance.accrued} />
                <BalanceStat label="Tomadas" value={vacationBalance.taken} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin información de saldo.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" /> Mis ausencias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {absences && absences.length > 0 ? (
              absences.slice(0, 6).map((a) => {
                const st = STATUS_META[a.status];
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{typeLabel[a.type] ?? a.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(a.startDate)} → {formatDate(a.endDate)} · {Number(a.days)} día(s)
                      </p>
                    </div>
                    <Badge variant={st.variant as never}>{st.label}</Badge>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No tienes ausencias registradas.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Desprendibles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis desprendibles de pago</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {payslips && payslips.length > 0 ? (
            payslips.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/payroll/payslips/${p.id}`)}
                className="flex w-full items-center justify-between rounded-lg border border-border/60 px-4 py-3 text-left transition-colors hover:border-primary/40"
              >
                <div>
                  <p className="text-sm font-medium">{p.period?.name ?? 'Nómina'}</p>
                  <p className="text-xs text-muted-foreground">Neto: {formatCurrency(p.netPay)}</p>
                </div>
                <Badge variant="secondary">Ver</Badge>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Aún no tienes desprendibles.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar mis datos de contacto</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Correo</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Celular</Label>
              <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Dirección</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono fijo</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Ciudad</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveContact} disabled={updateContact.isPending}>
              {updateContact.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BalanceStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? 'border-primary/40 bg-primary/5' : 'border-border/60'}`}>
      <p className={`text-2xl font-bold ${highlight ? 'text-primary' : ''}`}>{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="font-medium">{value || '—'}</span>
    </div>
  );
}
