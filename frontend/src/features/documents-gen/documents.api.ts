import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface DocumentTemplate {
  id: string;
  key: string;
  name: string;
  body: string;
  isSystem: boolean;
  isActive: boolean;
  order: number;
}

export interface TemplateVariableGroup {
  group: string;
  items: { token: string; label: string }[];
}

export interface RenderedDoc {
  employeeId: string;
  employeeName: string;
  documentNumber: string;
  title: string;
  body: string;
}

export interface RenderResult {
  template: { id: string; name: string };
  company: {
    name: string;
    legalName?: string | null;
    nit: string;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    legalRepresentative?: string | null;
    logoUrl?: string | null;
  };
  documents: RenderedDoc[];
}

export function useDocumentTemplates() {
  return useQuery({
    queryKey: ['doc-templates'],
    queryFn: async () => {
      const { data } = await api.get<{ data: DocumentTemplate[] }>('/documents-gen/templates');
      return data.data;
    },
  });
}

export function useTemplateVariables() {
  return useQuery({
    queryKey: ['doc-variables'],
    queryFn: async () => {
      const { data } = await api.get<{ data: TemplateVariableGroup[] }>('/documents-gen/variables');
      return data.data;
    },
    staleTime: Infinity,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; body: string; key?: string }) => {
      const { data } = await api.post('/documents-gen/templates', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doc-templates'] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; body?: string; isActive?: boolean }) => {
      const { data } = await api.put(`/documents-gen/templates/${id}`, payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doc-templates'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/documents-gen/templates/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doc-templates'] }),
  });
}

export function useRenderDocuments() {
  return useMutation({
    mutationFn: async (payload: { templateId: string; employeeIds: string[] }) => {
      const { data } = await api.post<{ data: RenderResult }>('/documents-gen/render', payload);
      return data.data;
    },
  });
}
