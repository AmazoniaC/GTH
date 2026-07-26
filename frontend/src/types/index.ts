export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'HR_MANAGER' | 'PAYROLL_MANAGER' | 'EMPLOYEE';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  avatarUrl?: string | null;
}

export interface ManagedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';
export type DocumentType = 'CC' | 'CE' | 'TI' | 'PA' | 'PEP';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type ContractType =
  | 'INDEFINITE'
  | 'FIXED_TERM'
  | 'WORK_LABOR'
  | 'APPRENTICESHIP'
  | 'TEMPORARY';
export type PaymentFrequency = 'MONTHLY' | 'BIWEEKLY';

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  _count?: { employees: number };
}

export interface Position {
  id: string;
  code?: string | null;
  title: string;
  description?: string | null;
  departmentId?: string | null;
  department?: Department | null;
  _count?: { employees: number };
}

export type CatalogCategory = 'DOCUMENT_TYPE' | 'CONTRACT_TYPE' | 'EMPLOYEE_STATUS';

export interface CatalogOption {
  id: string;
  category: CatalogCategory;
  code: string;
  label: string;
  order: number;
  isSystem: boolean;
  isActive: boolean;
}

export interface Contract {
  id: string;
  type: ContractType;
  paymentFrequency: PaymentFrequency;
  baseSalary: string;
  isIntegralSalary: boolean;
  transportAllowance: boolean;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  notes?: string | null;
}

export interface Employee {
  id: string;
  employeeCode: string;
  documentType: DocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  birthDate?: string | null;
  gender?: Gender | null;
  address?: string | null;
  city?: string | null;
  status: string;
  hireDate: string;
  terminationDate?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  department?: Department | null;
  position?: Position | null;
  contracts?: Contract[];
  eps?: string | null;
  pensionFund?: string | null;
  severanceFund?: string | null;
  compensationFund?: string | null;
  arlRiskClass: number;
  bankName?: string | null;
  bankAccountType?: string | null;
  bankAccountNumber?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export type PayrollStatus = 'DRAFT' | 'PROCESSED' | 'APPROVED' | 'PAID' | 'CANCELLED';
export type PayrollPeriodType = 'MONTHLY' | 'BIWEEKLY_FIRST' | 'BIWEEKLY_SECOND';

export interface PayrollPeriod {
  id: string;
  name: string;
  type: PayrollPeriodType;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  paymentDate?: string | null;
  status: PayrollStatus;
  totalEarnings: string;
  totalDeductions: string;
  totalNet: string;
  totalEmployerCost: string;
  _count?: { payslips: number };
  payslips?: Payslip[];
}

export interface PayslipItem {
  id: string;
  type: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_COST';
  code: string;
  concept: string;
  amount: string;
}

export interface Payslip {
  id: string;
  workedDays: number;
  baseSalary: string;
  totalEarnings: string;
  totalDeductions: string;
  netPay: string;
  employerCost: string;
  status: PayrollStatus;
  employee?: Employee;
  items?: PayslipItem[];
  period?: PayrollPeriod;
}

export interface SimulationResult {
  items: { type: string; code: string; concept: string; amount: number }[];
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  employerCost: number;
  ibc: number;
}

export interface PayrollConfig {
  year: number;
  minimumWage: number | string;
  transportAllowance: number | string;
  uvt: number | string;
  [key: string]: unknown;
}

export interface DashboardSummary {
  employees: { total: number; active: number; onLeave: number; terminated: number };
  departments: number;
  lastPayroll: {
    name: string;
    totalNet: string;
    totalEmployerCost: string;
    status: PayrollStatus;
  } | null;
  employeesByDepartment: { department: string; count: number }[];
  payrollTrend: { name: string; month: number; year: number; totalNet: string; totalEmployerCost: string }[];
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}
