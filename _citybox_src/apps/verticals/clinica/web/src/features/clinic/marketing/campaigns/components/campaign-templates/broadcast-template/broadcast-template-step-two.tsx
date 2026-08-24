'use client';

import type { SelectedCampaignType } from '../../../types';
import { AniversarioStepTwo } from './aniversario/aniversario-step-two';
import type { AniversarioStepTwoFormData } from './aniversario/aniversario-form.schema';

type BroadcastTemplateStepTwoProps = {
  selectedType?: SelectedCampaignType;
  initialData?: Partial<AniversarioStepTwoFormData>;
  onDataChange?: (data: AniversarioStepTwoFormData) => void;
  onValidationChange?: (isValid: boolean) => void;
};

export function BroadcastTemplateStepTwo({
  selectedType,
  initialData,
  onDataChange,
  onValidationChange,
}: BroadcastTemplateStepTwoProps) {
  if (selectedType?.typeId === 'aniversario') {
    return (
      <AniversarioStepTwo
        initialData={initialData}
        onDataChange={onDataChange}
        onValidationChange={onValidationChange}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-2 text-xl font-semibold">Objetivo & Público</h2>
        <p className="text-muted-foreground">
          Template BROADCAST ainda não implementado para este tipo.
        </p>
      </div>
    </div>
  );
}
