'use client';

import { Trash2 } from 'lucide-react';
import { Checkbox, Input, Label } from '@citybox/ui/atoms';
import { ClinicCompactSwitch } from '@/features/clinic/components/clinic-compact-switch';
import { useStore } from '@/lib/store-context';
import { storeSupportsTreatmentToothFaces } from '@/lib/clinic-strand';
import { PlanBrlCurrencyInput } from './plan-brl-currency-input';
import type { PlanTreatmentItem } from '../types/clinic-plan-specialty';

type TreatmentPatch = Partial<
  Pick<
    PlanTreatmentItem,
    'name' | 'treatmentValue' | 'treatmentCost' | 'enabled' | 'acceptsFaces'
  >
>;

type PlanTreatmentCardProps = {
  treatment: PlanTreatmentItem;
  disabled?: boolean;
  onUpdate: (patch: TreatmentPatch) => void;
  onRemove: () => void;
};

export function PlanTreatmentCard({
  treatment,
  disabled = false,
  onUpdate,
  onRemove,
}: PlanTreatmentCardProps) {
  const { clinicStrand } = useStore();
  const showAcceptsFaces = storeSupportsTreatmentToothFaces(clinicStrand);
  const baseId = treatment.id;

  return (
    <article
      id={`treatment-card-${treatment.id}`}
      className="rounded-xl border border-border/60 bg-card p-4"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`${baseId}-name`}>Procedimento</Label>
          <Input
            id={`${baseId}-name`}
            value={treatment.name}
            disabled={disabled}
            placeholder="Nome do procedimento"
            onChange={(event) => onUpdate({ name: event.target.value })}
          />
        </div>

        {showAcceptsFaces ? (
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${baseId}-accepts-faces`}
              checked={treatment.acceptsFaces}
              disabled={disabled}
              onCheckedChange={(checked) => onUpdate({ acceptsFaces: checked === true })}
            />
            <Label htmlFor={`${baseId}-accepts-faces`} className="text-sm font-normal">
              Aceita faces
            </Label>
          </div>
        ) : null}

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[7.5rem] flex-1 space-y-1.5">
            <Label htmlFor={`${baseId}-value`}>Valor do procedimento</Label>
            <PlanBrlCurrencyInput
              id={`${baseId}-value`}
              value={treatment.treatmentValue}
              disabled={disabled}
              onValueChange={(treatmentValue) => onUpdate({ treatmentValue })}
            />
          </div>

          <div className="min-w-[7.5rem] flex-1 space-y-1.5">
            <Label htmlFor={`${baseId}-cost`}>Custo do procedimento</Label>
            <PlanBrlCurrencyInput
              id={`${baseId}-cost`}
              value={treatment.treatmentCost}
              disabled={disabled}
              onValueChange={(treatmentCost) => onUpdate({ treatmentCost })}
            />
          </div>

          <div className="flex items-center gap-2 pb-2">
            <ClinicCompactSwitch
              id={`${baseId}-enabled`}
              checked={treatment.enabled}
              disabled={disabled}
              onCheckedChange={(checked) => onUpdate({ enabled: checked === true })}
            />
            <Label htmlFor={`${baseId}-enabled`} className="text-sm font-normal">
              Usar
            </Label>
          </div>

          <button
            type="button"
            disabled={disabled}
            aria-label="Excluir procedimento"
            onClick={onRemove}
            className="mb-0.5 rounded-md p-2 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
