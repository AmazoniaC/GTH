import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AVAILABLE_MODULES,
  useCreateOrganization,
  useUpdateOrganization,
  type PlatformOrg,
} from './platform.api';
import { getErrorMessage } from '@/lib/api';
import type { AppModule } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se pasa, el diálogo funciona en modo edición/configuración. */
  org?: PlatformOrg | null;
}

const EMPTY = {
  organizationName: '',
  nit: '',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  adminPassword: '',
};

export function CompanyDialog({ open, onOpenChange, org }: Props) {
  const isEdit = !!org;
  const createOrg = useCreateOrganization();
  const updateOrg = useUpdateOrganization();

  const [form, setForm] = useState(EMPTY);
  const [modules, setModules] = useState<AppModule[]>(['EMPLOYEES', 'PAYROLL']);
  const [unlimited, setUnlimited] = useState(true);
  const [maxEmployees, setMaxEmployees] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Sincroniza el estado del formulario al abrir o cambiar de empresa.
  useEffect(() => {
    if (!open) return;
    if (org) {
      setForm(EMPTY);
      setModules(org.modules ?? []);
      setUnlimited(org.maxEmployees == null);
      setMaxEmployees(org.maxEmployees == null ? '' : String(org.maxEmployees));
      setIsActive(org.isActive);
    } else {
      setForm(EMPTY);
      setModules(['EMPLOYEES', 'PAYROLL']);
      setUnlimited(true);
      setMaxEmployees('');
      setIsActive(true);
    }
  }, [open, org]);

  const toggleModule = (key: AppModule) =>
    setModules((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));

  const limitValue = unlimited ? null : Math.max(0, Number(maxEmployees) || 0);

  const handleSubmit = () => {
    if (isEdit && org) {
      updateOrg.mutate(
        { id: org.id, modules, maxEmployees: limitValue, isActive },
        {
          onSuccess: () => {
            toast.success('Configuración de la empresa actualizada.');
            onOpenChange(false);
          },
          onError: (e) => toast.error(getErrorMessage(e)),
        },
      );
      return;
    }

    if (!form.organizationName || !form.nit || !form.adminEmail || !form.adminPassword) {
      toast.error('Completa el nombre, NIT, correo y contraseña del administrador.');
      return;
    }
    if (form.adminPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    createOrg.mutate(
      { ...form, modules, maxEmployees: limitValue },
      {
        onSuccess: () => {
          toast.success(`Empresa "${form.organizationName}" creada.`);
          onOpenChange(false);
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );
  };

  const pending = createOrg.isPending || updateOrg.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Configurar ${org?.name}` : 'Nueva empresa'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Define los módulos activos y el límite de empleados de la empresa.'
              : 'Crea la empresa y su usuario administrador, y asigna sus módulos y límites.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {!isEdit && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre de la empresa" className="sm:col-span-2">
                  <Input
                    value={form.organizationName}
                    onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                    placeholder="Mi Empresa S.A.S."
                  />
                </Field>
                <Field label="NIT">
                  <Input
                    value={form.nit}
                    onChange={(e) => setForm({ ...form, nit: e.target.value })}
                    placeholder="900123456-7"
                  />
                </Field>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="mb-3 text-sm font-semibold">Usuario administrador</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nombre">
                    <Input
                      value={form.adminFirstName}
                      onChange={(e) => setForm({ ...form, adminFirstName: e.target.value })}
                    />
                  </Field>
                  <Field label="Apellido">
                    <Input
                      value={form.adminLastName}
                      onChange={(e) => setForm({ ...form, adminLastName: e.target.value })}
                    />
                  </Field>
                  <Field label="Correo">
                    <Input
                      type="email"
                      value={form.adminEmail}
                      onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                      placeholder="admin@empresa.co"
                    />
                  </Field>
                  <Field label="Contraseña">
                    <Input
                      type="password"
                      value={form.adminPassword}
                      onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </Field>
                </div>
              </div>
            </>
          )}

          {/* Módulos activos */}
          <div>
            <Label className="mb-2 block">Módulos activos</Label>
            <div className="space-y-2">
              {AVAILABLE_MODULES.map((m) => (
                <label
                  key={m.key}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>
                  <Switch
                    checked={modules.includes(m.key)}
                    onCheckedChange={() => toggleModule(m.key)}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Límite de empleados */}
          <div>
            <Label className="mb-2 block">Límite de empleados</Label>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Sin límite</p>
                <p className="text-xs text-muted-foreground">
                  La empresa puede registrar empleados de forma ilimitada.
                </p>
              </div>
              <Switch checked={unlimited} onCheckedChange={setUnlimited} />
            </div>
            {!unlimited && (
              <Input
                type="number"
                min={0}
                className="mt-2"
                value={maxEmployees}
                onChange={(e) => setMaxEmployees(e.target.value)}
                placeholder="Ej: 50"
              />
            )}
          </div>

          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Empresa activa</p>
                <p className="text-xs text-muted-foreground">
                  Si se desactiva, la empresa no podrá operar.
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear empresa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
