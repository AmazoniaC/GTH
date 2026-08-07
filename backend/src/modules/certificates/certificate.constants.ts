/**
 * Plantillas de documentos por defecto y resolución de variables.
 *
 * El cuerpo de cada plantilla admite variables con la sintaxis {{grupo.campo}}
 * que se reemplazan con datos del empleado, su contrato y la empresa al
 * generar el documento.
 */

import { CONTRACT_TYPE_LABELS as CANONICAL_CONTRACT_LABELS } from '../catalog/catalog.constants';

export interface DefaultTemplate {
  key: string;
  name: string;
  body: string;
  order: number;
}

const CERT_CON_SALARIO = `LA EMPRESA {{empresa.nombre}}, identificada con NIT {{empresa.nit}},

CERTIFICA:

Que {{empleado.nombreCompleto}}, identificado(a) con {{empleado.tipoDocumento}} No. {{empleado.documento}}, se encuentra vinculado(a) a nuestra empresa desde el {{empleado.fechaIngreso}}, desempeñando el cargo de {{empleado.cargo}}, mediante contrato a {{contrato.tipo}}, y devenga un salario mensual de {{contrato.salario}}.

La presente certificación se expide a solicitud del interesado(a) en {{empresa.ciudad}}, el {{fecha.hoy}}.`;

const CERT_SIN_SALARIO = `LA EMPRESA {{empresa.nombre}}, identificada con NIT {{empresa.nit}},

CERTIFICA:

Que {{empleado.nombreCompleto}}, identificado(a) con {{empleado.tipoDocumento}} No. {{empleado.documento}}, se encuentra vinculado(a) a nuestra empresa desde el {{empleado.fechaIngreso}}, desempeñando el cargo de {{empleado.cargo}}, mediante contrato a {{contrato.tipo}}.

La presente certificación se expide a solicitud del interesado(a) en {{empresa.ciudad}}, el {{fecha.hoy}}.`;

const CONTRATO = `CONTRATO INDIVIDUAL DE TRABAJO

Entre {{empresa.nombre}}, con NIT {{empresa.nit}}, representada legalmente por {{empresa.representante}} (en adelante EL EMPLEADOR), y {{empleado.nombreCompleto}}, identificado(a) con {{empleado.tipoDocumento}} No. {{empleado.documento}} (en adelante EL TRABAJADOR), se celebra el presente contrato de trabajo a {{contrato.tipo}}, regido por las siguientes cláusulas:

PRIMERA. OBJETO. EL TRABAJADOR se obliga a prestar sus servicios personales en el cargo de {{empleado.cargo}}, cumpliendo las órdenes e instrucciones del EMPLEADOR.

SEGUNDA. REMUNERACIÓN. EL EMPLEADOR pagará como salario mensual la suma de {{contrato.salario}}, en las condiciones y periodicidad acordadas.

TERCERA. DURACIÓN. El presente contrato regirá a partir del {{contrato.fechaInicio}}.

CUARTA. LUGAR. El trabajo se prestará en {{empresa.ciudad}}, o donde el EMPLEADOR lo requiera conforme a la ley.

En constancia se firma en {{empresa.ciudad}}, el {{fecha.hoy}}.`;

const PAZ_Y_SALVO = `PAZ Y SALVO

{{empresa.nombre}}, identificada con NIT {{empresa.nit}}, hace constar que {{empleado.nombreCompleto}}, identificado(a) con {{empleado.tipoDocumento}} No. {{empleado.documento}}, quien se desempeñó en el cargo de {{empleado.cargo}}, se encuentra a PAZ Y SALVO por todo concepto con la empresa a la fecha de expedición del presente documento.

Se expide en {{empresa.ciudad}}, el {{fecha.hoy}}.`;

const CARTA = `{{empresa.ciudad}}, {{fecha.hoy}}

Señores
A QUIEN INTERESE

Cordial saludo,

Por medio de la presente, {{empresa.nombre}} hace constar que {{empleado.nombreCompleto}}, identificado(a) con {{empleado.tipoDocumento}} No. {{empleado.documento}}, se encuentra vinculado(a) a la empresa en el cargo de {{empleado.cargo}}.

Atentamente,`;

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  { key: 'LABOR_CERTIFICATE', name: 'Certificado laboral (con salario)', body: CERT_CON_SALARIO, order: 0 },
  { key: 'LABOR_CERTIFICATE_NS', name: 'Certificado laboral (sin salario)', body: CERT_SIN_SALARIO, order: 1 },
  { key: 'CONTRACT', name: 'Contrato de trabajo', body: CONTRATO, order: 2 },
  { key: 'CLEARANCE', name: 'Paz y salvo', body: PAZ_Y_SALVO, order: 3 },
  { key: 'LETTER', name: 'Carta / constancia', body: CARTA, order: 4 },
];

