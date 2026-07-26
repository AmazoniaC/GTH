import { Bell, CheckCircle2, FileText, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const NOTIFICATIONS = [
  {
    icon: FileText,
    title: 'Nómina de julio procesada',
    detail: 'La liquidación mensual está lista para aprobación.',
    time: 'Hace 2 h',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: UserPlus,
    title: 'Nuevo empleado registrado',
    detail: 'Laura Martínez fue añadida al área Comercial.',
    time: 'Ayer',
    color: 'text-success bg-success/10',
  },
  {
    icon: CheckCircle2,
    title: 'Parámetros 2026 actualizados',
    detail: 'SMMLV y auxilio de transporte configurados.',
    time: 'Hace 3 días',
    color: 'text-warning bg-warning/15',
  },
];

export function Notifications() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-semibold text-sm">Notificaciones</p>
          <span className="text-xs text-primary font-medium">3 nuevas</span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {NOTIFICATIONS.map((n, i) => (
            <div
              key={i}
              className="flex gap-3 px-4 py-3 hover:bg-muted/60 transition-colors cursor-pointer border-b border-border/50 last:border-0"
            >
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', n.color)}>
                <n.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.detail}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border p-2">
          <Button variant="ghost" size="sm" className="w-full text-primary">
            Ver todas
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
