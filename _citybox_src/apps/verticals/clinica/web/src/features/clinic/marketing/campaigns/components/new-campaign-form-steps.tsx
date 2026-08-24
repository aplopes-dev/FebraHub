'use client';

import { CampaignStepOne } from './campaign-step-one/campaign-step-one';
import { PageTemplateStepTwo } from './campaign-templates/page-template/step-two/page-template-step-two';
import { PageTemplateStepThree } from './campaign-templates/page-template/step-three/page-template-step-three';
import { PageTemplateStepFour } from './campaign-templates/page-template/step-four/page-template-step-four';
import { BroadcastTemplateStepTwo } from './campaign-templates/broadcast-template/broadcast-template-step-two';
import { BroadcastTemplateStepThree } from './campaign-templates/broadcast-template/broadcast-template-step-three';
import { BroadcastTemplateStepFour } from './campaign-templates/broadcast-template/broadcast-template-step-four';
import { AutomationTemplateStepTwo } from './campaign-templates/automation-template/automation-template-step-two';
import { AutomationTemplateStepThree } from './campaign-templates/automation-template/automation-template-step-three';
import { AutomationTemplateStepFour } from './campaign-templates/automation-template/automation-template-step-four';
import type { SelectedCampaignType, CampaignStrategy } from '../types';
import type { PageStrategyFormData } from './campaign-templates/page-template/step-two/page-template-step-two.schema';
import type { PageStrategyStepThreeFormData } from './campaign-templates/page-template/step-three/page-template-step-three.schema';
import type { PageStrategyStepFourFormData } from './campaign-templates/page-template/step-four/page-template-step-four.schema';
import type {
  AniversarioStepFourFormData,
  AniversarioStepTwoFormData,
} from './campaign-templates/broadcast-template/aniversario/aniversario-form.schema';

type NewCampaignFormStepsProps = {
  currentStep: number;
  selectedType?: SelectedCampaignType;
  campaignStrategy?: CampaignStrategy | null;
  onSelectType: (type: SelectedCampaignType) => void;
  pageStrategyData?: Partial<PageStrategyFormData>;
  onPageStrategyDataChange?: (data: Partial<PageStrategyFormData>) => void;
  onStepTwoValidationChange?: (isValid: boolean) => void;
  pageStrategyStepThreeData?: Partial<PageStrategyStepThreeFormData>;
  onPageStrategyStepThreeDataChange?: (
    data: Partial<PageStrategyStepThreeFormData>,
  ) => void;
  onStepThreeValidationChange?: (isValid: boolean) => void;
  pageStrategyStepFourData?: Partial<PageStrategyStepFourFormData>;
  onPageStrategyStepFourDataChange?: (
    data: Partial<PageStrategyStepFourFormData>,
  ) => void;
  onStepFourValidationChange?: (isValid: boolean) => void;
  onLogoFileChange?: (file: File | null) => void;
  aniversarioStepTwoData?: Partial<AniversarioStepTwoFormData>;
  onAniversarioStepTwoDataChange?: (data: AniversarioStepTwoFormData) => void;
  aniversarioStepFourData?: Partial<AniversarioStepFourFormData>;
  onAniversarioStepFourDataChange?: (data: AniversarioStepFourFormData) => void;
};

export function NewCampaignFormSteps({
  currentStep,
  selectedType,
  campaignStrategy,
  onSelectType,
  pageStrategyData,
  onPageStrategyDataChange,
  onStepTwoValidationChange,
  pageStrategyStepThreeData,
  onPageStrategyStepThreeDataChange,
  onStepThreeValidationChange,
  pageStrategyStepFourData,
  onPageStrategyStepFourDataChange,
  onStepFourValidationChange,
  onLogoFileChange,
  aniversarioStepTwoData,
  onAniversarioStepTwoDataChange,
  aniversarioStepFourData,
  onAniversarioStepFourDataChange,
}: NewCampaignFormStepsProps) {
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-lg font-semibold">Tipo da campanha</h2>
              <p className="text-muted-foreground text-sm">
                Escolha o segmento e o tipo de campanha que deseja criar.
              </p>
            </div>
            <div className="mt-6">
              <CampaignStepOne
                selectedType={selectedType}
                onSelectType={onSelectType}
              />
            </div>
          </div>
        );

      case 2:
        if (!campaignStrategy) {
          return (
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-muted p-12 text-center">
                <p className="text-muted-foreground">
                  Selecione um tipo de campanha no Step 1
                </p>
              </div>
            </div>
          );
        }

        if (campaignStrategy === 'PAGE') {
          return (
            <PageTemplateStepTwo
              selectedType={selectedType}
              initialData={pageStrategyData}
              onDataChange={onPageStrategyDataChange}
              onValidationChange={onStepTwoValidationChange}
            />
          );
        }
        if (campaignStrategy === 'BROADCAST') {
          return (
            <BroadcastTemplateStepTwo
              selectedType={selectedType}
              initialData={aniversarioStepTwoData}
              onDataChange={onAniversarioStepTwoDataChange}
              onValidationChange={onStepTwoValidationChange}
            />
          );
        }
        if (campaignStrategy === 'AUTOMATION') {
          return <AutomationTemplateStepTwo selectedType={selectedType} />;
        }
        return null;

      case 3:
        if (!campaignStrategy) {
          return (
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-muted p-12 text-center">
                <p className="text-muted-foreground">
                  Selecione um tipo de campanha no Step 1
                </p>
              </div>
            </div>
          );
        }

        if (campaignStrategy === 'PAGE') {
          return (
            <PageTemplateStepThree
              selectedType={selectedType}
              initialData={pageStrategyStepThreeData}
              onDataChange={onPageStrategyStepThreeDataChange}
              onValidationChange={onStepThreeValidationChange}
              onLogoFileChange={onLogoFileChange}
            />
          );
        }
        if (campaignStrategy === 'BROADCAST') {
          return (
            <BroadcastTemplateStepThree
              selectedType={selectedType}
              stepTwoData={aniversarioStepTwoData}
            />
          );
        }
        if (campaignStrategy === 'AUTOMATION') {
          return <AutomationTemplateStepThree selectedType={selectedType} />;
        }
        return null;

      case 4:
        if (!campaignStrategy) {
          return (
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-muted p-12 text-center">
                <p className="text-muted-foreground">
                  Selecione um tipo de campanha no Step 1
                </p>
              </div>
            </div>
          );
        }

        if (campaignStrategy === 'PAGE') {
          return (
            <PageTemplateStepFour
              selectedType={selectedType}
              pageStrategyData={pageStrategyData}
              pageStrategyStepThreeData={pageStrategyStepThreeData}
              initialData={pageStrategyStepFourData}
              onDataChange={onPageStrategyStepFourDataChange}
              onValidationChange={onStepFourValidationChange}
            />
          );
        }
        if (campaignStrategy === 'BROADCAST') {
          return (
            <BroadcastTemplateStepFour
              selectedType={selectedType}
              stepTwoData={aniversarioStepTwoData}
              initialData={aniversarioStepFourData}
              onDataChange={onAniversarioStepFourDataChange}
              onValidationChange={onStepFourValidationChange}
            />
          );
        }
        if (campaignStrategy === 'AUTOMATION') {
          return <AutomationTemplateStepFour selectedType={selectedType} />;
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-0 flex-1 [&_[data-slot=card]]:shadow-none">
      <div className="p-4 sm:p-6">{renderStepContent()}</div>
    </div>
  );
}
