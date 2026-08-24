'use client';

import { CheckIcon } from 'lucide-react';
import { cn } from '@citybox/ui';

export type ProductFormStepConfig = {
  id: string;
  label: string;
  description: string;
};

type ProductFormStepperProps = {
  steps: readonly ProductFormStepConfig[];
  currentIndex: number;
};

export function ProductFormStepper({ steps, currentIndex }: ProductFormStepperProps) {
  return (
    <div className="flex w-full items-start gap-0 px-2">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className={cn('flex min-w-0', isLast ? 'flex-none' : 'flex-1')}>
            <div className="flex min-w-0 flex-col items-start gap-2">
              <div className="flex w-full items-center">
                <div
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    isActive || isCompleted
                      ? 'border-primary bg-primary text-white'
                      : 'border-[#c7c7c7] bg-white text-transparent',
                  )}
                >
                  {isCompleted ? (
                    <CheckIcon className="size-3.5" strokeWidth={3} />
                  ) : (
                    <span
                      className={cn(
                        'size-2 rounded-full',
                        isActive ? 'bg-white' : 'bg-transparent',
                      )}
                    />
                  )}
                </div>

                {!isLast && (
                  <div
                    className={cn(
                      'mx-2 h-0.5 min-w-4 flex-1 rounded-full',
                      isCompleted ? 'bg-primary' : 'bg-[#e5e5e5]',
                    )}
                  />
                )}
              </div>

              <div className="pr-3">
                <p
                  className={cn(
                    'text-xs font-bold leading-tight',
                    isActive || isCompleted ? 'text-[#171717]' : 'text-[#a3a3a3]',
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-[10px] font-medium leading-snug text-[#a3a3a3]">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
