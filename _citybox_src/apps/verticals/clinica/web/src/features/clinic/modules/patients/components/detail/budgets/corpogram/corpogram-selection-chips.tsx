'use client';

import { X } from 'lucide-react';
import { cn } from '@citybox/ui';
import { bodyRegionLabel } from '@/lib/body-regions';
import { normalizeCorpogramRegionIds } from './corpogram-data';

type CorpogramSelectionChipsProps = {
  selectedRegionIds: readonly string[];
  disabled?: boolean;
  onRemove?: (regionId: string) => void;
  className?: string;
};

export function CorpogramSelectionChips({
  selectedRegionIds,
  disabled = false,
  onRemove,
  className,
}: CorpogramSelectionChipsProps) {
  const regionIds = normalizeCorpogramRegionIds(selectedRegionIds);

  if (regionIds.length === 0) {
    return null;
  }

  return (
    <div
      className={cn('corpogram-selection-chips', className)}
      aria-label="Regiões corporais selecionadas"
    >
      {regionIds.map((regionId) => {
        const label = bodyRegionLabel(regionId);
        const canRemove = Boolean(onRemove) && !disabled;

        return (
          <span key={regionId} className="corpogram-selection-chip">
            <span className="corpogram-selection-chip-label">{label}</span>
            {canRemove ? (
              <button
                type="button"
                className="corpogram-selection-chip-remove"
                aria-label={`Remover ${label}`}
                onClick={() => onRemove?.(regionId)}
              >
                <X className="size-3" aria-hidden />
              </button>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
