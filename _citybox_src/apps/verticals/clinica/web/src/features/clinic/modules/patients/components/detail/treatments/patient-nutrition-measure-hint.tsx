'use client';

import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@citybox/ui/atoms';

type PatientNutritionMeasureHintProps = {
  title: string;
  text: string;
  /** Ilustração da medida; o tooltip fica só com o texto quando ausente. */
  image?: string;
};

/** Ajuda "?" das medidas corporais da nutrição (dobras e perímetros). */
export function PatientNutritionMeasureHint({
  title,
  text,
  image,
}: PatientNutritionMeasureHintProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={title}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <HelpCircle className="size-4" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm p-3">
          <div className="flex items-center gap-3">
            {image ? (
              <img
                src={image}
                alt=""
                className="size-24 shrink-0 rounded-md object-cover"
              />
            ) : null}
            <div className="space-y-1 text-left">
              <p className="text-sm font-bold">{title}</p>
              <p className="text-xs leading-relaxed">{text}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
