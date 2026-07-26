import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Download, FileText, Loader2, Paperclip, Plus, Trash2, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  downloadDocument,
  useDeleteDocument,
  useDocuments,
  useUploadDocument,
} from '../documents.api';
import { useOptions } from '@/features/catalog/catalog.api';
import { usePermissions } from '@/features/auth/use-permissions';
import { formatDate } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';
import type { EmployeeDocument } from '@/types';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Estado de vencimiento del documento. */
function expiryBadge(expiryDate?: string | null) {
  if (!expiryDate) return null;
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return <Badge variant="destructive">Vencido</Badge>;
  if (days <= 30) return <Badge variant="warning">Por vencer</Badge>;
  return <Badge variant="success">Vigente</Badge>;
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

export function DocumentsSection({ employeeId }: { employeeId: string }) {
  const { data: docs, isLoading } = useDocuments(employeeId);
  const { data: fileTypes } = useOptions('FILE_TYPE');
  const upload = useUploadDocument(employeeId);
  const remove = useDeleteDocument(employeeId);
  const { canManageEmployees } = usePermissions();

  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('');
  const [name, setName] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const typeLabel = (code: string) => fileTypes?.find((o) => o.code === code)?.label ?? code;

  const openDialog = () => {
    setType(fileTypes?.[0]?.code ?? '');
    setName('');
    setIssueDate('');
    setExpiryDate('');
    setFile(null);
    setOpen(true);
  };

  const onPick = (f?: File) => {
    if (!f) return;
    if (f.size > MAX_SIZE) {
      toast.error('El archivo supera el máximo de 5 MB.');
      return;
    }
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''));
  };

  const save = async () => {
    if (!type) return toast.error('Selecciona el tipo de documento.');
    if (!file) return toast.error('Selecciona un archivo.');
    if (name.trim().length < 1) return toast.error('El nombre es obligatorio.');
    try {
      const content = await readFile(file);
      await upload.mutateAsync({
        type,
        name,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        content,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
      });
      toast.success('Documento subido');
      setOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDownload = async (doc: EmployeeDocument) => {
    setDownloadingId(doc.id);
    try {
      await downloadDocument(doc.id);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (doc: EmployeeDocument) => {
    if (!confirm(`¿Eliminar "${doc.name}"?`)) return;
    try {
      await remove.mutateAsync(doc.id);
      toast.success('Documento eliminado');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Paperclip className="h-4 w-4 text-primary" /> Documentos
        </CardTitle>
        {canManageEmployees && (
          <Button size="sm" onClick={openDialog}>
            <Plus className="h-4 w-4" /> Subir documento
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
        ) : docs && docs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Subido</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.fileName} · {formatSize(doc.size)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{typeLabel(doc.type)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {expiryBadge(doc.expiryDate)}
                      {doc.expiryDate && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(doc.expiryDate)}
                        </span>
                      )}
                      {!doc.expiryDate && <span className="text-sm text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(doc.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(doc)}
                        disabled={downloadingId === doc.id}
                      >
                        {downloadingId === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      {canManageEmployees && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Paperclip className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">No hay documentos adjuntos.</p>
            {canManageEmployees && (
              <Button variant="link" onClick={openDialog}>
                Subir el primero
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo de documento</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {fileTypes
                    ?.filter((o) => o.isActive)
                    .map((o) => (
                      <SelectItem key={o.id} value={o.code}>
                        {o.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nombre / descripción</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Archivo (máx. 5 MB)</Label>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e) => onPick(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" className="w-full" onClick={() => inputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                {file ? file.name : 'Elegir archivo'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Fecha de emisión</Label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de vencimiento</Label>
                <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={upload.isPending}>
              {upload.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Subir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
