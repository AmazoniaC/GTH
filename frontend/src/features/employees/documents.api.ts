import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { downloadDataUrl } from '@/lib/download';
import type { EmployeeDocument } from '@/types';

export function useDocuments(employeeId: string) {
  return useQuery({
    queryKey: ['documents', employeeId],
    queryFn: async () => {
      const { data } = await api.get<{ data: EmployeeDocument[] }>('/documents', {
        params: { employeeId },
      });
      return data.data;
    },
    enabled: !!employeeId,
  });
}

export function useUploadDocument(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post('/documents', { ...payload, employeeId });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents', employeeId] }),
  });
}

export function useDeleteDocument(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/documents/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents', employeeId] }),
  });
}

/** Descarga el documento (obtiene el contenido base64 y dispara la descarga). */
export async function downloadDocument(id: string) {
  const { data } = await api.get<{ data: EmployeeDocument }>(`/documents/${id}/download`);
  const doc = data.data;
  if (!doc.content) {
    throw new Error('El documento no tiene contenido almacenado. Vuelve a subirlo.');
  }
  // Vía Blob (fiable para archivos grandes; evita la pestaña en blanco).
  downloadDataUrl(doc.content, doc.fileName || doc.name);
}
