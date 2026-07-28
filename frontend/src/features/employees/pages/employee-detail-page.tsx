import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CreditCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldPlus,
  Trash2,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmployeeStatusBadge, CONTRACT_TYPE_LABEL, DOCUMENT_TYPE_LABEL } from '@/components/shared/status-badges';
import { useDeleteEmployee, useEmployeeByDocument } from '../employees.api';
import { EmployeeForm } from '../components/employee-form';
import { DocumentsSection } from '../components/documents-section';
import { ContractsSection } from '../components/contracts-section';
import { DependentsSection } from '../components/dependents-section';
import { ResumeSection } from '../components/resume-section';
import { AbsencesSection } from '@/features/absences/absences-section';
import { CustomFieldsCard } from '../components/custom-fields-card';
import { generateCertificate, generateContract } from '../document-generator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileSignature } from 'lucide-react';
import { usePermissions } from '@/features/auth/use-permissions';
import { formatCurrency, formatDate, fullName, getInitials } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';

const GENDER_LABEL: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
  OTHER: 'Otro',
};
const MARITAL_LABEL: Record<string, string> = {
  SINGLE: 'Soltero(a)',
  MARRIED: 'Casado(a)',
  DIVORCED: 'Divorciado(a)',
  WIDOWED: 'Viudo(a)',
  FREE_UNION: 'Unión libre',
};

export function EmployeeDetailPage() {
  const { documentNumber = '' } = useParams();
  const navigate = useNavigate();
  const { data: emp, isLoading } = useEmployeeByDocument(documentNumber);
  const deleteEmployee = useDeleteEmployee();
  const { isAdmin, canManageEmployees } = usePermissions();
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = async () => {
    if (!emp) return;
    if (!confirm('¿Eliminar este empleado? Esta acción no se puede deshacer.')) return;
    try {
      await deleteEmployee.mutateAsync(emp.id);
      toast.success('Empleado eliminado');
      navigate('/employees');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!emp) return null;

  const contract = emp.contracts?.[0];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/employees')}>
        <ArrowLeft className="h-4 w-4" /> Volver a empleados
      </Button>

      {/* Encabezado */}
      <Card>
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 text-2xl">
              {emp.photoUrl ? <AvatarImage src={emp.photoUrl} alt="" /> : null}
              <AvatarFallback>{getInitials(emp.firstName, emp.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{fullName(emp)}</h1>
                <EmployeeStatusBadge status={emp.status} />
              </div>
              <p className="text-muted-foreground">{emp.position?.title ?? 'Sin cargo asignado'}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" /> Cédula: {emp.documentNumber}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> {emp.department?.name ?? '—'}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {emp.city ?? '—'}
                </span>
                {emp.manager && (
                  <span className="flex items-center gap-1">
                    <UserRound className="h-3.5 w-3.5" /> Jefe: {emp.manager.firstName}{' '}
                    {emp.manager.lastName}
                  </span>
                )}
                {emp.costCenter && (
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-3.5 w-3.5" /> {emp.costCenter}
                  </span>
                )}
                {emp.workLocation && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {emp.workLocation}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FileSignature className="h-4 w-4" /> Generar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => generateCertificate(emp)}>
                  Certificado laboral
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateContract(emp)} disabled={!contract}>
                  Contrato de trabajo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canManageEmployees && (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" /> Editar
              </Button>
            )}
            {isAdmin && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" /> Eliminar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <EmployeeForm open={editOpen} onOpenChange={setEditOpen} employee={emp} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos personales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4 text-primary" /> Datos personales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Tipo de documento" value={DOCUMENT_TYPE_LABEL[emp.documentType] ?? emp.documentType} />
            <Row label="Número de documento" value={emp.documentNumber} />
            <Row label="Lugar de expedición" value={emp.issuePlace} />
            <Row label="Fecha de expedición" value={emp.issueDate ? formatDate(emp.issueDate) : null} />
            <Row label="Fecha de nacimiento" value={emp.birthDate ? formatDate(emp.birthDate) : null} />
            <Row label="Sexo" value={emp.gender ? GENDER_LABEL[emp.gender] : null} />
            <Row label="Estado civil" value={emp.maritalStatus ? MARITAL_LABEL[emp.maritalStatus] : null} />
            <Row label="Nacionalidad" value={emp.nationality} />
            <Row label="Grupo sanguíneo" value={emp.bloodType} />
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-primary" /> Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Correo" value={emp.email} icon={Mail} />
            <Row label="Teléfono fijo" value={emp.phone} icon={Phone} />
            <Row label="Celular" value={emp.mobile} icon={Phone} />
            <Row label="Dirección" value={emp.address} />
            <Row label="Ciudad" value={emp.city} />
            <Row label="Departamento" value={emp.stateProvince} />
            <Row label="País" value={emp.country} />
            <Row label="Contacto emergencia" value={emp.emergencyContactName} />
            <Row label="Tel. emergencia" value={emp.emergencyContactPhone} />
          </CardContent>
        </Card>

        {/* Contrato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-primary" /> Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contract ? (
              <>
                <Row label="Tipo" value={CONTRACT_TYPE_LABEL[contract.type] ?? contract.type} />
                <div className="rounded-lg bg-primary/5 p-4">
                  <p className="text-xs text-muted-foreground">Salario base</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(contract.baseSalary)}
                  </p>
                </div>
                <Row
                  label="Salario integral"
                  value={contract.isIntegralSalary ? 'Sí' : 'No'}
                />
                <Row
                  label="Auxilio de transporte"
                  value={contract.transportAllowance ? 'Aplica' : 'No aplica'}
                />
                <Row label="Inicio" value={formatDate(contract.startDate)} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sin contrato registrado.</p>
            )}
          </CardContent>
        </Card>

        {/* Seguridad social */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldPlus className="h-4 w-4 text-primary" /> Seguridad social
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="EPS" value={emp.eps} />
            <Row label="Fondo de pensión" value={emp.pensionFund} />
            <Row label="Fondo de cesantías" value={emp.severanceFund} />
            <Row label="Caja de compensación" value={emp.compensationFund} />
            <Row label="ARL (entidad)" value={emp.arl} />
            <Row label="Nivel de riesgo ARL" value={`Nivel ${emp.arlRiskClass}`} />
          </CardContent>
        </Card>

        {/* Datos bancarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-primary" /> Datos bancarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Banco" value={emp.bankName} />
            <Row label="Tipo de cuenta" value={emp.bankAccountType} />
            <Row label="Número de cuenta" value={emp.bankAccountNumber} />
            <Row label="Fecha de ingreso" value={formatDate(emp.hireDate)} />
          </CardContent>
        </Card>

        {/* Información adicional y consentimiento */}
        <CustomFieldsCard employee={emp} />
      </div>

      {/* Historial contractual y salarial */}
      <ContractsSection employeeId={emp.id} />

      {/* Vacaciones y ausencias */}
      <AbsencesSection employeeId={emp.id} />

      {/* Hoja de vida */}
      <ResumeSection employeeId={emp.id} />

      {/* Grupo familiar / beneficiarios */}
      <DependentsSection employeeId={emp.id} />

      {/* Documentos adjuntos */}
      <DocumentsSection employeeId={emp.id} />
    </div>
  );
}

function Row({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | null;
  icon?: typeof Mail;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 text-sm font-medium">
        {Icon && value && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {value || '—'}
      </span>
    </div>
  );
}
