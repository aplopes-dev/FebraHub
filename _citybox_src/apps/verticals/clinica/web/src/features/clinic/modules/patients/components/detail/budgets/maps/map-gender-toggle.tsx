'use client';

import { cn } from '@citybox/ui';
import type { AnatomyMapGender } from './anatomy-map-types';
import './anatomy-map-controls.css';

type MapGenderToggleProps = {
  gender: AnatomyMapGender;
  disabled?: boolean;
  onChange: (gender: AnatomyMapGender) => void;
  className?: string;
  label?: string;
  womanLabel?: string;
  manLabel?: string;
};

export function MapGenderToggle({
  gender,
  disabled = false,
  onChange,
  className,
  label = 'Sexo',
  womanLabel = 'Silhueta feminina',
  manLabel = 'Silhueta masculina',
}: MapGenderToggleProps) {
  return (
    <div
      className={cn('anatomy-map-gender-toolbar', className)}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className={cn('anatomy-map-gender-btn', gender === 'woman' && 'is-active')}
        title={womanLabel}
        aria-label={womanLabel}
        aria-pressed={gender === 'woman'}
        disabled={disabled}
        onClick={() => onChange('woman')}
      >
        <span className="anatomy-map-gender-icon" aria-hidden>
          ♀
        </span>
      </button>
      <button
        type="button"
        className={cn('anatomy-map-gender-btn', gender === 'man' && 'is-active')}
        title={manLabel}
        aria-label={manLabel}
        aria-pressed={gender === 'man'}
        disabled={disabled}
        onClick={() => onChange('man')}
      >
        <span className="anatomy-map-gender-icon" aria-hidden>
          ♂
        </span>
      </button>
    </div>
  );
}
