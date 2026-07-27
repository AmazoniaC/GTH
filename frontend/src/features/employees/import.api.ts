import { api } from '@/lib/api';

export interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  errors: { row: number; documentNumber?: string; message: string }[];
}

// Columnas esperadas en el archivo de importación (encabezados).
export const IMPORT_COLUMNS = [
  'documentType',
  'documentNumber',
  'firstName',
  'middleName',
  'lastName',
  'secondLastName',
  'email',
  'mobile',
  'position',
  'department',
  'status',
  'contractType',
  'baseSalary',
  'hireDate',
  'eps',
  'pensionFund',
  'arl',
  'bankName',
] as const;

const HEADER_LABELS: Record<string, string> = {
  documentType: 'TipoDocumento',
  documentNumber: 'Cedula',
  firstName: 'PrimerNombre',
  middleName: 'SegundoNombre',
  lastName: 'PrimerApellido',
  secondLastName: 'SegundoApellido',
  email: 'Correo',
  mobile: 'Celular',
  position: 'Cargo',
  department: 'Departamento',
  status: 'Estado',
  contractType: 'TipoContrato',
  baseSalary: 'Salario',
  hireDate: 'FechaIngreso',
  eps: 'EPS',
  pensionFund: 'FondoPension',
  arl: 'ARL',
  bankName: 'Banco',
};

/** Descarga una plantilla CSV con los encabezados esperados y un ejemplo. */
export function downloadImportTemplate() {
  const headers = IMPORT_COLUMNS.map((c) => HEADER_LABELS[c]);
  const example = [
    'CC', '1012345678', 'Juan', 'Camilo', 'Pérez', 'Gómez', 'juan@empresa.co', '3001234567',
    'Analista', 'Tecnología', 'ACTIVE', 'INDEFINITE', '2500000', '2026-01-15',
    'Sura EPS', 'Porvenir', 'Sura ARL', 'Bancolombia',
  ];
  const csv = '﻿' + [headers.join(';'), example.join(';')].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plantilla-empleados.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Parsea un CSV (separado por ; o ,) y mapea los encabezados a los campos. */
export function parseCsv(text: string): Record<string, string>[] {
  const clean = text.replace(/^﻿/, '').trim();
  const lines = clean.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const rawHeaders = splitLine(lines[0], delimiter).map((h) => h.trim());

  // Mapea encabezado del archivo -> campo interno (por etiqueta o por nombre de campo).
  const labelToField = new Map<string, string>();
  Object.entries(HEADER_LABELS).forEach(([field, label]) => {
    labelToField.set(label.toLowerCase(), field);
    labelToField.set(field.toLowerCase(), field);
  });
  const fields = rawHeaders.map((h) => labelToField.get(h.toLowerCase()) ?? h);

  return lines.slice(1).map((line) => {
    const cells = splitLine(line, delimiter);
    const obj: Record<string, string> = {};
    fields.forEach((f, i) => {
      const v = (cells[i] ?? '').trim();
      if (v) obj[f] = v;
    });
    return obj;
  });
}

function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export async function importEmployees(rows: Record<string, string>[]): Promise<ImportResult> {
  const { data } = await api.post<{ data: ImportResult }>('/import/employees', { rows });
  return data.data;
}
