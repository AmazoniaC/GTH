import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Search, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEmployeeOptions, useBulkPortalAccess } from '../employees.api';
import { getErrorMessage } from '@/lib/api';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

/** Creación masiva de accesos al portal para empleados sin cuenta. */
export function BulkPortalDialog({ open, onOpenChange }: Props) {
  const { data: employees = [] } = useEmployeeOptions();
  const bulk = useBulkPortalAccess();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Elegibles: sin cuenta de portal y con correo registrado.
  const eligible = useMemo(
    () => employees.filter((e) => !e.user && !!e.email),
    [employees],
  );
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter(
      (e) =>
        !q ||
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.documentNumber.includes(q),
    );
  }, [employees, search]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const allEligibleSelected = eligible.length > 0 && eligible.every((e) => selected.has(e.id));
  const toggleAll = () =>
    setSelected(allEligibleSelected ? new Set() : new Set(eligible.map((e) => e.id)));

  const generate = () => {
    if (selected.size === 0) return toast.error('Selecciona al menos un empleado.');
    bulk.mutate([...selected], {
      onSuccess: (r) => {
        toast.success(`${r.created} acceso(s) creado(s), ${r.skipped} ya tenían.`);
        if (r.errors.length) {
          toast.error(
            `${r.errors.length} sin crear: ${r.errors
              .slice(0, 3)
              .map((e) => `${e.name ?? e.documentNumber ?? ''} (${e.message})`)
              .join('; ')}${r.errors.length > 3 ? '…' : ''}`,
          );
        }
        setSelected(new Set());
        onOpenChange(false);
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear accesos al portal (masivo)</DialogTitle>
          <DialogDescription>
            La contraseña inicial de cada empleado será su número de documento. Solo se pueden
            seleccionar empleados con correo y sin acceso previo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={toggleAll} disabled={eligible.length === 0}>
              {allEligibleSelected ? 'Quitar todos' : 'Seleccionar elegibles'}
            </Button>
          </div>

          <div className="max-h-80 space-y-1 overflow-y-auto">
            {filtered.map((e) => {
              const hasAccess = !!e.user;
              const noEmail = !e.email;
              const disabled = hasAccess || noEmail;
              return (
                <label
                  key={e.id}
                  className={`flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2 ${
                    disabled ? 'opacity-60' : 'cursor-pointer hover:bg-accent'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={selected.has(e.id)}
                    onChange={() => toggle(e.id)}
                    disabled={disabled}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {e.firstName} {e.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{e.documentNumber}</p>
                  </div>
                  {hasAccess ? (
                    <Badge variant={e.user?.isActive ? 'success' : 'destructive'}>
                      {e.user?.isActive ? 'Con acceso' : 'Inhabilitado'}
                    </Badge>
                  ) : noEmail ? (
                    <Badge variant="outline">Sin correo</Badge>
                  ) : null}
                </label>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Sin empleados.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={generate} disabled={bulk.isPending}>
            <KeyRound className="h-4 w-4" />
            {bulk.isPending ? 'Creando…' : `Crear acceso (${selected.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
