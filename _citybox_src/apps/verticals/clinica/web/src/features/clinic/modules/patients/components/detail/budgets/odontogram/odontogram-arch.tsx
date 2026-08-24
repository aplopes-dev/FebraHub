'use client';

import { ARCH_LAYOUT, type FaceLetter } from './odontogram-data';
import { OdontogramTooth } from './odontogram-tooth';

type OdontogramArchProps = {
  tab: 'perm' | 'decid';
  selectedTeeth: readonly number[];
  listedTeeth: readonly number[];
  openToothNumbers?: readonly number[];
  finalizedToothNumbers?: readonly number[];
  annotatedToothNumbers?: readonly number[];
  /** Dente com spinner na coroa (carregando anotações). */
  loadingToothNumber?: number | null;
  toothFaces: Readonly<Record<number, FaceLetter[]>>;
  listedToothFaces?: Readonly<Record<number, FaceLetter[]>>;
  facesInteractive: boolean;
  disabled?: boolean;
  onToothClick: (toothNumber: number) => void;
  onFaceClick: (toothNumber: number, face: FaceLetter) => void;
};

const QUADRANTS = [
  ['topLeft', 'top-left'],
  ['topRight', 'top-right'],
  ['bottomLeft', 'bottom-left'],
  ['bottomRight', 'bottom-right'],
] as const;

export function OdontogramArch({
  tab,
  selectedTeeth,
  listedTeeth,
  openToothNumbers = [],
  finalizedToothNumbers = [],
  annotatedToothNumbers = [],
  loadingToothNumber = null,
  toothFaces,
  listedToothFaces = {},
  facesInteractive,
  disabled = false,
  onToothClick,
  onFaceClick,
}: OdontogramArchProps) {
  const layout = ARCH_LAYOUT[tab];
  const selectedSet = new Set(selectedTeeth);
  const listedSet = new Set(listedTeeth);
  const openSet = new Set(openToothNumbers);
  const finalizedSet = new Set(finalizedToothNumbers);
  const annotatedSet = new Set(annotatedToothNumbers);

  return (
    <div className="arch-grid" data-testid="odontogram-arch">
      {QUADRANTS.map(([key, cls]) => (
        <div key={key} className={`arch-quadrant arch-quadrant--${cls}`}>
          {layout[key].map((toothNumber) => {
            const treatmentStatus = openSet.has(toothNumber)
              ? ('open' as const)
              : finalizedSet.has(toothNumber)
                ? ('finalized' as const)
                : null;

            return (
              <OdontogramTooth
                key={toothNumber}
                toothNumber={toothNumber}
                selected={selectedSet.has(toothNumber)}
                listed={listedSet.has(toothNumber)}
                treatmentStatus={treatmentStatus}
                hasAnnotation={annotatedSet.has(toothNumber)}
                isLoading={loadingToothNumber === toothNumber}
                selectedFaces={toothFaces[toothNumber] ?? []}
                listedFaces={listedToothFaces[toothNumber] ?? []}
                facesInteractive={facesInteractive}
                disabled={disabled || (loadingToothNumber != null && loadingToothNumber !== toothNumber)}
                onToothClick={onToothClick}
                onFaceClick={onFaceClick}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
