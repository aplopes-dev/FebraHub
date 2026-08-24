'use client';

import type { ReactNode } from 'react';
import { FileOutput, Maximize2, Minimize2, PenLine, Plus } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@citybox/ui/atoms';
import { useCan } from '@/features/clinic/permissions';

type EvolutionToolbarAction = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  expanded?: boolean;
};

type PatientTreatmentEvolutionToolbarProps = {
  historyActionsDisabled?: boolean;
  isExpanded?: boolean;
  onEmitEvolution?: () => void;
  onSignEvolution?: () => void;
  onAddEvolution?: () => void;
  onToggleExpand?: () => void;
  className?: string;
};

export function EvolutionToolbarIconButton({
  label,
  icon,
  onClick,
  disabled = false,
  pressed = false,
  expanded = false,
}: EvolutionToolbarAction) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={expanded ? 'icon-lg' : 'icon-sm'}
          className={cn(expanded && 'size-11 [&_svg]:size-5')}
          disabled={disabled}
          aria-label={label}
          aria-pressed={pressed}
          onClick={onClick}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export function PatientTreatmentEvolutionToolbar({
  historyActionsDisabled = false,
  isExpanded = false,
  onEmitEvolution,
  onSignEvolution,
  onAddEvolution,
  onToggleExpand,
  className,
}: PatientTreatmentEvolutionToolbarProps) {
  const canCreateEvolution = useCan('create', 'PatientEvolution');

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn('flex shrink-0 items-center gap-1', className)}>
        {canCreateEvolution && onEmitEvolution ? (
          <EvolutionToolbarIconButton
            label="Emitir evolução"
            icon={<FileOutput className="size-4" aria-hidden />}
            disabled={historyActionsDisabled}
            onClick={() => onEmitEvolution()}
          />
        ) : null}
        {onSignEvolution ? (
          <EvolutionToolbarIconButton
            label="Assinar evolução"
            icon={<PenLine className="size-4" aria-hidden />}
            disabled={historyActionsDisabled}
            onClick={() => onSignEvolution()}
          />
        ) : null}
        {canCreateEvolution && onAddEvolution ? (
          <EvolutionToolbarIconButton
            label="Adicionar nova evolução"
            icon={<Plus className="size-4" aria-hidden />}
            onClick={() => onAddEvolution()}
          />
        ) : null}
        {onToggleExpand ? (
          <EvolutionToolbarIconButton
            label={isExpanded ? 'Recolher evolução' : 'Expandir evolução'}
            icon={
              isExpanded ? (
                <Minimize2 className="size-4" aria-hidden />
              ) : (
                <Maximize2 className="size-4" aria-hidden />
              )
            }
            pressed={isExpanded}
            onClick={() => onToggleExpand()}
          />
        ) : null}
      </div>
    </TooltipProvider>
  );
}
