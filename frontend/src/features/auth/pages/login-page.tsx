import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogoMark } from '@/components/brand/logo';
import { authApi } from '../auth.api';
import { useAuthStore } from '../auth.store';
import { getErrorMessage } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      setAuth(res.user, res.accessToken, res.refreshToken);
      toast.success(`¡Bienvenido/a, ${res.user.firstName}!`);
      navigate(res.user.role === 'EMPLOYEE' ? '/portal' : '/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden lg:flex flex-col justify-between bg-sidebar text-sidebar-foreground p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,theme(colors.blue.500),transparent_55%)]" />
        <div className="relative flex items-center gap-3">
          <LogoMark className="h-11 w-11 shrink-0" />
          <div>
            <p className="text-xl font-bold">Progrexa</p>
            <p className="text-xs uppercase tracking-widest text-sidebar-muted">Gestión de Talento Humano</p>
          </div>
        </div>

        <div className="relative space-y-8 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            La plataforma de RRHH y Nómina hecha para Colombia.
          </h1>
          <p className="text-sidebar-muted">
            Administra empleados, liquida nómina conforme a la legislación colombiana y toma
            decisiones con datos en tiempo real.
          </p>
          <div className="space-y-4">
            <Feature icon={Users} text="Gestión integral de empleados" />
            <Feature icon={TrendingUp} text="Nómina automatizada y precisa" />
            <Feature icon={ShieldCheck} text="Cumplimiento normativo garantizado" />
          </div>
        </div>

        <p className="relative text-xs text-sidebar-muted">© 2026 Progrexa · Todos los derechos reservados</p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-3">
            <LogoMark className="h-11 w-11 shrink-0" />
            <p className="text-xl font-bold">Progrexa</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Iniciar sesión</h2>
            <p className="text-muted-foreground mt-1">Ingresa tus credenciales para continuar.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" placeholder="tucorreo@empresa.co" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Ingresar
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm">{text}</span>
    </div>
  );
}
