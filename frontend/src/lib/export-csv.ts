/**
 * Exporta filas a un archivo CSV compatible con Excel (UTF-8 con BOM,
 * separador ';' como usa Excel en configuración regional española).
 */
export function exportCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(';'), ...rows.map((r) => r.map(esc).join(';'))];
  const csv = '﻿' + lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const stamp = new Date().toISOString().slice(0, 10);
  link.download = `${filename}-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
