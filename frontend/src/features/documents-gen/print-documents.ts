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

  const headerParts = [
    company.address,
    company.city,
    company.phone ? `Tel: ${company.phone}` : '',
    company.email,
  ]
    .filter(Boolean)
    .map((s) => escapeHtml(String(s)))
    .join(' · ');

  const logo = company.logoUrl
    ? `<img src="${company.logoUrl}" alt="" style="max-height:64px;max-width:180px;object-fit:contain;margin-bottom:8px" />`
    : '';

  const pages = documents
    .map(
      (doc, i) => `
      <section class="page" ${i > 0 ? 'style="page-break-before:always"' : ''}>
        <header class="letterhead">
          ${logo}
          <div class="company">${escapeHtml(company.legalName || company.name)}</div>
          <div class="meta">NIT ${escapeHtml(company.nit)}</div>
          ${headerParts ? `<div class="meta">${headerParts}</div>` : ''}
        </header>
        <h1 class="title">${escapeHtml(doc.title)}</h1>
        <div class="body">${bodyToHtml(doc.body)}</div>
        <div class="signature">
          <div class="line"></div>
          <div class="rep">${escapeHtml(company.legalRepresentative || '')}</div>
          <div class="rep-sub">Representante Legal</div>
          <div class="rep-sub">${escapeHtml(company.name)}</div>
        </div>
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
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; margin: 0; }
  .page { padding: 48px 56px; min-height: 100vh; display: flex; flex-direction: column; }
  .letterhead { text-align: center; border-bottom: 2px solid #1f3a5f; padding-bottom: 12px; margin-bottom: 32px; }
  .letterhead .company { font-size: 18px; font-weight: bold; color: #1f3a5f; letter-spacing: .5px; }
  .letterhead .meta { font-size: 12px; color: #555; margin-top: 2px; }
  .title { text-align: center; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; margin: 8px 0 28px; }
  .body { font-size: 14px; line-height: 1.9; text-align: justify; flex: 1; }
  .body p { margin: 0 0 14px; }
  .signature { margin-top: 64px; }
  .signature .line { width: 260px; border-top: 1px solid #1a1a1a; margin-bottom: 6px; }
  .signature .rep { font-weight: bold; font-size: 14px; }
  .signature .rep-sub { font-size: 12px; color: #444; }
  @media print { .page { min-height: auto; } }
</style>
</head>
<body>${pages}</body>
</html>`);
  win.document.close();
  win.focus();
  // Da tiempo a renderizar (e imágenes) antes de imprimir.
  setTimeout(() => win.print(), 400);
}
