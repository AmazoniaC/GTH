import PDFDocument from 'pdfkit';
import { Prisma } from '@prisma/client';
import { toNumber as num } from '../../core/utils/decimal';
import { ACCENT, drawLetterhead, drawFooter, LetterheadOrg } from '../../core/pdf/letterhead';
import { getModalityRule } from '../../config/recruitment';

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const money = (v: Prisma.Decimal | number) => cop.format(num(v));

const longDate = (d: Date): string =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

export interface ContractOrg extends LetterheadOrg {
  legalRepresentative: string | null;
}

export interface ContractData {
  org: ContractOrg;
  candidate: { firstName: string; lastName: string; documentType: string; documentNumber: string };
  vacancyTitle: string;
  offer: {
    modality: string;
    positionTitle: string | null;
    baseSalary: Prisma.Decimal | number;
    isIntegralSalary: boolean;
    transportAllowance: boolean;
    paymentFrequency: 'MONTHLY' | 'BIWEEKLY';
    startDate: Date;
    endDate: Date | null;
    probationDays: number | null;
    workScheduleNote: string | null;
  };
}

/** Construye el articulado del contrato a partir de la oferta y sus datos. */
function buildClauses(data: ContractData): { title: string; body: string }[] {
  const { offer, org } = data;
  const cargo = offer.positionTitle || data.vacancyTitle;
  const rule = getModalityRule(offer.modality);
  const modalityLabel = (rule?.label ?? 'término indefinido').toLowerCase();
  const city = org.city || 'la ciudad acordada';

  // Duración según la modalidad.
  let duracion = `El presente contrato es a ${modalityLabel} y regirá a partir del ${longDate(offer.startDate)}.`;
  if (offer.endDate) {
    duracion += ` Su terminación está prevista para el ${longDate(offer.endDate)}, sin perjuicio de lo dispuesto en la ley.`;
  } else if (offer.modality === 'WORK_OR_LABOR') {
    duracion += ' Su duración corresponde al tiempo requerido para ejecutar la obra o labor contratada.';
  }

  // Período de prueba.
  const probacion =
    offer.probationDays && offer.probationDays > 0
      ? `Las partes estipulan un período de prueba de ${offer.probationDays} días calendario, contados a partir del inicio del contrato (hasta el ${longDate(addDays(offer.startDate, offer.probationDays))}), conforme a los artículos 76 a 80 del Código Sustantivo del Trabajo.`
      : 'Las partes no estipulan período de prueba.';

  // Remuneración.
  const freq = offer.paymentFrequency === 'BIWEEKLY' ? 'quincenal' : 'mensual';
  let remun = `EL EMPLEADOR pagará a EL TRABAJADOR un salario ${offer.isIntegralSalary ? 'integral ' : ''}mensual de ${money(offer.baseSalary)}, pagadero por períodos ${freq === 'quincenal' ? 'quincenales' : 'mensuales'} vencidos.`;
  if (offer.isIntegralSalary) {
    remun +=
      ' Por tratarse de salario integral (art. 132 C.S.T.), este remunera de antemano el trabajo suplementario y las prestaciones, recargos y beneficios legales, salvo las vacaciones.';
  } else if (offer.transportAllowance) {
    remun += ' Cuando por ley proceda, EL TRABAJADOR tendrá derecho al auxilio legal de transporte.';
  }

  const jornada =
    offer.workScheduleNote?.trim() ||
    'EL TRABAJADOR cumplirá la jornada máxima legal vigente, conforme al reglamento interno de trabajo.';

  return [
    { title: 'PRIMERA. OBJETO', body: `EL TRABAJADOR se obliga a prestar sus servicios personales en el cargo de ${cargo}, ejecutando las labores propias del mismo y las órdenes e instrucciones que le imparta EL EMPLEADOR.` },
    { title: 'SEGUNDA. MODALIDAD Y DURACIÓN', body: duracion },
    { title: 'TERCERA. PERÍODO DE PRUEBA', body: probacion },
    { title: 'CUARTA. REMUNERACIÓN', body: remun },
    { title: 'QUINTA. JORNADA DE TRABAJO', body: jornada },
    { title: 'SEXTA. LUGAR DE TRABAJO', body: `El servicio se prestará en ${city}, o en el lugar que EL EMPLEADOR determine conforme a la ley y a las necesidades del cargo.` },
    { title: 'SÉPTIMA. OBLIGACIONES', body: 'EL TRABAJADOR se obliga a cumplir el reglamento interno de trabajo, las políticas de la empresa y las normas de seguridad y salud en el trabajo; y EL EMPLEADOR a pagar la remuneración pactada y a garantizar la afiliación al Sistema de Seguridad Social Integral.' },
    { title: 'OCTAVA. TERMINACIÓN', body: 'El contrato podrá darse por terminado por cualquiera de las causales previstas en la ley laboral colombiana. Las partes se sujetan a lo dispuesto en el Código Sustantivo del Trabajo y demás normas concordantes.' },
  ];
}

