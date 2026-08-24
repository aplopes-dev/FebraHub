'use client';

import type { LucideIcon } from 'lucide-react';
import { Plus } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Button, Card, CardTitle } from '@citybox/ui/atoms';

/** Grade 2×2 (padrão da aba Documentos). */
export const DOCUMENT_TYPE_GRID_CLASS =
  'grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4';

type DocumentTypeCardProps = {
  title: string;
  subtitle?: string;
  buttonLabel: string;
  icon: LucideIcon;
  disabled?: boolean;
  onAction?: () => void;
  topAction?: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
  };
};

export function DocumentTypeCard({
  title,
  subtitle,
  buttonLabel,
  icon: Icon,
  disabled = false,
  onAction,
  topAction,
}: DocumentTypeCardProps) {
  const TopActionIcon = topAction?.icon;

  return (
    <Card
      className={cn(
        'relative flex min-h-0 w-full flex-col overflow-hidden border-border/60 py-0 shadow-sm [--card-spacing:0]',
        disabled && 'opacity-50',
      )}
    >
      {disabled ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 bg-background/40 backdrop-blur-[1px]"
          aria-hidden
        />
      ) : null}

      <div className="flex h-full min-w-0 flex-col gap-4 p-4 sm:gap-5 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:size-10">
            <Icon className="size-4 sm:size-5" aria-hidden />
          </span>
          <div className="min-w-0 space-y-0.5">
            <CardTitle className="text-base leading-tight sm:text-lg">{title}</CardTitle>
            {subtitle ? (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          {topAction && TopActionIcon ? (
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full bg-background sm:h-10"
              disabled={disabled}
              onClick={topAction.onClick}
            >
              <TopActionIcon className="mr-2 size-4 shrink-0" aria-hidden />
              {topAction.label}
            </Button>
          ) : null}
          <Button
            type="button"
            className="h-9 w-full sm:h-10"
            disabled={disabled}
            onClick={onAction}
          >
            <Plus className="mr-2 size-4 shrink-0" aria-hidden />
            {buttonLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}
