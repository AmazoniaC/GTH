import type { RenderResult } from './documents.api';

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Convierte el cuerpo (texto con saltos de línea) en párrafos HTML. */
function bodyToHtml(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

/**
 * Abre una ventana de impresión con los documentos generados, con membrete de
 * la empresa y espacio de firma del representante legal. Un documento por
 * página. El usuario puede imprimir o guardar como PDF.
 */
export function printDocuments(result: RenderResult): void {
  const { company, documents } = result;
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;

  const footerParts = [
    company.legalName || company.name,
    `NIT ${company.nit}`,
    company.address,
    company.city,
    company.phone ? `Tel: ${company.phone}` : '',
    company.email,
  ]
    .filter(Boolean)
    .map((s) => escapeHtml(String(s)))
    .join(' · ');

  const headerMeta = [
    [company.address, company.city].filter(Boolean).join(', '),
    [company.phone ? `Tel: ${company.phone}` : '', company.email].filter(Boolean).join(' · '),
  ]
    .filter(Boolean)
    .map((s) => `<div class="meta">${escapeHtml(String(s))}</div>`)
    .join('');

  const logo = company.logoUrl
    ? `<img class="logo" src="${company.logoUrl}" alt="" />`
    : '';

  const pages = documents
    .map(
      (doc, i) => `
      <section class="page" ${i > 0 ? 'style="page-break-before:always"' : ''}>
        <header class="letterhead">
          ${logo}
          <div class="company-block">
            <div class="company">${escapeHtml(company.legalName || company.name)}</div>
            <div class="meta">NIT ${escapeHtml(company.nit)}</div>
            ${headerMeta}
          </div>
        </header>
        <h1 class="title">${escapeHtml(doc.title)}</h1>
        ${doc.number ? `<div class="doc-number">N° ${escapeHtml(doc.number)}</div>` : ''}
        <div class="body">${bodyToHtml(doc.body)}</div>
        <div class="signature">
          <div class="line"></div>
          <div class="rep">${escapeHtml(company.legalRepresentative || '')}</div>
          <div class="rep-sub">Representante Legal</div>
          <div class="rep-sub">${escapeHtml(company.name)}</div>
        </div>
        <footer class="doc-footer">${footerParts}</footer>
      </section>`,
    )
    .join('');

  win.document.write(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(documents[0]?.title ?? 'Documento')}</title>
<style>
  * { box-sizing: border-box; }
  @page { size: letter; margin: 1.8cm 2cm; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; margin: 0; }
  .page { display: flex; flex-direction: column; min-height: 24cm; }
  .letterhead { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #1f3a5f; padding-bottom: 12px; margin-bottom: 28px; }
  .letterhead .logo { height: 58px; max-width: 170px; object-fit: contain; }
  .letterhead .company { font-size: 17px; font-weight: bold; color: #1f3a5f; letter-spacing: .3px; }
  .letterhead .meta { font-size: 11px; color: #555; margin-top: 2px; }
  .title { text-align: center; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; margin: 8px 0 4px; }
  .doc-number { text-align: center; font-size: 11px; color: #777; margin-bottom: 22px; }
  .body { font-size: 13.5px; line-height: 1.9; text-align: justify; flex: 1; }
  .body p { margin: 0 0 14px; }
  .signature { margin-top: 56px; }
  .signature .line { width: 260px; border-top: 1px solid #1a1a1a; margin-bottom: 6px; }
  .signature .rep { font-weight: bold; font-size: 13.5px; }
  .signature .rep-sub { font-size: 11.5px; color: #444; }
  .doc-footer { margin-top: 28px; border-top: 1px solid #ccc; padding-top: 8px; text-align: center; font-size: 10px; color: #777; }
</style>
</head>
<body>${pages}</body>
</html>`);
  win.document.close();
  win.focus();
  // Da tiempo a renderizar (e imágenes) antes de imprimir.
  setTimeout(() => win.print(), 400);
}
