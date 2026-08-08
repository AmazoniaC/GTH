/**
 * Utilidades para abrir/descargar archivos almacenados como data URL (base64).
 *
 * Los navegadores manejan mal los `data:` URL grandes (varios MB) puestos
 * directamente en `href`: la descarga puede fallar en silencio o abrir una
 * pestaña en blanco. Convertir el contenido a Blob y usar un object URL es
 * fiable para cualquier tamaño.
 */

/** Convierte un data URL base64 en Blob. Lanza si el contenido es inválido. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  if (!dataUrl.startsWith('data:') || comma === -1) {
    throw new Error('El contenido del archivo no es válido.');
  }
  const meta = dataUrl.slice(5, comma); // p. ej. "application/pdf;base64"
  const mime = meta.split(';')[0] || 'application/octet-stream';
  const base64 = dataUrl.slice(comma + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Descarga de forma fiable un archivo a partir de su data URL. */
export function downloadDataUrl(dataUrl: string, fileName: string): void {
  const url = URL.createObjectURL(dataUrlToBlob(dataUrl));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'documento';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Abre un archivo en una pestaña nueva para verlo. Acepta data URL o URL normal. */
export function openDataUrl(fileUrl: string): void {
  // URL normal (http/https): se abre directamente.
  if (!fileUrl.startsWith('data:')) {
    window.open(fileUrl, '_blank', 'noopener');
    return;
  }
  const url = URL.createObjectURL(dataUrlToBlob(fileUrl));
  const win = window.open(url, '_blank');
  // Si el navegador bloquea la pestaña, se fuerza la descarga como respaldo.
  if (!win) {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documento';
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
