import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOptions } from '@/features/catalog/catalog.api';
import type { CatalogCategory } from '@/types';

interface CatalogSelectProps {
  category: CatalogCategory;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Selector alimentado por una lista editable del catálogo (Configuración →
 * Listas). El valor guardado es la etiqueta de la opción. Si el valor actual
 * no está en la lista (dato heredado), se agrega para no perderlo.
 */
export function CatalogSelect({ category, value, onChange, placeholder }: CatalogSelectProps) {
  const { data: options } = useOptions(category);
  const labels = (options ?? []).filter((o) => o.isActive).map((o) => o.label);
  const items = value && !labels.includes(value) ? [value, ...labels] : labels;

  return (
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? 'Seleccionar'} />
      </SelectTrigger>
      <SelectContent>
        {items.map((label) => (
          <SelectItem key={label} value={label}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
