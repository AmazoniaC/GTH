import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateUser, useUpdateUser } from '../users.api';
import { getErrorMessage } from '@/lib/api';
import type { ManagedUser, UserRole } from '@/types';

const ROLES: UserRole[] = ['ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'EMPLOYEE'];
const ROLE_TEXT: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  HR_MANAGER: 'Gestor de RRHH',
  PAYROLL_MANAGER: 'Gestor de Nómina',
  EMPLOYEE: 'Empleado',
};

const schema = z.object({
  firstName: z.string().min(2, 'Requerido'),
  lastName: z.string().min(2, 'Requerido'),
  email: z.string().email('Correo inválido'),
  password: z.string().optional(),
  role: z.enum(['ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'EMPLOYEE', 'SUPER_ADMIN']),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function UserForm({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: ManagedUser | null;
}) {
  const isEdit = !!user;
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(user?.id ?? '');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'EMPLOYEE', isActive: true },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      user
        ? {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: '',
            role: user.role,
            isActive: user.isActive,
          }
        : { firstName: '', lastName: '', email: '', password: '', role: 'EMPLOYEE', isActive: true },
    );
  }, [open, user, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!isEdit && (!values.password || values.password.length < 6)) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      if (isEdit) {
        await updateUser.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          role: values.role,
          isActive: values.isActive,
          ...(values.password ? { password: values.password } : {}),
        });
        toast.success('Usuario actualizado');
      } else {
        await createUser.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
          role: values.role,
        });
        toast.success('Usuario creado');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const isPending = createUser.isPending || updateUser.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualiza los datos y el rol de la cuenta.'
              : 'Crea una cuenta de acceso a la plataforma.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nombres</Label>
              <Input {...register('firstName')} />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Apellidos</Label>
              <Input {...register('lastName')} />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Correo electrónico</Label>
            <Input type="email" disabled={isEdit} {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            {isEdit && (
              <p className="text-xs text-muted-foreground">El correo no se puede modificar.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>{isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}</Label>
            <Input type="password" placeholder="••••••••" {...register('password')} />
          </div>

          <div className="space-y-1.5">
            <Label>Rol</Label>
            <Select value={watch('role')} onValueChange={(v) => setValue('role', v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_TEXT[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Cuenta activa</p>
                <p className="text-xs text-muted-foreground">
                  Si se desactiva, el usuario no podrá iniciar sesión.
                </p>
              </div>
              <Switch
                checked={watch('isActive')}
                onCheckedChange={(c) => setValue('isActive', c)}
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
