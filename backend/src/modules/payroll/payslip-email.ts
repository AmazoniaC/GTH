const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Frase del periodo, p. ej. "la primera quincena del mes de agosto de 2026". */
export function periodPhrase(type: string, month: number, year: number): string {
  const mes = MESES[month - 1] ?? '';
  if (type === 'BIWEEKLY_FIRST') return `la primera quincena del mes de ${mes} de ${year}`;
  if (type === 'BIWEEKLY_SECOND') return `la segunda quincena del mes de ${mes} de ${year}`;
  return `el mes de ${mes} de ${year}`;
}

interface Org {
  name: string;
  legalName: string | null;
  nit: string;
  city: string | null;
  logoUrl: string | null;
}

/**
 * Cuerpo del correo (profesional) que acompaña la colilla adjunta en PDF.
 * El texto cambia con cada periodo (primera/segunda quincena o mes).
 */
export function renderPayslipEmailBody(
  employeeName: string,
  phrase: string,
  org: Org,
): string {
  const company = esc(org.legalName || org.name);
  const logo = org.logoUrl
    ? `<img src="${org.logoUrl}" alt="" style="max-height:44px;max-width:150px;object-fit:contain" />`
    : `<div style="font-size:16px;font-weight:bold;color:#1f3a5f">${company}</div>`;

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto">
    <div style="border-bottom:2px solid #1f3a5f;padding-bottom:10px;margin-bottom:18px">
      ${logo}
      <div style="font-size:11px;color:#666;margin-top:4px">${company} · NIT ${esc(org.nit)}</div>
    </div>

    <p style="font-size:13px;line-height:1.6">Apreciado(a) <b>${esc(employeeName)}</b>,</p>

    <p style="font-size:13px;line-height:1.6">
      Reciba un cordial saludo. Adjunto a este correo encontrará su <b>comprobante de pago (colilla)</b>
      correspondiente a <b>${esc(phrase)}</b>, en formato PDF.
    </p>

    <p style="font-size:13px;line-height:1.6">
      En caso de tener alguna inquietud sobre su liquidación, por favor comuníquese con el área de
      Gestión Humana.
    </p>

    <p style="font-size:13px;line-height:1.6;margin-top:24px">
      Cordialmente,<br/>
      <b>${company}</b>
    </p>

    <p style="font-size:10px;color:#999;margin-top:22px;border-top:1px solid #eee;padding-top:8px">
      Este es un mensaje automático${org.city ? ` · ${esc(org.city)}` : ''}. Por favor no responda a este correo.
    </p>
  </div>`;
}