/** Variables disponibles para las plantillas (para el asistente de la UI). */
export const TEMPLATE_VARIABLES: { group: string; items: { token: string; label: string }[] }[] = [
  {
    group: 'Empleado',
    items: [
      { token: '{{empleado.nombreCompleto}}', label: 'Nombre completo' },
      { token: '{{empleado.primerNombre}}', label: 'Primer nombre' },
      { token: '{{empleado.tipoDocumento}}', label: 'Tipo de documento' },
      { token: '{{empleado.documento}}', label: 'Número de documento' },
      { token: '{{empleado.cargo}}', label: 'Cargo' },
      { token: '{{empleado.departamento}}', label: 'Departamento / área' },
      { token: '{{empleado.fechaIngreso}}', label: 'Fecha de ingreso' },
      { token: '{{empleado.correo}}', label: 'Correo' },
      { token: '{{empleado.celular}}', label: 'Celular' },
    ],
  },
  {
    group: 'Contrato',
    items: [
      { token: '{{contrato.tipo}}', label: 'Tipo de contrato' },
      { token: '{{contrato.salario}}', label: 'Salario mensual' },
      { token: '{{contrato.fechaInicio}}', label: 'Fecha de inicio del contrato' },
    ],
  },
  {
    group: 'Empresa',
    items: [
      { token: '{{empresa.nombre}}', label: 'Nombre de la empresa' },
      { token: '{{empresa.razonSocial}}', label: 'Razón social' },
      { token: '{{empresa.nit}}', label: 'NIT' },
      { token: '{{empresa.representante}}', label: 'Representante legal' },
      { token: '{{empresa.direccion}}', label: 'Dirección' },
      { token: '{{empresa.ciudad}}', label: 'Ciudad' },
      { token: '{{empresa.telefono}}', label: 'Teléfono' },
      { token: '{{empresa.correo}}', label: 'Correo' },
    ],
  },
  {
    group: 'Fecha',
    items: [{ token: '{{fecha.hoy}}', label: 'Fecha actual (hoy)' }],
  },
];

const DOC_TYPE_LABELS: Record<string, string> = {
  CC: 'cédula de ciudadanía',
  CE: 'cédula de extranjería',
  TI: 'tarjeta de identidad',
  PA: 'pasaporte',
};

// Etiquetas en minúscula (para prosa), derivadas de la fuente única del catálogo.
const CONTRACT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(CANONICAL_CONTRACT_LABELS).map(([code, label]) => [code, label.toLowerCase()]),
);

const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const longDate = (d?: Date | null): string =>
  d
    ? new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(d)
    : '';

type EmployeeCtx = {
  firstName: string;
  middleName: string | null;
  lastName: string;
  secondLastName: string | null;
  documentType: string;
  documentNumber: string;
  email: string | null;
  mobile: string | null;
  hireDate: Date;
  position: { title: string } | null;
  department: { name: string } | null;
  contracts: { type: string; baseSalary: unknown; startDate: Date }[];
};

type OrgCtx = {
  name: string;
  legalName: string | null;
  nit: string;
  legalRepresentative: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
};

/** Construye el mapa de variables → valores para un empleado y su empresa. */
export function buildContext(employee: EmployeeCtx, org: OrgCtx): Record<string, string> {
  const contract = employee.contracts[0];
  const fullName = [
    employee.firstName,
    employee.middleName,
    employee.lastName,
    employee.secondLastName,
  ]
    .filter(Boolean)
    .join(' ');
  const salary =
    contract != null ? currency.format(Number(contract.baseSalary as never)) : '';

  return {
    'empleado.nombreCompleto': fullName,
    'empleado.primerNombre': employee.firstName,
    'empleado.tipoDocumento': DOC_TYPE_LABELS[employee.documentType] ?? employee.documentType,
    'empleado.documento': employee.documentNumber,
    'empleado.cargo': employee.position?.title ?? '',
    'empleado.departamento': employee.department?.name ?? '',
    'empleado.fechaIngreso': longDate(employee.hireDate),
    'empleado.correo': employee.email ?? '',
    'empleado.celular': employee.mobile ?? '',
    'contrato.tipo': contract ? CONTRACT_TYPE_LABELS[contract.type] ?? contract.type : '',
    'contrato.salario': salary,
    'contrato.fechaInicio': contract ? longDate(contract.startDate) : '',
    'empresa.nombre': org.name,
    'empresa.razonSocial': org.legalName ?? org.name,
    'empresa.nit': org.nit,
    'empresa.representante': org.legalRepresentative ?? '',
    'empresa.direccion': org.address ?? '',
    'empresa.ciudad': org.city ?? '',
    'empresa.telefono': org.phone ?? '',
    'empresa.correo': org.email ?? '',
    'fecha.hoy': longDate(new Date()),
  };
}

/** Reemplaza las variables {{...}} del cuerpo con los valores del contexto. */
export function renderTemplate(body: string, context: Record<string, string>): string {
  return body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, token: string) => {
    const value = context[token];
    return value !== undefined ? value : match;
  });
}
