import { z } from 'zod';

// Cada fila llega como texto (desde CSV/Excel). La validación es tolerante.
const row = z.object({
  documentType: z.string().optional(),
  documentNumber: z.string().min(3),
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  secondLastName: z.string().optional(),
  email: z.string().optional(),
  mobile: z.string().optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  status: z.string().optional(),
  contractType: z.string().optional(),
  baseSalary: z.coerce.number().optional(),
  hireDate: z.string().optional(),
  eps: z.string().optional(),
  pensionFund: z.string().optional(),
  arl: z.string().optional(),
  bankName: z.string().optional(),
});

export const importEmployeesSchema = z.object({
  body: z.object({
    rows: z.array(z.record(z.any())).min(1, 'No hay filas para importar.').max(2000),
  }),
});

export type ImportRow = z.infer<typeof row>;
export const rowSchema = row;
