import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Download, FileUp, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  downloadImportTemplate,
  importEmployees,
  parseCsv,
  type ImportResult,
} from '../import.api';
import { getErrorMessage } from '@/lib/api';

export function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setRows([]);
    setFileName('');
    setResult(null);
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setResult(null);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        toast.error('El archivo no tiene filas de datos.');
        return;
      }
      setRows(parsed);
      setFileName(file.name);
    } catch {
      toast.error('No se pudo leer el archivo.');
    }
  };

  const runImport = async () => {
    setLoading(true);
    try {
      const res = await importEmployees(rows);
      setResult(res);
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['catalog'] });
      if (res.created > 0) toast.success(`${res.created} empleados importados`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar empleados</DialogTitle>
          <DialogDescription>
            Carga un archivo CSV con tus empleados. Descarga la plantilla para ver el formato.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button variant="outline" className="w-full" onClick={downloadImportTemplate}>
            <Download className="h-4 w-4" /> Descargar plantilla CSV
          </Button>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-8 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <FileUp className="h-7 w-7" />
            <span className="text-sm font-medium">
              {fileName || 'Haz clic para elegir un archivo CSV'}
            </span>
            {rows.length > 0 && (
              <span className="text-xs text-primary">{rows.length} filas detectadas</span>
            )}
          </button>

          {result && (
            <div className="space-y-2 rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>
                  <b>{result.created}</b> creados · <b>{result.skipped}</b> omitidos (ya existían) ·{' '}
                  <b>{result.errors.length}</b> con error
                </span>
              </div>
              {result.errors.length > 0 && (
                <div className="max-h-32 space-y-1 overflow-y-auto pt-1">
                  {result.errors.slice(0, 20).map((e, i) => (
                    <p key={i} className="flex items-start gap-1.5 text-xs text-destructive">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                      Fila {e.row}
                      {e.documentNumber ? ` (${e.documentNumber})` : ''}: {e.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)}>
            {result ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!result && (
            <Button onClick={runImport} disabled={rows.length === 0 || loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Importar {rows.length > 0 ? `(${rows.length})` : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
