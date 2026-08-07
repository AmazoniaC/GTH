/**
 * Membrete y pie de página reutilizables para los PDF con pdfkit.
 * Fuente única del encabezado corporativo (logo + datos de empresa) usado por
 * el desprendible de pago, el contrato de trabajo y demás documentos.
 */

/** Color de acento corporativo de los documentos. */
export const ACCENT = '#1f3a5f';

export interface LetterheadOrg {
  name: string;
  legalName: string | null;
  nit: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
}

/** Extrae el buffer de imagen de un data URL (png/jpg) o null si no aplica. */
export function logoBuffer(dataUrl: string | null): Buffer | null {
  if (!dataUrl) return null;
  const m = dataUrl.match(/^data:image\/(png|jpe?g);base64,(.+)$/i);
  if (!m) return null;
  try {
    return Buffer.from(m[2], 'base64');
  } catch {
    return null;
  }
}

/**
 * Dibuja el membrete (logo + datos de la empresa + línea de acento) desde la
 * posición `y` y devuelve la nueva `y` bajo el membrete.
 */
export function drawLetterhead(
  doc: PDFKit.PDFDocument,
  org: LetterheadOrg,
  left: number,
  width: number,
  y: number,
): number {
  const logo = logoBuffer(org.logoUrl);
  let textX = left;
  if (logo) {
    try {
      doc.image(logo, left, y, { height: 42 });
      textX = left + 130;
    } catch {
      /* imagen inválida: se ignora */
    }
  }
  doc.font('Helvetica-Bold').fontSize(13).fillColor(ACCENT).text(org.legalName || org.name, textX, y);
  doc.font('Helvetica').fontSize(8).fillColor('#555');
  const metaLines = [
    `NIT ${org.nit}`,
    [org.address, org.city].filter(Boolean).join(', '),
    [org.phone ? `Tel: ${org.phone}` : '', org.email].filter(Boolean).join('  ·  '),
  ].filter(Boolean);
  doc.text(metaLines.join('\n'), textX, y + 18);
  y += 52;
  doc.moveTo(left, y).lineTo(left + width, y).lineWidth(2).strokeColor(ACCENT).stroke();
  return y + 14;
}

/**
 * Dibuja el pie centrado con los datos de la empresa a la altura `y`.
 *
 * Desactiva temporalmente el margen inferior y restaura el cursor para que el
 * texto del pie —que se ubica por debajo del área de contenido— no dispare una
 * nueva página (recursión) ni desplace el flujo del contenido.
 */
export function drawFooter(
  doc: PDFKit.PDFDocument,
  org: LetterheadOrg,
  left: number,
  width: number,
  y = 720,
): void {
  const page = doc.page;
  const savedBottom = page.margins.bottom;
  const savedX = doc.x;
  const savedY = doc.y;
  page.margins.bottom = 0;
  doc.font('Helvetica').fontSize(7.5).fillColor('#999');
  const footer = [org.legalName || org.name, `NIT ${org.nit}`, org.address, org.city, org.phone, org.email]
    .filter(Boolean)
    .join('  ·  ');
  doc.text(footer, left, y, { width, align: 'center', lineBreak: false });
  page.margins.bottom = savedBottom;
  doc.x = savedX;
  doc.y = savedY;
}
