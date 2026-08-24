'use client';

import {
  FACE_ORDER,
  FACE_UI_LABEL,
  HOF_REGIONS,
  normalizeHofRegionIds,
  type FaceLetter,
} from './odontogram-data';

export type OdontogramSelectionChip =
  | { type: 'tooth'; toothNumber: number; faces: FaceLetter[] }
  | { type: 'hof'; regionId: string; label: string };

type OdontogramSelectionChipsProps = {
  chips: OdontogramSelectionChip[];
  placeholder: string;
  disabled?: boolean;
  onRemove: (chip: OdontogramSelectionChip) => void;
};

export function buildOdontogramSelectionChips(
  toothNumbers: readonly number[],
  toothFaces: Readonly<Record<number, FaceLetter[]>>,
  hofRegionIds: readonly string[],
): OdontogramSelectionChip[] {
  const toothChips: OdontogramSelectionChip[] = toothNumbers.map((toothNumber) => ({
    type: 'tooth',
    toothNumber,
    faces: toothFaces[toothNumber] ?? [],
  }));

  const hofChips: OdontogramSelectionChip[] = normalizeHofRegionIds(hofRegionIds).map((regionId) => {
    const region = HOF_REGIONS.find((item) => item.id === regionId);
    return {
      type: 'hof' as const,
      regionId,
      label: region?.label ?? regionId,
    };
  });

  return [...toothChips, ...hofChips];
}

function chipLabel(chip: OdontogramSelectionChip): string {
  if (chip.type === 'hof') {
    return chip.label;
  }

  if (chip.faces.length === 0) {
    return String(chip.toothNumber);
  }

  const facesTxt = FACE_ORDER.filter((face) => chip.faces.includes(face))
    .map((face) => FACE_UI_LABEL[face])
    .join(' - ');

  return `${chip.toothNumber} (${facesTxt})`;
}

export function OdontogramSelectionChips({
  chips,
  placeholder,
  disabled = false,
  onRemove,
}: OdontogramSelectionChipsProps) {
  return (
    <div className="odonto-chip-field" data-testid="odontogram-chips">
      {chips.length === 0 ? (
        <span className="odonto-chip-field__placeholder">{placeholder}</span>
      ) : (
        chips.map((chip) => {
          const key =
            chip.type === 'tooth' ? `tooth-${chip.toothNumber}` : `hof-${chip.regionId}`;
          return (
            <span key={key} className="odonto-chip">
              {chipLabel(chip)}
              <button
                type="button"
                title="Remover"
                aria-label={`Remover ${chipLabel(chip)}`}
                disabled={disabled}
                onClick={() => onRemove(chip)}
              >
                ×
              </button>
            </span>
          );
        })
      )}
    </div>
  );
}
