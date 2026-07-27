import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Monitor, Moon, Save, Sun, UserCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/features/auth/auth.store';
import { useUpdateProfile } from '@/features/users/users.api';
import { usePermissions } from '@/features/auth/use-permissions';
import { useTheme } from '@/components/theme/theme-provider';
import { DepartmentsSection } from './sections/departments-section';
import { PositionsSection } from './sections/positions-section';
import { OptionsSection } from './sections/options-section';
import { CustomFieldsSection } from './sections/custom-fields-section';
import { PayrollConfigForm } from '@/features/payroll/components/payroll-config-form';
import { getInitials } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  HR_MANAGER: 'Gestor de RRHH',
  PAYROLL_MANAGER: 'Gestor de Nómina',
  EMPLOYEE: 'Empleado',
};

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { theme, setTheme } = useTheme();
  const { isAdmin } = usePermissions();
  const updateProfile = useUpdateProfile();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [password, setPassword] = useState('');

  const saveProfile = async () => {
    if (password && password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      const updated = await updateProfile.mutateAsync({
        firstName,
        lastName,
        ...(password ? { password } : {}),
      });
      if (user) setUser({ ...user, firstName: updated.firstName, lastName: updated.lastName });
      setPassword('');
      toast.success('Perfil actualizado');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div>
      <PageHeader title="Configuración" description="Administra tu perfil, catálogos y parámetros." />

      <Tabs defaultValue="perfil">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          {isAdmin && <TabsTrigger value="departamentos">Departamentos</TabsTrigger>}
          {isAdmin && <TabsTrigger value="cargos">Cargos</TabsTrigger>}
          {isAdmin && <TabsTrigger value="listas">Listas</TabsTrigger>}
          {isAdmin && <TabsTrigger value="campos">Campos personalizados</TabsTrigger>}
          {isAdmin && <TabsTrigger value="nomina">Parámetros de nómina</TabsTrigger>}
        </TabsList>

        {/* Perfil + apariencia */}
        <TabsContent value="perfil">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserCircle className="h-4 w-4 text-primary" /> Mi perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 text-2xl">
                    <AvatarFallback>{getInitials(user?.firstName, user?.lastName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xl font-bold">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <Badge className="mt-2">{ROLE_LABEL[user?.role ?? 'EMPLOYEE']}</Badge>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Nombres</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Apellidos</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Nueva contraseña (opcional)</Label>
                    <Input
                      type="password"
                      placeholder="Dejar en blanco para no cambiar"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={saveProfile} disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Guardar cambios
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Apariencia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Elige el tema de la interfaz.</p>
                <div className="grid grid-cols-2 gap-3">
                  <ThemeOption icon={Sun} label="Claro" active={theme === 'light'} onClick={() => setTheme('light')} />
                  <ThemeOption icon={Moon} label="Oscuro" active={theme === 'dark'} onClick={() => setTheme('dark')} />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <Monitor className="h-4 w-4" /> El tema se guarda en tu navegador.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="departamentos">
            <DepartmentsSection />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="cargos">
            <PositionsSection />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="listas">
            <OptionsSection />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="campos">
            <CustomFieldsSection />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="nomina">
            <PayrollConfigForm />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function ThemeOption({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Sun;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant={active ? 'default' : 'outline'} className="h-auto flex-col gap-2 py-4" onClick={onClick}>
      <Icon className="h-5 w-5" />
      {label}
    </Button>
  );
}
