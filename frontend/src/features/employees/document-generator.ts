import { api } from '@/lib/api';
import { formatCurrency, formatDate, fullName } from '@/lib/utils';
import { CONTRACT_TYPE_LABEL, DOCUMENT_TYPE_LABEL } from '@/components/shared/status-badges';
import type { Employee } from '@/types';

interface Org {
  name: string;
  nit: string;
}

async function getOrg(): Promise<Org> {
  const { data } = await api.get('/auth/me');
  const org = data.data.organization;
  return { name: org?.name ?? 'La Empresa', nit: org?.nit ?? '' };
}

function print(title: string, bodyHtml: string) {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body{font-family:'Times New Roman',Georgia,serif;color:#111;max-width:720px;margin:0 auto;padding:48px 40px;line-height:1.7;font-size:15px}
      .head{text-align:center;margin-bottom:36px}
      .head h1{font-size:16px;margin:0;text-transform:uppercase;letter-spacing:1px}
      .head p{margin:2px 0;font-size:13px;color:#444}
      h2{text-align:center;text-transform:uppercase;font-size:15px;letter-spacing:2px;margin:28px 0}
      p{text-align:justify;margin:0 0 14px}
      .sign{margin-top:64px}
      .sign .line{border-top:1px solid #111;width:260px;padding-top:6px;font-size:13px}
      .meta{margin-top:8px;font-size:13px;color:#333}
      @media print{@page{margin:24mm}}
    </style></head><body>${bodyHtml}
    <script>window.onload=function(){window.print()}</script></body></html>`;
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

const todayLong = () =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(),
  );

/** Certificado laboral estándar (Colombia). */
export async function generateCertificate(emp: Employee) {
  const org = await getOrg();
  const contract = emp.contracts?.[0];
  const docLabel = DOCUMENT_TYPE_LABEL[emp.documentType] ?? emp.documentType;
  const salary = contract ? formatCurrency(contract.baseSalary) : '';
  const contractType = contract ? (CONTRACT_TYPE_LABEL[contract.type] ?? contract.type) : '';

  const body = `
    <div class="head">
      <h1>${org.name}</h1>
      ${org.nit ? `<p>NIT: ${org.nit}</p>` : ''}
    </div>
    <h2>Certificado Laboral</h2>
    <p>${org.name}${org.nit ? `, con NIT ${org.nit},` : ''} hace constar que el(la) señor(a)
    <b>${fullName(emp)}</b>, identificado(a) con ${docLabel} No. <b>${emp.documentNumber}</b>,
    labora en nuestra empresa desde el <b>${formatDate(emp.hireDate)}</b>, desempeñando el cargo de
    <b>${emp.position?.title ?? '—'}</b>${emp.department?.name ? ` en el área de ${emp.department.name}` : ''}
    ${contract ? `, mediante contrato a ${contractType.toLowerCase()}` : ''}
    ${salary ? `, devengando un salario mensual de <b>${salary}</b>` : ''}.</p>
    <p>La presente certificación se expide a solicitud del(la) interesado(a), a los ${todayLong()}.</p>
    <div class="sign">
      <div class="line">Firma autorizada<br/>Recursos Humanos — ${org.name}</div>
    </div>`;
  print('Certificado Laboral', body);
}

/** Contrato individual de trabajo (borrador base). */
export async function generateContract(emp: Employee) {
  const org = await getOrg();
  const contract = emp.contracts?.[0];
  if (!contract) return;
  const docLabel = DOCUMENT_TYPE_LABEL[emp.documentType] ?? emp.documentType;
  const contractType = CONTRACT_TYPE_LABEL[contract.type] ?? contract.type;

  const body = `
    <div class="head">
      <h1>${org.name}</h1>
      ${org.nit ? `<p>NIT: ${org.nit}</p>` : ''}
    </div>
    <h2>Contrato Individual de Trabajo a ${contractType}</h2>
    <p>Entre <b>${org.name}</b>${org.nit ? `, NIT ${org.nit},` : ''} en adelante EL EMPLEADOR, y
    <b>${fullName(emp)}</b>, identificado(a) con ${docLabel} No. <b>${emp.documentNumber}</b>, en
    adelante EL TRABAJADOR, se celebra el presente contrato individual de trabajo, regido por las
    siguientes cláusulas:</p>
    <p><b>PRIMERA. Cargo:</b> EL TRABAJADOR se obliga a desempeñar el cargo de
    <b>${emp.position?.title ?? '—'}</b>.</p>
    <p><b>SEGUNDA. Salario:</b> EL EMPLEADOR pagará como remuneración la suma de
    <b>${formatCurrency(contract.baseSalary)}</b> mensuales${contract.isIntegralSalary ? ' (salario integral)' : ''}.</p>
    <p><b>TERCERA. Duración:</b> El presente contrato es a ${contractType.toLowerCase()}, con fecha de
    inicio el <b>${formatDate(contract.startDate)}</b>${contract.probationEndDate ? `, con periodo de prueba hasta el ${formatDate(contract.probationEndDate)}` : ''}.</p>
    <p><b>CUARTA. Jornada y obligaciones:</b> EL TRABAJADOR cumplirá la jornada laboral legal y las
    obligaciones inherentes a su cargo, conforme al reglamento interno de trabajo.</p>
    <p>Para constancia se firma en ${emp.city ?? '_______'}, a los ${todayLong()}.</p>
    <div class="sign" style="display:flex;justify-content:space-between">
      <div class="line">EL EMPLEADOR<br/>${org.name}</div>
      <div class="line">EL TRABAJADOR<br/>${fullName(emp)}</div>
    </div>`;
  print('Contrato de Trabajo', body);
}
