'use client';

import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
} from "@/features/clinic/marketing/campaigns/_ui/stepper";
import { Check, Megaphone, Target, FileText, CheckSquare2 } from "lucide-react";
import { cn } from "@citybox/ui";

type NewCampaignStepperHeaderProps = {
  currentStep: number;
  onStepChange?: (step: number) => void;
};

const STEPS = [
  {
    step: 1,
    title: "Tipo da campanha",
    description: "Escolha o tipo",
    icon: Megaphone,
  },
  {
    step: 2,
    title: "Objetivo & Público",
    description: "Defina objetivos",
    icon: Target,
  },
  {
    step: 3,
    title: "Conteúdo",
    description: "Crie o conteúdo",
    icon: FileText,
  },
  {
    step: 4,
    title: "Configurações & Revisão",
    description: "Revise e configure a campanha",
    icon: CheckSquare2,
  },
] as const;

export function NewCampaignStepperHeader({
  currentStep,
  onStepChange,
}: NewCampaignStepperHeaderProps) {
  const activeStep = STEPS.find((step) => step.step === currentStep) ?? STEPS[0];

  return (
    <div className="shrink-0 border-b bg-background px-4 py-3 sm:px-6 sm:py-4">
      {/* Mobile: só indicadores + título do passo atual */}
      <div className="md:hidden">
        <div className="flex w-full items-center">
          {STEPS.map((stepConfig, index) => {
            const isCompleted = currentStep > stepConfig.step;
            const isActive = currentStep === stepConfig.step;
            const canNavigate = stepConfig.step <= currentStep;

            return (
              <div key={stepConfig.step} className="contents">
                <button
                  type="button"
                  disabled={!canNavigate}
                  aria-label={`Passo ${stepConfig.step}: ${stepConfig.title}`}
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => {
                    if (canNavigate) onStepChange?.(stepConfig.step);
                  }}
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    isCompleted && "bg-green-500 text-white",
                    isActive && !isCompleted && "bg-primary text-primary-foreground",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground",
                    canNavigate ? "cursor-pointer" : "cursor-default opacity-60",
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    String(stepConfig.step).padStart(2, "0")
                  )}
                </button>
                {index < STEPS.length - 1 ? (
                  <div
                    className={cn(
                      "mx-1.5 h-0.5 min-w-0 flex-1 rounded-full",
                      currentStep > stepConfig.step ? "bg-primary" : "bg-muted",
                    )}
                    aria-hidden
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="mt-3 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {String(activeStep.step).padStart(2, "0")} · {activeStep.title}
          </p>
          <p className="text-xs text-muted-foreground">{activeStep.description}</p>
        </div>
      </div>

      {/* md+: stepper completo em linha */}
      <div className="hidden md:block">
        <Stepper
          value={currentStep - 1}
          onValueChange={(step) => onStepChange?.(step + 1)}
          className="w-full max-w-full justify-between gap-2 lg:justify-center lg:gap-6 xl:space-x-10"
        >
          {STEPS.map((stepConfig, index) => {
            const isCompleted = currentStep > stepConfig.step;
            const isActive = currentStep === stepConfig.step;

            return (
              <StepperItem
                key={stepConfig.step}
                step={stepConfig.step - 1}
                completed={isCompleted}
                className="min-w-0"
              >
                <StepperTrigger className="min-w-0 gap-2 lg:gap-3">
                  <StepperIndicator asChild>
                    {isCompleted ? (
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-xs text-white">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : isActive ? (
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {String(stepConfig.step).padStart(2, "0")}
                      </span>
                    ) : (
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {String(stepConfig.step).padStart(2, "0")}
                      </span>
                    )}
                  </StepperIndicator>
                  <div className="flex min-w-0 flex-col items-start">
                    <StepperTitle className="truncate text-sm font-medium">
                      {stepConfig.title}
                    </StepperTitle>
                    <StepperDescription className="hidden truncate text-xs text-muted-foreground lg:block">
                      {stepConfig.description}
                    </StepperDescription>
                  </div>
                </StepperTrigger>
                {index < STEPS.length - 1 ? (
                  <StepperSeparator className="mx-2 max-w-12 flex-1 lg:max-w-none" />
                ) : null}
              </StepperItem>
            );
          })}
        </Stepper>
      </div>
    </div>
  );
}
