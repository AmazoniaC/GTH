interface PrintItem {
  type: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_COST';
  concept: string;
  amount: string | number;
}

interface PrintPayslip {
  number?: string | null;
  workedDays: number;
  totalEarnings: string | number;
  totalDeductions: string | number;
  netPay: string | number;
  employerCost: string | number;
  items: PrintItem[];
  employee: {
    firstName: string;
    lastName: string;
    employeeCode: string;
    documentNumber: string;
    position?: { title: string } | null;
    department?: { name: string } | null;
  };
}

export interface PrintPeriod {
  name: string;
  organization: {
    name: string;
    legalName?: string | null;
    nit: string;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
  };
  payslips: PrintPayslip[];
}

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});
const money = (v: string | number) => cop.format(Number(v));

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function itemsTable(items: PrintItem[], negative = false): string {
  if (items.length === 0) return '<p class="empty">Sin conceptos.</p>';
  const rows = items
    .map(
      (it) =>
        `<tr><td>${escapeHtml(it.concept)}</td><td class="num">${negative ? '-' : ''}${money(it.amount)}</td></tr>`,
    )
    .join('');
  return `<table class="zebra"><tbody>${rows}</tbody></table>`;
}

/**
 * Abre una ventana de impresión con TODOS los desprendibles de un periodo,
 * uno por página, con el membrete de la empresa. El usuario puede imprimir o
 * guardar como un solo PDF.
 */
export function printPayslips(period: PrintPeriod): void {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  const org = period.organization;

  const clean = (arr: (string | null | undefined)[], sep: string) =>
    arr.filter(Boolean).map((s) => escapeHtml(String(s))).join(sep);

  const header = clean([org.address, org.city], ', ');
  const contact = clean([org.phone ? `Tel: ${org.phone}` : '', org.email], ' · ');
  const footer = clean(
    [org.legalName || org.name, `NIT ${org.nit}`, org.address, org.city, org.phone ? `Tel: ${org.phone}` : '', org.email],
    ' · ',
  );
  const logo = org.logoUrl ? `<img class="logo" src="${org.logoUrl}" alt="" />` : '';

  const pages = period.payslips
    .map((p, i) => {
      const earnings = p.items.filter((it) => it.type === 'EARNING');
      const deductions = p.items.filter((it) => it.type === 'DEDUCTION');
      const employer = p.items.filter((it) => it.type === 'EMPLOYER_COST');
      const e = p.employee;
      return `
      <section class="page" ${i > 0 ? 'style="page-break-before:always"' : ''}>
        <header class="letterhead">
          ${logo}
          <div>
            <div class="company">${escapeHtml(org.legalName || org.name)}</div>
            <div class="meta">NIT ${escapeHtml(org.nit)}</div>
            ${header ? `<div class="meta">${header}</div>` : ''}
            ${contact ? `<div class="meta">${contact}</div>` : ''}
          </div>
        </header>

        <div class="title-row">
          <div>
            <h1>Desprendible de pago</h1>
            <div class="period">${escapeHtml(period.name)}</div>
          </div>
          ${p.number ? `<div class="docnum">N° ${escapeHtml(p.number)}</div>` : ''}
        </div>

        <div class="emp">
          <div><span>Empleado:</span> ${escapeHtml(e.firstName)} ${escapeHtml(e.lastName)}</div>
          <div><span>Documento:</span> ${escapeHtml(e.documentNumber)}</div>
          <div><span>Cargo:</span> ${escapeHtml(e.position?.title ?? '—')}</div>
          <div><span>Área:</span> ${escapeHtml(e.department?.name ?? '—')}</div>
          <div><span>Días:</span> ${p.workedDays}</div>
        </div>

        <div class="cols">
          <div>
            <h3 class="earn">Devengados</h3>
            ${itemsTable(earnings)}
            <div class="total"><span>Total devengado</span><span>${money(p.totalEarnings)}</span></div>
          </div>
          <div>
            <h3 class="ded">Deducciones</h3>
            ${itemsTable(deductions, true)}
            <div class="total"><span>Total deducciones</span><span>-${money(p.totalDeductions)}</span></div>
          </div>
        </div>

        <div class="net"><span>Neto a pagar</span><span>${money(p.netPay)}</span></div>

        <div class="employer">
          <h3>Aportes y provisiones del empleador</h3>
          ${itemsTable(employer)}
          <div class="total"><span>Costo total empleador</span><span>${money(p.employerCost)}</span></div>
        </div>

        <footer class="doc-footer">${footer}</footer>
      </section>`;
    })
    .join('');

  win.document.write(`<!doctype html>
<html lang="es"><head><meta charset="utf-8" /><title>Desprendibles · ${escapeHtml(period.name)}</title>
<style>
  * { box-sizing: border-box; }
  @page { size: letter; margin: 1.4cm 1.6cm; }
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #1a1a1a; margin: 0; font-size: 12px; }
  .page { display: flex; flex-direction: column; min-height: 24.5cm; }
  .letterhead { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #1f3a5f; padding-bottom: 10px; }
  .letterhead .logo { height: 52px; max-width: 160px; object-fit: contain; }
  .letterhead .company { font-size: 15px; font-weight: 700; color: #1f3a5f; }
  .letterhead .meta { font-size: 10px; color: #555; }
  .title-row { display: flex; justify-content: space-between; align-items: flex-end; margin: 14px 0 10px; }
  .title-row h1 { font-size: 14px; text-transform: uppercase; letter-spacing: .5px; margin: 0; }
  .title-row .period { font-size: 11px; color: #666; }
  .title-row .docnum { font-size: 11px; color: #666; font-weight: 600; }
  .emp { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px 24px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 12px; font-size: 11px; }
  .emp span { color: #888; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 14px; }
  h3 { font-size: 11px; text-transform: uppercase; letter-spacing: .5px; margin: 0 0 6px; }
  h3.earn { color: #15803d; } h3.ded { color: #b91c1c; }
  table.zebra { width: 100%; border-collapse: collapse; }
  table.zebra td { padding: 3px 6px; font-size: 11px; }
  table.zebra td.num { text-align: right; white-space: nowrap; }
  table.zebra tbody tr:nth-child(even) { background: #f1f5f9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .empty { font-size: 11px; color: #999; }
  .total { display: flex; justify-content: space-between; border-top: 1px solid #ddd; margin-top: 4px; padding-top: 4px; font-weight: 700; font-size: 11px; }
  .net { display: flex; justify-content: space-between; align-items: center; background: #eef2ff; -webkit-print-color-adjust: exact; print-color-adjust: exact; border-radius: 8px; padding: 10px 16px; margin: 16px 0; font-weight: 700; font-size: 14px; color: #1f3a5f; }
  .employer { margin-top: 6px; }
  .employer h3 { color: #666; }
  .doc-footer { margin-top: auto; border-top: 1px solid #ccc; padding-top: 6px; text-align: center; font-size: 9px; color: #888; }
</style></head>
<body>${pages}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}
