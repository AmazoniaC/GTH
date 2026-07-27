import { useState } from 'react';
import { History, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuditLog } from '../audit.api';
import { cn } from '@/lib/utils';
import type { AuditLog } from '@/types';

const ACTION_META: Record<AuditLog['action'], { label: string; variant: 'success' | 'default' | 'destructive'; icon: typeof Plus }> = {
  CREATE: { label: 'Creación', variant: 'success', icon: Plus },
  UPDATE: { label: 'Modificación', variant: 'default', icon: Pencil },
  DELETE: { label: 'Eliminación', variant: 'destructive', icon: Trash2 },
};

const ENTITY_LABEL: Record<string, string> = {
  Employee: 'Empleado',
  Contract: 'Contrato',
  Dependent: 'Beneficiario',
  Document: 'Documento',
  User: 'Usuario',
  Import: 'Importación',
};

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  return String(v);
}

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuditLog({ page });
  const meta = data?.meta;

  return (
    <div>
      <PageHeader
        title="Auditoría"
        description="Registro de creaciones, cambios y eliminaciones en la plataforma."
      />

      <Card>
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((log) => {
                  const action = ACTION_META[log.action];
                  const Icon = action.icon;
                  const changes = log.changes ? Object.entries(log.changes) : [];
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell className="text-sm">{log.userName ?? 'Sistema'}</TableCell>
                      <TableCell>
                        <Badge variant={action.variant} className="gap-1">
                          <Icon className="h-3 w-3" /> {action.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {ENTITY_LABEL[log.entity] ?? log.entity}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{log.entityLabel ?? '—'}</p>
                        {changes.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {changes.slice(0, 4).map(([field, val]) => (
                              <p key={field} className="text-xs text-muted-foreground">
                                <span className="font-medium">{field}:</span>{' '}
                                <span className="line-through opacity-70">
                                  {formatValue(val.from)}
                                </span>{' '}
                                → {formatValue(val.to)}
                              </p>
                            ))}
                            {changes.length > 4 && (
                              <p className="text-xs text-muted-foreground/70">
                                +{changes.length - 4} campos más
                              </p>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Página {meta.page} de {meta.totalPages} · {meta.total} registros
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={cn('flex flex-col items-center justify-center py-16 text-center')}>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <History className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mt-4 font-medium">Sin registros de auditoría todavía</p>
            <p className="text-sm text-muted-foreground">
              Las acciones sobre empleados y beneficiarios quedarán registradas aquí.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
