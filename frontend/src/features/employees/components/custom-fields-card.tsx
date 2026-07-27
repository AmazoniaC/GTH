import { ShieldCheck, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCustomFields } from '@/features/catalog/customfields.api';
import { formatDate } from '@/lib/utils';
import type { Employee } from '@/types';

function displayValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  return String(v);
}

export function CustomFieldsCard({ employee }: { employee: Employee }) {
  const { data: defs } = useCustomFields();
  const values = (employee.customFields as Record<string, unknown>) ?? {};
  const active = (defs ?? []).filter((d) => d.isActive);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" /> Información adicional
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Autorización de datos (Ley 1581)
          </span>
          {employee.dataConsent ? (
            <Badge variant="success">
              Otorgada{employee.dataConsentAt ? ` · ${formatDate(employee.dataConsentAt)}` : ''}
            </Badge>
          ) : (
            <Badge variant="warning">Pendiente</Badge>
          )}
        </div>
        {active.length > 0 ? (
          active.map((def) => (
            <div
              key={def.id}
              className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0"
            >
              <span className="text-sm text-muted-foreground">{def.label}</span>
              <span className="text-sm font-medium">{displayValue(values[def.key])}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Sin campos personalizados configurados.</p>
        )}
      </CardContent>
    </Card>
  );
}
