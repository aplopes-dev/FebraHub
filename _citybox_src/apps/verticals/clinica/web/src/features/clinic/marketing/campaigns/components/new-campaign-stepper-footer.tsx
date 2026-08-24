'use client';

import { useRouter } from "next/navigation";
import { Button } from "@citybox/ui/atoms";

type NewCampaignStepperFooterProps = {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  canContinue?: boolean;
};

export function NewCampaignStepperFooter({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onCancel,
  isSubmitting = false,
  canContinue = true,
}: NewCampaignStepperFooterProps) {
  const router = useRouter();

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/marketing/campaigns");
    }
  };

  const handlePrev = () => {
    if (isFirstStep) {
      handleCancel();
    } else {
      onPrev();
    }
  };

  return (
    <div className="shrink-0 border-t bg-background px-4 py-3 sm:px-6 sm:py-2.5">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
        <Button
          className="w-full px-8 sm:w-auto"
          type="button"
          variant="outline"
          onClick={handlePrev}
          disabled={isSubmitting}
        >
          {isFirstStep ? "Cancelar" : "Voltar"}
        </Button>

        <Button
          className="w-full px-8 sm:w-auto"
          type="button"
          onClick={onNext}
          disabled={isSubmitting || !canContinue}
        >
          {isSubmitting
            ? "Criando..."
            : isLastStep
              ? "Ativar campanha"
              : "Continuar"}
        </Button>
      </div>
    </div>
  );
}
