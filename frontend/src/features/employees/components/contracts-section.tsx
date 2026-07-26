import { useState } from 'react';
import { toast } from 'sonner';
import { FilePlus2, FileText, Loader2, Trash2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { CONTRACT_TYPE_LABEL } from '@/components/shared/status-badges';
import {
  useAddContract,
  useAddSalaryChange,
  useContracts,
  useDeleteContract,
  useSalaryHistory,
} from '../contracts.api';
import { useOptions } from '@/features/catalog/catalog.api';
import { usePermissions } from '@/features/auth/use-permissions';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';
import type { Contract } from '@/types';

const today = () => new Date().toISOString().slice(0, 10);

export function ContractsSection({ employeeId }: { employeeId: string }) {
  const { data: contracts, isLoading } = useContracts(employeeId);
  const { data: salary } = useSalaryHistory(employeeId);
  const { data: contractTypes } = useOptions('CONTRACT_TYPE');
  const addContract = useAddContract(employeeId);
  const addSalary = useAddSalaryChange(employeeId);
  const deleteContract = useDeleteContract(employeeId);
  const { canManageEmployees } = usePermissions();

  const [contractOpen, setContractOpen] = useState(false);
  const [salaryOpen, setSalaryOpen] = useState(false);

  const [cForm, setCForm] = useState({
    type: 'INDEFINITE',
    baseSalary: 0,
    startDate: today(),
    endDate: '',
    probationEndDate: '',
    previousEndReason: '',
    isIntegralSalary: false,
    transportAllowance: true,
    notes: '',
  });
  const [sForm, setSForm] = useState({ newSalary: 0, effectiveDate: today(), reason: '' });

  const openContract = () => {
    setCForm({
      type: contractTypes?.[0]?.code ?? 'INDEFINITE',
      baseSalary: 0,
      startDate: today(),
      endDate: '',
      probationEndDate: '',
      previousEndReason: '',
      isIntegralSalary: false,
      transportAllowance: true,
      notes: '',
    });
    setContractOpen(true);
  };

  const saveContract = async () => {
    if (cForm.baseSalary <= 0) return toast.error('Ingresa un salario válido.');
    try {
      await addContract.mutateAsync({
        type: cForm.type,
        baseSalary: cForm.baseSalary,
        startDate: cForm.startDate,
        endDate: cForm.endDate || undefined,
        probationEndDate: cForm.probationEndDate || undefined,
        previousEndReason: cForm.previousEndReason || undefined,
        isIntegralSalary: cForm.isIntegralSalary,
        transportAllowance: cForm.transportAllowance,
        notes: cForm.notes || undefined,
      });
      toast.success('Contrato registrado');
      setContractOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const saveSalary = async () => {
    if (sForm.newSalary <= 0) return toast.error('Ingresa un salario válido.');
    try {
      await addSalary.mutateAsync({
        newSalary: sForm.newSalary,
        effectiveDate: sForm.effectiveDate,
        reason: sForm.reason || undefined,
      });
      toast.success('Cambio salarial registrado');
      setSalaryOpen(false);
      setSForm({ newSalary: 0, effectiveDate: today(), reason: '' });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const removeContract = async (c: Contract) => {
    if (!confirm('¿Eliminar este contrato del historial?')) return;
    try {
      await deleteContract.mutateAsync(c.id);
      toast.success('Contrato eliminado');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const typeLabel = (code: string) =>
    contractTypes?.find((o) => o.code === code)?.label ?? CONTRACT_TYPE_LABEL[code] ?? code;

  const pct = (prev: string, next: string) => {
    const p = Number(prev);
    if (!p) return null;
    return (((Number(next) - p) / p) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Historial de contratos */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" /> Historial de contratos
          </CardTitle>
          {canManageEmployees && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSalaryOpen(true)}>
                <TrendingUp className="h-4 w-4" /> Cambio salarial
              </Button>
              <Button size="sm" onClick={openContract}>
                <FilePlus2 className="h-4 w-4" /> Nuevo contrato
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
          ) : contracts && contracts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Salario</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Estado</TableHead>
                  {canManageEmployees && <TableHead></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{typeLabel(c.type)}</TableCell>
                    <TableCell>{formatCurrency(c.baseSalary)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(c.startDate)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.endDate ? formatDate(c.endDate) : '—'}
                    </TableCell>
                    <TableCell>
                      {c.isActive ? (
                        <Badge variant="success">Vigente</Badge>
                      ) : (
                        <Badge variant="secondary">Finalizado</Badge>
                      )}
                    </TableCell>
                    {canManageEmployees && (
                      <TableCell className="text-right">
                        {!c.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => removeContract(c)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-6 text-sm text-muted-foreground">Sin contratos registrados.</p>
          )}
        </CardContent>
      </Card>

      {/* Historial salarial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" /> Historial salarial
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {salary && salary.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha efectiva</TableHead>
                  <TableHead>Anterior</TableHead>
                  <TableHead>Nuevo</TableHead>
                  <TableHead>Variación</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salary.map((s) => {
                  const p = pct(s.previousSalary, s.newSalary);
                  const up = Number(s.newSalary) >= Number(s.previousSalary);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDate(s.effectiveDate)}
                      </TableCell>
                      <TableCell>{formatCurrency(s.previousSalary)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(s.newSalary)}</TableCell>
                      <TableCell>
                        {p !== null && (
                          <Badge variant={up ? 'success' : 'destructive'}>
                            {up ? '+' : ''}
                            {p}%
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.reason ?? '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="p-6 text-sm text-muted-foreground">
              Aún no se han registrado cambios salariales.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog: nuevo contrato */}
      <Dialog open={contractOpen} onOpenChange={setContractOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo contrato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              El contrato vigente se cerrará automáticamente y este quedará como el activo.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo de contrato</Label>
                <Select value={cForm.type} onValueChange={(v) => setCForm({ ...cForm, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypes
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
                <Label>Salario base</Label>
                <Input
                  type="number"
                  value={cForm.baseSalary}
                  onChange={(e) => setCForm({ ...cForm, baseSalary: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de inicio</Label>
                <Input
                  type="date"
                  value={cForm.startDate}
                  onChange={(e) => setCForm({ ...cForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de fin (opcional)</Label>
                <Input
                  type="date"
                  value={cForm.endDate}
                  onChange={(e) => setCForm({ ...cForm, endDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fin periodo de prueba</Label>
                <Input
                  type="date"
                  value={cForm.probationEndDate}
                  onChange={(e) => setCForm({ ...cForm, probationEndDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Motivo fin contrato anterior</Label>
                <Input
                  value={cForm.previousEndReason}
                  placeholder="Ej: Renovación"
                  onChange={(e) => setCForm({ ...cForm, previousEndReason: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={cForm.isIntegralSalary}
                  onCheckedChange={(c) => setCForm({ ...cForm, isIntegralSalary: c })}
                />
                Salario integral
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={cForm.transportAllowance}
                  onCheckedChange={(c) => setCForm({ ...cForm, transportAllowance: c })}
                />
                Auxilio de transporte
              </label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setContractOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveContract} disabled={addContract.isPending}>
              {addContract.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: cambio salarial */}
      <Dialog open={salaryOpen} onOpenChange={setSalaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar cambio salarial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nuevo salario</Label>
              <Input
                type="number"
                value={sForm.newSalary}
                onChange={(e) => setSForm({ ...sForm, newSalary: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha efectiva</Label>
              <Input
                type="date"
                value={sForm.effectiveDate}
                onChange={(e) => setSForm({ ...sForm, effectiveDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Input
                value={sForm.reason}
                placeholder="Ej: Aumento anual, ajuste por desempeño"
                onChange={(e) => setSForm({ ...sForm, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSalaryOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveSalary} disabled={addSalary.isPending}>
              {addSalary.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
