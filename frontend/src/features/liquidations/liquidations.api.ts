import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface LiquidationItem {
  code: string;
  concept: string;
  type: 'EARNING' | 'DEDUCTION';
  amount: number;
  detail?: string;
}

export interface LiquidationLine {
  concept: string;
  amount: number;
}

export interface ComputeInput {
  employeeId: string;
  terminationDate: string;
  reason: string;
  cesantiasFrom?: string | null;
  primaFrom?: string | null;
  pendingSalaryDays?: number;
  extraEarnings?: LiquidationLine[];
  deductions?: LiquidationLine[];
  notes?: string | null;
}

export interface ComputeResult {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    documentNumber: string;
    position: string | null;
    hireDate: string;
  };
  baseSalary: number;
  transportAllowance: number;
  cesantiasFrom: string;
  primaFrom: string;
  vacationDays: number;
  items: LiquidationItem[];
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  meta: {
    daysCesantias: number;
    daysPrima: number;
    baseCesantias: number;
    basePrima: number;
    dailySalary: number;
  };
}

export interface LiquidationListItem {
  id: string;
  terminationDate: string;
  reason: string;
  netPay: string;
  createdAt: string;
  employee: { id: string; firstName: string; lastName: string; documentNumber: string };
}

export interface LiquidationDetail {
  id: string;
  number?: string | null;
  terminationDate: string;
  reason: string;
  baseSalary: string;
  transportAllowance: string;
  items: LiquidationItem[];
  totalEarnings: string;
  totalDeductions: string;
  netPay: string;
  notes?: string | null;
  createdAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    documentNumber: string;
    documentType: string;
    hireDate: string;
    position?: { title: string } | null;
  };
  organization: {
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
}

export function useTerminationReasons() {
  return useQuery({
    queryKey: ['liquidations', 'reasons'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { code: string; label: string }[] }>(
        '/liquidations/reasons',
      );
      return data.data;
    },
    staleTime: Infinity,
  });
}

export function useLiquidations() {
  return useQuery({
    queryKey: ['liquidations'],
    queryFn: async () => {
      const { data } = await api.get<{ data: LiquidationListItem[] }>('/liquidations');
      return data.data;
    },
  });
}

export function useLiquidation(id: string) {
  return useQuery({
    queryKey: ['liquidations', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: LiquidationDetail }>(`/liquidations/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useComputeLiquidation() {
  return useMutation({
    mutationFn: async (input: ComputeInput) => {
      const { data } = await api.post<{ data: ComputeResult }>('/liquidations/compute', input);
      return data.data;
    },
  });
}

export function useCreateLiquidation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ComputeInput & { markTerminated?: boolean }) => {
      const { data } = await api.post<{ data: LiquidationDetail }>('/liquidations', input);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['liquidations'] }),
  });
}

export function useDeleteLiquidation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/liquidations/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['liquidations'] }),
  });
}
