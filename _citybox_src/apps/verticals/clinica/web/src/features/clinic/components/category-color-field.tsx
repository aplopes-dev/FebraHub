'use client';

import { Label } from '@citybox/ui/atoms';
import { normalizeCategoryHex } from '@/features/clinic/lib/normalize-category-hex';

type CategoryColorFieldProps = {
  id?: string;
  value: string;
  onChange: (hex: string) => void;
  label?: string;
};

/** Campo de cor por saturação (`input type="color"`). Valor sempre `#rrggbb`. */
export function CategoryColorField({
  id = 'category-color',
  value,
  onChange,
  label = 'Cor',
}: CategoryColorFieldProps) {
  const hex = normalizeCategoryHex(value);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="color"
        value={hex}
        onChange={(event) => onChange(normalizeCategoryHex(event.target.value))}
        className="size-10 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
        aria-label={label}
      />
    </div>
  );
}
