export interface DocOrg {
  name: string;
  legalName?: string | null;
  nit: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
}

const ACCENT = '#1f3a5f';

/** Membrete profesional: logo a la izquierda + datos, con línea de acento. */
export function Letterhead({ org }: { org: DocOrg }) {
  const line2 = [org.address, org.city].filter(Boolean).join(', ');
  const line3 = [org.phone && `Tel: ${org.phone}`, org.email].filter(Boolean).join(' · ');
  return (
    <div className="mb-6 pb-3" style={{ borderBottom: `2px solid ${ACCENT}` }}>
      <div className="flex items-center gap-4">
        {org.logoUrl && (
          <img src={org.logoUrl} alt="" className="h-14 max-w-[170px] object-contain" />
        )}
        <div className="leading-tight">
          <p className="text-lg font-bold" style={{ color: ACCENT }}>
            {org.legalName || org.name}
          </p>
          <p className="text-xs text-muted-foreground">NIT {org.nit}</p>
          {line2 && <p className="text-xs text-muted-foreground">{line2}</p>}
          {line3 && <p className="text-xs text-muted-foreground">{line3}</p>}
        </div>
      </div>
    </div>
  );
}

/** Pie de página con los datos completos de la empresa. */
export function DocumentFooter({ org }: { org: DocOrg }) {
  const parts = [
    org.legalName || org.name,
    `NIT ${org.nit}`,
    org.address,
    org.city,
    org.phone && `Tel: ${org.phone}`,
    org.email,
  ].filter(Boolean);
  return (
    <div className="mt-10 border-t border-border pt-3 text-center text-[11px] text-muted-foreground">
      {parts.join(' · ')}
    </div>
  );
}
