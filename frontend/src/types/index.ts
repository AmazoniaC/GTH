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
  employee?: { id: string; firstName: string; lastName: string; documentNumber: string } | null;
}

export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';
export type DocumentType = 'CC' | 'CE' | 'TI' | 'PA' | 'PEP';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'FREE_UNION';
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

export type CatalogCategory =
  | 'DOCUMENT_TYPE'
  | 'CONTRACT_TYPE'
  | 'EMPLOYEE_STATUS'
  | 'FILE_TYPE'
  | 'BLOOD_TYPE'
  | 'NATIONALITY'
  | 'COUNTRY'
  | 'EPS'
  | 'PENSION_FUND'
  | 'SEVERANCE_FUND'
  | 'COMPENSATION_FUND'
  | 'ARL'
  | 'BANK'
  | 'ACCOUNT_TYPE'
  | 'RELATIONSHIP'
  | 'COST_CENTER'
  | 'WORK_LOCATION'
  | 'EDUCATION_LEVEL';

export interface Education {
  id: string;
  employeeId: string;
  level: string;
  institution: string;
  title?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCompleted: boolean;
}

export interface WorkExperience {
  id: string;
  employeeId: string;
  company: string;
  position: string;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent: boolean;
  responsibilities?: string | null;
}

export type CustomFieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT';

export interface CustomFieldDefinition {
  id: string;
  key: string;
  label: string;
  type: CustomFieldType;
  options?: string[] | null;
  section: string;
  order: number;
  isActive: boolean;
}

export interface Dependent {
  id: string;
  employeeId: string;
  relationship: string;
  firstName: string;
  lastName: string;
  documentType?: string | null;
  documentNumber?: string | null;
  birthDate?: string | null;
  gender?: Gender | null;
  isBeneficiary: boolean;
  notes?: string | null;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userName?: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entityId?: string | null;
  entityLabel?: string | null;
  changes?: Record<string, { from: unknown; to: unknown }> | null;
  createdAt: string;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  type: string;
  name: string;
  fileName: string;
  mimeType: string;
  size: number;
  issueDate?: string | null;
  expiryDate?: string | null;
  createdAt: string;
  content?: string;
}

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
  employeeId?: string;
  type: string;
  paymentFrequency: PaymentFrequency;
  baseSalary: string;
  isIntegralSalary: boolean;
  transportAllowance: boolean;
  startDate: string;
  endDate?: string | null;
  probationEndDate?: string | null;
  isActive: boolean;
  endReason?: string | null;
  notes?: string | null;
}

export interface SalaryChange {
  id: string;
  employeeId: string;
  previousSalary: string;
  newSalary: string;
  effectiveDate: string;
  reason?: string | null;
  createdAt: string;
}

export interface ManagerRef {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  photoUrl?: string | null;
}

export type AlertCategory = 'CONTRACT' | 'PROBATION' | 'DOCUMENT' | 'BIRTHDAY';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  detail: string;
  employeeId: string;
  employeeName: string;
  documentNumber: string;
  date: string | null;
}

export interface AlertsResponse {
  total: number;
  counts: Record<AlertCategory, number>;
  items: Alert[];
}

export interface OrgNode {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  photoUrl?: string | null;
  managerId?: string | null;
  position?: { title: string } | null;
  department?: { name: string } | null;
}

export interface Employee {
  id: string;
  employeeCode: string;
  documentType: DocumentType;
  documentNumber: string;
  issuePlace?: string | null;
  issueDate?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  photoUrl?: string | null;
  birthDate?: string | null;
  gender?: Gender | null;
  maritalStatus?: MaritalStatus | null;
  nationality?: string | null;
  bloodType?: string | null;
  address?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  country?: string | null;
  status: string;
  hireDate: string;
  terminationDate?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  managerId?: string | null;
  costCenter?: string | null;
  workLocation?: string | null;
  customFields?: Record<string, unknown> | null;
  dataConsent?: boolean;
  dataConsentAt?: string | null;
  department?: Department | null;
  position?: Position | null;
  manager?: ManagerRef | null;
  contracts?: Contract[];
  _count?: { reports: number };
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  eps?: string | null;
  pensionFund?: string | null;
  severanceFund?: string | null;
  compensationFund?: string | null;
  arl?: string | null;
  arlRiskClass: number;
  bankName?: string | null;
  bankAccountType?: string | null;
  bankAccountNumber?: string | null;
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
