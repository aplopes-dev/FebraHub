'use client';

import { Trash2 } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@citybox/ui/atoms';
import {
  DEFAULT_PRESCRIPTION_MEASURE,
  PRESCRIPTION_MEASURE_OPTIONS,
  type PrescriptionItem,
  type PrescriptionMeasure,
} from '../../../../types/patient-prescription';

type PrescriptionItemCardProps = {
  item: PrescriptionItem;
  disabled?: boolean;
  onChange: (item: PrescriptionItem) => void;
  onRemove: () => void;
};

export function PrescriptionItemCard({
  item,
  disabled = false,
  onChange,
  onRemove,
}: PrescriptionItemCardProps) {
  const measure = item.measure || DEFAULT_PRESCRIPTION_MEASURE;

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{item.name}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={disabled}
          onClick={onRemove}
          aria-label={`Remover ${item.name}`}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor={`rx-qty-${item.id}`}>Quantidade</Label>
          <Input
            id={`rx-qty-${item.id}`}
            value={item.quantity ?? ''}
            disabled={disabled}
            inputMode="numeric"
            onChange={(event) =>
              onChange({ ...item, quantity: event.target.value.replace(/\D/g, '') })
            }
          />
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor={`rx-measure-${item.id}`}>Medida</Label>
          <Select
            value={measure}
            onValueChange={(nextMeasure) =>
              onChange({ ...item, measure: nextMeasure as PrescriptionMeasure })
            }
            disabled={disabled}
          >
            <SelectTrigger id={`rx-measure-${item.id}`} className="w-full max-w-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESCRIPTION_MEASURE_OPTIONS.map((measure) => (
                <SelectItem key={measure} value={measure}>
                  {measure}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Textarea
        id={`rx-posology-${item.id}`}
        value={item.posology ?? ''}
        disabled={disabled}
        rows={2}
        placeholder="Posologia"
        aria-label="Posologia"
        onChange={(event) => onChange({ ...item, posology: event.target.value })}
      />
    </div>
  );
}
