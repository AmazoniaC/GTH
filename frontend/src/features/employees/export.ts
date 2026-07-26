import { fetchAllEmployees } from './employees.api';
import { fullName } from '@/lib/utils';
import type { Employee } from '@/types';

const COLUMNS: { header: string; value: (e: Employee) => string }[] = [
  { header: 'Cédula', value: (e) => e.documentNumber },
  { header: 'Tipo doc.', value: (e) => e.documentType },
  { header: 'Nombres', value: (e) => [e.firstName, e.middleName].filter(Boolean).join(' ') },
  { header: 'Apellidos', value: (e) => [e.lastName, e.secondLastName].filter(Boolean).join(' ') },
  { header: 'Correo', value: (e) => e.email ?? '' },
  { header: 'Celular', value: (e) => e.mobile ?? e.phone ?? '' },
  { header: 'Cargo', value: (e) => e.position?.title ?? '' },
  { header: 'Departamento', value: (e) => e.department?.name ?? '' },
  { header: 'Jefe', value: (e) => (e.manager ? `${e.manager.firstName} ${e.manager.lastName}` : '') },
  { header: 'Estado', value: (e) => e.status },
  { header: 'Salario', value: (e) => (e.contracts?.[0] ? String(e.contracts[0].baseSalary) : '') },
  { header: 'EPS', value: (e) => e.eps ?? '' },
  { header: 'Pensión', value: (e) => e.pensionFund ?? '' },
  { header: 'ARL', value: (e) => e.arl ?? '' },
  { header: 'Banco', value: (e) => e.bankName ?? '' },
  { header: 'Fecha ingreso', value: (e) => (e.hireDate ? e.hireDate.slice(0, 10) : '') },
];

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const stamp = () => new Date().toISOString().slice(0, 10);

/** Exporta todos los empleados a CSV (compatible con Excel, UTF-8 con BOM). */
export async function exportEmployeesCsv() {
  const employees = await fetchAllEmployees();
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = COLUMNS.map((c) => esc(c.header)).join(';');
  const rows = employees.map((e) => COLUMNS.map((c) => esc(c.value(e))).join(';'));
  const csv = '﻿' + [header, ...rows].join('\r\n');
  download(`empleados-${stamp()}.csv`, csv, 'text/csv;charset=utf-8;');
}

/** Abre una vista imprimible del listado para guardar como PDF. */
export async function exportEmployeesPdf() {
  const employees = await fetchAllEmployees();
  const rows = employees
    .map(
      (e) => `<tr>
        <td>${e.documentNumber}</td>
        <td>${fullName(e)}</td>
        <td>${e.position?.title ?? ''}</td>
        <td>${e.department?.name ?? ''}</td>
        <td>${e.status}</td>
        <td style="text-align:right">${
          e.contracts?.[0] ? Number(e.contracts[0].baseSalary).toLocaleString('es-CO') : ''
        }</td>
      </tr>`,
    )
    .join('');
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Empleados</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:24px}
      h1{font-size:18px;margin:0 0 4px} .sub{color:#64748b;font-size:12px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border-bottom:1px solid #e2e8f0;padding:7px 8px;text-align:left}
      th{background:#f1f5f9;text-transform:uppercase;font-size:10px;letter-spacing:.04em;color:#475569}
      @media print{@page{margin:14mm}}
    </style></head><body>
    <h1>Listado de empleados</h1>
    <div class="sub">Generado el ${new Date().toLocaleString('es-CO')} · ${employees.length} empleados</div>
    <table><thead><tr>
      <th>Cédula</th><th>Nombre</th><th>Cargo</th><th>Departamento</th><th>Estado</th><th style="text-align:right">Salario</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <script>window.onload=function(){window.print();}</script>
    </body></html>`;
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
