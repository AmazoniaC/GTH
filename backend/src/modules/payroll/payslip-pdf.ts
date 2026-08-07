import PDFDocument from 'pdfkit';
import { Prisma } from '@prisma/client';
import { toNumber as num } from '../../core/utils/decimal';

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const money = (v: Prisma.Decimal | number) => cop.format(num(v));

const ACCENT = '#1f3a5f';
const ZEBRA = '#f1f5f9';

interface Item {
  type: string;
  concept: string;
  amount: Prisma.Decimal;
}
interface Payslip {
  number: string | null;
  workedDays: number;
  totalEarnings: Prisma.Decimal;
  totalDeductions: Prisma.Decimal;
  netPay: Prisma.Decimal;
  items: Item[];
  employee: { firstName: string; lastName: string; documentNumber: string; position?: { title: string } | null; department?: { name: string } | null };
}
interface Org {
  name: string;
  legalName: string | null;
  nit: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
}

function logoBuffer(dataUrl: string | null): Buffer | null {
  if (!dataUrl) return null;
  const m = dataUrl.match(/^data:image\/(png|jpe?g);base64,(.+)$/i);
  if (!m) return null;
  try {
    return Buffer.from(m[2], 'base64');
  } catch {
    return null;
  }
}

/** Genera el PDF (tamaño Carta) del desprendible de pago de un empleado. */
export function renderPayslipPdf(periodName: string, p: Payslip, org: Org): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = 40;
    const width = 612 - 80; // Letter width - margins
    let y = 40;

    // --- Membrete ---
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
    y += 14;

    // --- Título ---
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#1a1a1a').text('DESPRENDIBLE DE PAGO', left, y);
    doc.font('Helvetica').fontSize(9).fillColor('#666');
    doc.text(periodName + (p.number ? `   ·   N° ${p.number}` : ''), left, y + 16);
    y += 34;

    // --- Datos del empleado ---
    const e = p.employee;
    doc.font('Helvetica').fontSize(9).fillColor('#333');
    const info = [
      `Empleado: ${e.firstName} ${e.lastName}`,
      `Documento: ${e.documentNumber}`,
      `Cargo: ${e.position?.title ?? '—'}`,
      `Área: ${e.department?.name ?? '—'}`,
      `Días trabajados: ${p.workedDays}`,
    ];
    doc.rect(left, y, width, 42).fillColor('#f8fafc').fill();
    doc.fillColor('#333').fontSize(9);
    doc.text(info.slice(0, 3).join('\n'), left + 10, y + 7, { width: width / 2 });
    doc.text(info.slice(3).join('\n'), left + width / 2, y + 7, { width: width / 2 });
    y += 54;

    // --- Tablas de conceptos ---
    const earnings = p.items.filter((i) => i.type === 'EARNING');
    const deductions = p.items.filter((i) => i.type === 'DEDUCTION');

    const drawTable = (title: string, color: string, items: Item[], total: Prisma.Decimal, negative = false) => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(color).text(title.toUpperCase(), left, y);
      y += 14;
      const rowH = 15;
      items.forEach((it, i) => {
        if (i % 2 === 1) doc.rect(left, y, width, rowH).fillColor(ZEBRA).fill();
        doc.font('Helvetica').fontSize(9).fillColor('#333').text(it.concept, left + 6, y + 3.5, { width: width * 0.62 });
        doc.text(`${negative ? '-' : ''}${money(it.amount)}`, left, y + 3.5, { width: width - 6, align: 'right' });
        y += rowH;
      });
      if (items.length === 0) {
        doc.font('Helvetica').fontSize(9).fillColor('#999').text('Sin conceptos.', left + 6, y + 2);
        y += rowH;
      }
      doc.moveTo(left, y).lineTo(left + width, y).lineWidth(0.7).strokeColor('#ccc').stroke();
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#1a1a1a');
      doc.text(`Total ${title.toLowerCase()}`, left + 6, y + 3);
      doc.text(`${negative ? '-' : ''}${money(total)}`, left, y + 3, { width: width - 6, align: 'right' });
      y += 22;
    };

    drawTable('Devengados', '#15803d', earnings, p.totalEarnings);
    drawTable('Deducciones', '#b91c1c', deductions, p.totalDeductions, true);

    // --- Neto ---
    doc.rect(left, y, width, 30).fillColor('#eef2ff').fill();
    doc.font('Helvetica-Bold').fontSize(12).fillColor(ACCENT);
    doc.text('NETO A PAGAR', left + 12, y + 9);
    doc.text(money(p.netPay), left, y + 9, { width: width - 12, align: 'right' });
    y += 44;

    // --- Pie ---
    doc.font('Helvetica').fontSize(7.5).fillColor('#999');
    const footer = [org.legalName || org.name, `NIT ${org.nit}`, org.address, org.city, org.phone, org.email]
      .filter(Boolean)
      .join('  ·  ');
    doc.text(footer, left, 720, { width, align: 'center' });

    doc.end();
  });
}
