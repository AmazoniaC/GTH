import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Building2, Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrganization, useUpdateOrganization } from '../organization.api';
import { getErrorMessage } from '@/lib/api';

const EMPTY = {
  name: '',
  nit: '',
  legalName: '',
  legalRepresentative: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  website: '',
};

export function CompanySection() {
  const { data: org, isLoading } = useOrganization();
  const update = useUpdateOrganization();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (org) {
      setForm({
        name: org.name ?? '',
        nit: org.nit ?? '',
        legalName: org.legalName ?? '',
        legalRepresentative: org.legalRepresentative ?? '',
        address: org.address ?? '',
        city: org.city ?? '',
        phone: org.phone ?? '',
        email: org.email ?? '',
        website: org.website ?? '',
      });
    }
  }, [org]);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const save = async () => {
    if (form.name.trim().length < 2) return toast.error('El nombre de la empresa es obligatorio.');
    try {
      await update.mutateAsync(form);
      toast.success('Datos de la empresa actualizados');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4 text-primary" /> Datos de la empresa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nombre comercial</Label>
                <Input value={form.name} onChange={set('name')} />
              </div>
              <div className="space-y-1.5">
                <Label>NIT</Label>
                <Input value={form.nit} onChange={set('nit')} />
              </div>
              <div className="space-y-1.5">
                <Label>Razón social</Label>
                <Input value={form.legalName} onChange={set('legalName')} />
              </div>
              <div className="space-y-1.5">
                <Label>Representante legal / responsable</Label>
                <Input value={form.legalRepresentative} onChange={set('legalRepresentative')} />
              </div>
              <div className="space-y-1.5">
                <Label>Correo</Label>
                <Input type="email" value={form.email} onChange={set('email')} />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={set('phone')} />
              </div>
              <div className="space-y-1.5">
                <Label>Dirección</Label>
                <Input value={form.address} onChange={set('address')} />
              </div>
              <div className="space-y-1.5">
                <Label>Ciudad</Label>
                <Input value={form.city} onChange={set('city')} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Sitio web</Label>
                <Input value={form.website} onChange={set('website')} placeholder="https://..." />
              </div>
            </div>
            <Button onClick={save} disabled={update.isPending}>
              {update.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
