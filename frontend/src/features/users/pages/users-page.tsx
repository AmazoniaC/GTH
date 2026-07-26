import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2, UserCog, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROLE_LABEL, useDeleteUser, useUsers } from '../users.api';
import { UserForm } from '../components/user-form';
import { useAuthStore } from '@/features/auth/auth.store';
import { formatDate, getInitials } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';
import type { ManagedUser } from '@/types';

export function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const currentUser = useAuthStore((s) => s.user);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (user: ManagedUser) => {
    setEditing(user);
    setFormOpen(true);
  };

  const handleDelete = async (user: ManagedUser) => {
    if (!confirm(`¿Eliminar a ${user.firstName} ${user.lastName}?`)) return;
    try {
      await deleteUser.mutateAsync(user.id);
      toast.success('Usuario eliminado');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Administra las cuentas de acceso y sus roles."
      >
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Nuevo usuario
        </Button>
      </PageHeader>

      <Card>
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : users && users.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(user.firstName, user.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                          {user.id === currentUser?.id && (
                            <span className="ml-2 text-xs text-primary">(tú)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                      <UserCog className="mr-1 h-3 w-3" />
                      {ROLE_LABEL[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'success' : 'destructive'}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        disabled={user.id === currentUser?.id}
                        onClick={() => handleDelete(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mt-4 font-medium">No hay usuarios</p>
            <Button className="mt-4" onClick={openNew}>
              <Plus className="h-4 w-4" /> Nuevo usuario
            </Button>
          </div>
        )}
      </Card>

      <UserForm open={formOpen} onOpenChange={setFormOpen} user={editing} />
    </div>
  );
}
