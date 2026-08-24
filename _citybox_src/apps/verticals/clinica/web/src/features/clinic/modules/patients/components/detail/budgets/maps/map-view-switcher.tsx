'use client';

import { cn } from '@citybox/ui';
import type { AnatomyMapView } from './anatomy-map-types';
import './anatomy-map-controls.css';

export type MapViewOption<T extends string = AnatomyMapView> = {
  id: T;
  label: string;
};

type MapViewSwitcherProps<T extends string = AnatomyMapView> = {
  view: T;
  options: readonly MapViewOption<T>[];
  disabled?: boolean;
  onChange: (view: T) => void;
  className?: string;
  ariaLabel?: string;
};

export function MapViewSwitcher<T extends string = AnatomyMapView>({
  view,
  options,
  disabled = false,
  onChange,
  className,
  ariaLabel = 'Vista',
}: MapViewSwitcherProps<T>) {
  return (
    <div
      className={cn('anatomy-map-view-tabs', className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          className={cn('anatomy-map-view-tab', view === option.id && 'is-active')}
          aria-selected={view === option.id}
          disabled={disabled}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export const CORPogram_VIEW_OPTIONS: readonly MapViewOption<'front' | 'back'>[] = [
  { id: 'front', label: 'Frente' },
  { id: 'back', label: 'Costas' },
] as const;
