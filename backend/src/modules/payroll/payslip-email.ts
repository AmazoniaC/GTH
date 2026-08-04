import { Prisma } from '@prisma/client';

const num = (d: Prisma.Decimal | number): number =>
  typeof d === 'number' ? d : Number(d.toString());

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});
const money = (v: Prisma.Decimal | number) => cop.format(num(v));
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
  employee: { firstName: string; lastName: string; documentNumber: string; position?: { title: string } | null };
}
interface Org {
  name: string;
  legalName: string | null;
  nit: string;
  city: string | null;
  logoUrl: string | null;
}

function rows(items: Item[], negative = false): string {
  if (!items.length) return '<tr><td colspan="2" style="color:#999;font-size:12px;padding:4px 0">Sin conceptos.</td></tr>';
  return items
    .map(
      (it, i) =>
        `<tr style="background:${i % 2 ? '#f1f5f9' : '#fff'}"><td style="padding:5px 8px;font-size:12px">${esc(it.concept)}</td><td style="padding:5px 8px;font-size:12px;text-align:right;white-space:nowrap">${negative ? '-' : ''}${money(it.amount)}</td></tr>`,
    )
    .join('');
}

/** HTML del correo con el desprendible de pago de un empleado. */
export function renderPayslipEmail(periodName: string, p: Payslip, org: Org): string {
  const earnings = p.items.filter((i) => i.type === 'EARNING');
  const deductions = p.items.filter((i) => i.type === 'DEDUCTION');
  const e = p.employee;
  const logo = org.logoUrl
    ? `<img src="${org.logoUrl}" alt="" style="max-height:46px;max-width:150px;object-fit:contain" />`
    : `<div style="font-size:16px;font-weight:bold;color:#1f3a5f">${esc(org.legalName || org.name)}</div>`;

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;max-width:620px;margin:0 auto">
    <div style="border-bottom:2px solid #1f3a5f;padding-bottom:10px;margin-bottom:16px">
      ${logo}
      <div style="font-size:11px;color:#666;margin-top:4px">${esc(org.legalName || org.name)} · NIT ${esc(org.nit)}</div>
    </div>
    <h2 style="font-size:15px;margin:0 0 2px">Desprendible de pago</h2>
    <p style="margin:0 0 12px;color:#666;font-size:12px">${esc(periodName)}${p.number ? ` · N° ${esc(p.number)}` : ''}</p>

    <p style="font-size:13px;margin:0 0 12px">
      Hola <b>${esc(e.firstName)} ${esc(e.lastName)}</b> (${esc(e.documentNumber)}),
      adjuntamos tu desprendible de pago${e.position?.title ? ` como <b>${esc(e.position.title)}</b>` : ''}.
      Días trabajados: <b>${p.workedDays}</b>.
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:10px">
      <tr><td style="font-size:12px;font-weight:bold;color:#15803d;padding:4px 8px">Devengados</td><td></td></tr>
      ${rows(earnings)}
      <tr><td style="padding:5px 8px;font-size:12px;font-weight:bold;border-top:1px solid #ddd">Total devengado</td><td style="padding:5px 8px;font-size:12px;font-weight:bold;text-align:right;border-top:1px solid #ddd">${money(p.totalEarnings)}</td></tr>
    </table>

    <table style="width:100%;border-collapse:collapse;margin-bottom:10px">
      <tr><td style="font-size:12px;font-weight:bold;color:#b91c1c;padding:4px 8px">Deducciones</td><td></td></tr>
      ${rows(deductions, true)}
      <tr><td style="padding:5px 8px;font-size:12px;font-weight:bold;border-top:1px solid #ddd">Total deducciones</td><td style="padding:5px 8px;font-size:12px;font-weight:bold;text-align:right;border-top:1px solid #ddd">-${money(p.totalDeductions)}</td></tr>
    </table>

    <div style="background:#eef2ff;border-radius:8px;padding:12px 16px;display:flex;justify-content:space-between;font-weight:bold;color:#1f3a5f">
      <span>Neto a pagar</span><span style="float:right">${money(p.netPay)}</span>
    </div>

    <p style="font-size:10px;color:#999;margin-top:18px;border-top:1px solid #eee;padding-top:8px">
      Este es un mensaje automático de ${esc(org.legalName || org.name)}${org.city ? ` · ${esc(org.city)}` : ''}. Por favor no respondas a este correo.
    </p>
  </div>`;
}