/** Genera el PDF (tamaño Carta) del contrato individual de trabajo. */
export function renderContractPdf(data: ContractData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margins: { top: 40, bottom: 72, left: 40, right: 40 } });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = 40;
    const width = 612 - 80;
    const { org, candidate, offer } = data;

    // Pie en cada página (el membrete solo en la primera).
    doc.on('pageAdded', () => drawFooter(doc, org, left, width, 750));

    // --- Membrete + pie de la primera página ---
    let y = drawLetterhead(doc, org, left, width, 40);
    drawFooter(doc, org, left, width, 750);

    // --- Título ---
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#1a1a1a').text('CONTRATO INDIVIDUAL DE TRABAJO', left, y, { width, align: 'center' });
    const rule = getModalityRule(offer.modality);
    doc.font('Helvetica').fontSize(9.5).fillColor('#666').text(`Modalidad: ${rule?.label ?? 'Término indefinido'}`, left, doc.y + 2, { width, align: 'center' });

    // --- Preámbulo (partes) ---
    doc.moveDown(1);
    doc.x = left;
    doc.font('Helvetica').fontSize(9.5).fillColor('#333');
    const preambulo =
      `Entre ${org.legalName || org.name}, identificada con NIT ${org.nit}, representada legalmente por ` +
      `${org.legalRepresentative || 'su representante legal'} (en adelante EL EMPLEADOR), y ` +
      `${candidate.firstName} ${candidate.lastName}, identificado(a) con ${candidate.documentType} No. ${candidate.documentNumber} ` +
      `(en adelante EL TRABAJADOR), se celebra el presente contrato individual de trabajo, regido por las siguientes cláusulas:`;
    doc.text(preambulo, { width, align: 'justify' });
    doc.moveDown(0.8);

    // --- Cláusulas ---
    for (const c of buildClauses(data)) {
      // Evita que un título quede huérfano al final de la página.
      if (doc.y > 690) doc.addPage();
      doc.x = left;
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(ACCENT).text(c.title, { width });
      doc.font('Helvetica').fontSize(9.5).fillColor('#333').text(c.body, { width, align: 'justify' });
      doc.moveDown(0.6);
    }

    // --- Cierre y firmas ---
    doc.moveDown(0.5);
    doc.x = left;
    doc.font('Helvetica').fontSize(9.5).fillColor('#333').text(
      `En constancia de lo anterior, las partes firman en ${org.city || '_____________'} el ${longDate(new Date())}.`,
      { width, align: 'justify' },
    );

    // Bloque de firmas (reserva espacio; nueva página si no cabe).
    if (doc.y > 640) doc.addPage();
    const sy = doc.y + 46;
    const colW = 230;
    const col2 = left + width - colW;
    doc.lineWidth(0.8).strokeColor('#333');
    doc.moveTo(left, sy).lineTo(left + colW, sy).stroke();
    doc.moveTo(col2, sy).lineTo(col2 + colW, sy).stroke();
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1a1a1a');
    doc.text('EL EMPLEADOR', left, sy + 5, { width: colW });
    doc.text('EL TRABAJADOR', col2, sy + 5, { width: colW });
    doc.font('Helvetica').fontSize(8.5).fillColor('#555');
    doc.text(`${org.legalRepresentative || org.name}\n${org.legalName || org.name}\nNIT ${org.nit}`, left, sy + 18, { width: colW });
    doc.text(`${candidate.firstName} ${candidate.lastName}\n${candidate.documentType} ${candidate.documentNumber}`, col2, sy + 18, { width: colW });

    doc.end();
  });
}
