'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import type { StoreOption } from '@/lib/store-routing';

type StoreVerticalSelectProps = {
  stores: StoreOption[];
  value: string;
  onChange: (storeId: string) => void;
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  id?: string;
  'aria-label'?: string;
  className?: string;
};

export function StoreVerticalSelect({
  stores,
  value,
  onChange,
  disabled,
  allowEmpty = false,
  emptyLabel = 'Selecione uma clínica…',
  id = 'store-vertical-select',
  'aria-label': ariaLabel = 'Selecione a clínica',
  className,
}: StoreVerticalSelectProps) {
  // App single-vertical: lista plana, sem agrupar por vertical.
  const sorted = [...stores].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const selectValue = value || (allowEmpty ? '__empty__' : undefined);

  return (
    <Select
      value={selectValue}
      onValueChange={(next) => {
        if (next === '__empty__') onChange('');
        else onChange(next);
      }}
      disabled={disabled || stores.length === 0}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        className={className ?? 'w-[min(100%,16rem)]'}
      >
        <SelectValue placeholder={emptyLabel} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty ? (
          <SelectItem value="__empty__" disabled>
            {emptyLabel}
          </SelectItem>
        ) : null}
        {sorted.map((store) => (
          <SelectItem key={store.id} value={store.id}>
            {store.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type StoreVerticalFieldProps = Omit<StoreVerticalSelectProps, 'aria-label'>;

export function StoreVerticalField({
  id = 'store-vertical-combobox',
  ...selectProps
}: StoreVerticalFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        Clínica
      </label>
      <StoreVerticalSelect id={id} aria-label="Selecione a clínica" {...selectProps} />
    </div>
  );
}
