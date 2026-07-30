import { toast } from 'sonner';
import { KeyRound, ShieldCheck, ShieldOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  usePortalAccess,
  useCreatePortalAccess,
  useSetPortalActive,
} from '../employees.api';
import { usePermissions } from '@/features/auth/use-permissions';
import { getErrorMessage } from '@/lib/api';

/** Gestión del acceso al portal para un empleado (crear / activar / inhabilitar). */
export function PortalAccessSection({
  employeeId,
  documentNumber,
  hasEmail,
}: {
  employeeId: string;
  documentNumber: string;
  hasEmail: boolean;
}) {
  const { data: access, isLoading } = usePortalAccess(employeeId);
  const createAccess = useCreatePortalAccess(employeeId);
  const setActive = useSetPortalActive(employeeId);
  const { canManageEmployees } = usePermissions();

  const create = () => {
    createAccess.mutate(undefined, {
      onSuccess: () => toast.success('Acceso al portal creado. Contraseña inicial: número de documento.'),
      onError: (e) => toast.error(getErrorMessage(e)),
    });
  };
  const toggle = (isActive: boolean) => {
    setActive.mutate(isActive, {
      onSuccess: () => toast.success(isActive ? 'Acceso activado.' : 'Acceso inhabilitado.'),
      onError: (e) => toast.error(getErrorMessage(e)),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4 text-primary" /> Acceso al portal
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : access?.hasAccess ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              {access.isActive ? (
                <ShieldCheck className="h-4 w-4 text-success" />
              ) : (
                <ShieldOff className="h-4 w-4 text-destructive" />
              )}
              <div>
                <p className="font-medium">{access.email}</p>
                <Badge variant={access.isActive ? 'success' : 'destructive'} className="mt-0.5">
                  {access.isActive ? 'Activo' : 'Inhabilitado'}
                </Badge>
              </div>
            </div>
            {canManageEmployees && (
              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {access.isActive ? 'Inhabilitar' : 'Activar'}
                </span>
                <Switch
                  checked={access.isActive}
                  onCheckedChange={toggle}
                  disabled={setActive.isPending}
                />
              </label>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Este empleado aún no tiene acceso al portal de autoservicio.
            </p>
            {canManageEmployees && (
              <Button onClick={create} disabled={createAccess.isPending || !hasEmail} title={!hasEmail ? 'El empleado necesita un correo' : undefined}>
                <KeyRound className="h-4 w-4" />
                Crear acceso al portal
              </Button>
            )}
          </div>
        )}
        {!hasEmail && !access?.hasAccess && (
          <p className="mt-2 text-xs text-destructive">
            El empleado necesita un correo registrado para crear su acceso.
          </p>
        )}
        {access?.hasAccess && (
          <p className="mt-3 text-xs text-muted-foreground">
            Contraseña inicial: el número de documento ({documentNumber}). Recomienda cambiarla al
            ingresar.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
