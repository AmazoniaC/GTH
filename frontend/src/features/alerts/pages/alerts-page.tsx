import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/shared/stat-card';
import { useAlerts } from '../alerts.api';
import { CATEGORY_META, SEVERITY_CLASS } from '../alert-visuals';
import { cn, formatDate } from '@/lib/utils';
import type { AlertCategory } from '@/types';

const CATEGORIES: AlertCategory[] = ['CONTRACT', 'PROBATION', 'DOCUMENT', 'BIRTHDAY'];

export function AlertsPage() {
  const { data, isLoading } = useAlerts();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<AlertCategory | 'ALL'>('ALL');

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Alertas" description="Avisos accionables del área de RRHH." />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const items = (data?.items ?? []).filter((a) => filter === 'ALL' || a.category === filter);

  return (
    <div>
      <PageHeader title="Alertas" description="Avisos accionables del área de RRHH en tiempo real." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat];
          return (
            <StatCard
              key={cat}
              title={meta.label}
              value={data?.counts[cat] ?? 0}
              icon={meta.icon}
              accent={cat === 'BIRTHDAY' ? 'primary' : cat === 'DOCUMENT' ? 'warning' : 'destructive'}
            />
          );
        })}
      </div>

      <div className="mt-6 mb-4 flex flex-wrap gap-2">
        <FilterChip active={filter === 'ALL'} onClick={() => setFilter('ALL')}>
          Todas ({data?.total ?? 0})
        </FilterChip>
        {CATEGORIES.map((cat) => (
          <FilterChip key={cat} active={filter === cat} onClick={() => setFilter(cat)}>
            {CATEGORY_META[cat].label} ({data?.counts[cat] ?? 0})
          </FilterChip>
        ))}
      </div>

      {items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>
          <p className="mt-4 font-medium">Todo al día</p>
          <p className="text-sm text-muted-foreground">No hay alertas en esta categoría.</p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {items.map((a) => {
            const meta = CATEGORY_META[a.category];
            const Icon = meta.icon;
            return (
              <Card
                key={a.id}
                className="cursor-pointer transition-colors hover:border-primary/40"
                onClick={() => navigate(`/employees/${a.documentNumber}`)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                      SEVERITY_CLASS[a.severity],
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight">{a.title}</p>
                    <p className="text-sm text-muted-foreground">{a.detail}</p>
                  </div>
                  {a.date && (
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                      {formatDate(a.date)}
                    </span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {(data?.total ?? 0) === 0 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <BellRing className="h-4 w-4" /> El motor de alertas revisa contratos, periodos de prueba,
          documentos y cumpleaños automáticamente.
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button variant={active ? 'default' : 'outline'} size="sm" onClick={onClick}>
      {children}
    </Button>
  );
}
