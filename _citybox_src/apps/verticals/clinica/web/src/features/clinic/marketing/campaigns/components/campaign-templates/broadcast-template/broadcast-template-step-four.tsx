'use client';

import type { SelectedCampaignType } from '../../../types';
import { AniversarioStepFour } from './aniversario/aniversario-step-four';
import type {
  AniversarioStepFourFormData,
  AniversarioStepTwoFormData,
} from './aniversario/aniversario-form.schema';

type BroadcastTemplateStepFourProps = {
  selectedType?: SelectedCampaignType;
  stepTwoData?: Partial<AniversarioStepTwoFormData>;
  initialData?: Partial<AniversarioStepFourFormData>;
  onDataChange?: (data: AniversarioStepFourFormData) => void;
  onValidationChange?: (isValid: boolean) => void;
};

export function BroadcastTemplateStepFour({
  selectedType,
  stepTwoData,
  initialData,
  onDataChange,
  onValidationChange,
}: BroadcastTemplateStepFourProps) {
  if (selectedType?.typeId === 'aniversario') {
    return (
      <AniversarioStepFour
        stepTwoData={stepTwoData}
        initialData={initialData}
        onDataChange={onDataChange}
        onValidationChange={onValidationChange}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-2 text-xl font-semibold">Ativar</h2>
        <p className="text-muted-foreground">
          Template BROADCAST ainda não implementado para este tipo.
        </p>
      </div>
    </div>
  );
}
