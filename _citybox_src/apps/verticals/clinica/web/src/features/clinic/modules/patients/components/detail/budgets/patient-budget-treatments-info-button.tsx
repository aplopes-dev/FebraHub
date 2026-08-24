'use client';

import { Info } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@citybox/ui/atoms';

type PatientBudgetTreatmentsInfoButtonProps = {
  disabled?: boolean;
  onClick: () => void;
  className?: string;
};

export function PatientBudgetTreatmentsInfoButton({
  disabled = false,
  onClick,
  className,
}: PatientBudgetTreatmentsInfoButtonProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-foreground transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            aria-label="Ver lista de procedimentos"
            disabled={disabled}
            onClick={onClick}
          >
            <Info className="size-3.5" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Ver lista de procedimentos</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
