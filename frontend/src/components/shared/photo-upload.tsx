import { useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PhotoUploadProps {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  fallback?: string;
}

/** Redimensiona una imagen a un cuadrado máx. 320px y devuelve un data URL JPEG. */
function resizeImage(file: File, size = 320, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No se pudo procesar la imagen'));
        // Recorte centrado tipo "cover".
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Imagen inválida'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

export function PhotoUpload({ value, onChange, fallback }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen.');
      return;
    }
    setLoading(true);
    try {
      const dataUrl = await resizeImage(file);
      onChange(dataUrl);
    } catch {
      toast.error('No se pudo procesar la imagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20 text-xl">
        {value ? <AvatarImage src={value} alt="Foto" /> : null}
        <AvatarFallback>{fallback ?? '👤'}</AvatarFallback>
      </Avatar>
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {value ? 'Cambiar' : 'Subir foto'}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onChange(null)}>
              <Trash2 className="h-4 w-4" /> Quitar
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPG o PNG. Se recorta a un cuadrado.</p>
      </div>
    </div>
  );
}
