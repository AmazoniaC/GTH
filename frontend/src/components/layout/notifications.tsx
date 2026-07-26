import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAlerts } from '@/features/alerts/alerts.api';
import { CATEGORY_META, SEVERITY_CLASS } from '@/features/alerts/alert-visuals';
import { cn } from '@/lib/utils';

export function Notifications() {
  const navigate = useNavigate();
  const { data } = useAlerts();
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="h-5 w-5" />
          {total > 0 && (
            <span className="absolute right-1 top-1 flex min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-destructive-foreground">
              {total > 9 ? '9+' : total}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Alertas</p>
          {total > 0 && <span className="text-xs font-medium text-primary">{total} pendientes</span>}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
              <p className="mt-2 text-sm text-muted-foreground">Todo al día</p>
            </div>
          ) : (
            items.slice(0, 8).map((a) => {
              const Icon = CATEGORY_META[a.category].icon;
              return (
                <button
                  key={a.id}
                  onClick={() => navigate(`/employees/${a.documentNumber}`)}
                  className="flex w-full gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/60"
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      SEVERITY_CLASS[a.severity],
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{a.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
        <div className="border-t border-border p-2">
          <Button variant="ghost" size="sm" className="w-full text-primary" onClick={() => navigate('/alerts')}>
            Ver todas las alertas
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
