'use client';

import type { SelectedCampaignType } from '../../../types';
import { AniversarioStepThree } from './aniversario/aniversario-step-three';
import type { AniversarioStepTwoFormData } from './aniversario/aniversario-form.schema';

type BroadcastTemplateStepThreeProps = {
  selectedType?: SelectedCampaignType;
  stepTwoData?: Partial<AniversarioStepTwoFormData>;
};

export function BroadcastTemplateStepThree({
  selectedType,
  stepTwoData,
}: BroadcastTemplateStepThreeProps) {
  if (selectedType?.typeId === 'aniversario') {
    return <AniversarioStepThree stepTwoData={stepTwoData} />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-2 text-xl font-semibold">Pré-visualização</h2>
        <p className="text-muted-foreground">
          Template BROADCAST ainda não implementado para este tipo.
        </p>
      </div>
    </div>
  );
}
