'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  FACE_ORDER,
  FACE_SHAPE,
  TOOTH_SHAPES,
  isUpperArch,
  resolveToothShape,
  type FaceLetter,
} from './odontogram-data';

type OdontogramToothProps = {
  toothNumber: number;
  selected: boolean;
  listed: boolean;
  /** Status visual do tratamento (amarelo/verde) — prevalece sobre selected/listed. */
  treatmentStatus?: 'open' | 'finalized' | null;
  /** Indica anotação clínica no dente (mostra "!" roxo ao lado do número). */
  hasAnnotation?: boolean;
  /** Exibe spinner na coroa (ex.: carregando anotações antes do popover). */
  isLoading?: boolean;
  selectedFaces: readonly FaceLetter[];
  listedFaces: readonly FaceLetter[];
  facesInteractive: boolean;
  disabled?: boolean;
  onToothClick: (toothNumber: number) => void;
  onFaceClick: (toothNumber: number, face: FaceLetter) => void;
};

export function OdontogramTooth({
  toothNumber,
  selected,
  listed,
  treatmentStatus = null,
  hasAnnotation = false,
  isLoading = false,
  selectedFaces,
  listedFaces,
  facesInteractive,
  disabled = false,
  onToothClick,
  onFaceClick,
}: OdontogramToothProps) {
  const resolved = resolveToothShape(toothNumber);
  if (!resolved) {
    return null;
  }

  const shape = TOOTH_SHAPES[resolved.key];
  if (!shape) {
    return null;
  }

  const reversed = !isUpperArch(toothNumber);
  const selectedFaceSet = new Set(selectedFaces);
  const listedFaceSet = new Set(listedFaces);
  const hasTreatmentStatus = treatmentStatus === 'open' || treatmentStatus === 'finalized';
  const interactionDisabled = disabled || isLoading;

  return (
    <div
      className={cn(
        'tooth',
        reversed && 'tooth--reversed',
        resolved.mirror && 'tooth--mirror',
        isLoading && 'is-loading',
      )}
      data-tooth={toothNumber}
      data-treatment-status={treatmentStatus ?? undefined}
      data-has-annotation={hasAnnotation ? 'true' : undefined}
      data-loading={isLoading ? 'true' : undefined}
    >
      <span
        className={cn(
          'tooth__label',
          !hasTreatmentStatus && selected && 'is-highlighted',
          hasAnnotation && 'has-annotation',
        )}
      >
        <span className="tooth__label-number">{toothNumber}</span>
        {hasAnnotation ? (
          <span className="tooth__annotation-mark" aria-hidden>
            !
          </span>
        ) : null}
      </span>

      <div className="tooth__crown-wrap">
        <svg
          viewBox={shape.vb}
          /* YMax = coroa perto da face (baixo); YMin = coroa perto da face (cima). */
          preserveAspectRatio={reversed ? 'xMidYMin meet' : 'xMidYMax meet'}
          className={cn(
            'tooth__crown',
            !hasTreatmentStatus && selected && 'is-highlighted',
            !hasTreatmentStatus && !selected && listed && 'is-listed',
            treatmentStatus === 'open' && 'is-status-open',
            treatmentStatus === 'finalized' && 'is-status-finalized',
          )}
          role="button"
          tabIndex={interactionDisabled ? -1 : 0}
          aria-label={
            isLoading
              ? `Dente ${toothNumber}, carregando anotações`
              : hasAnnotation
                ? `Dente ${toothNumber}, com anotações`
                : `Dente ${toothNumber}`
          }
          aria-busy={isLoading || undefined}
          aria-pressed={selected}
          onClick={() => {
            if (!interactionDisabled) {
              onToothClick(toothNumber);
            }
          }}
          onKeyDown={(event) => {
            if (interactionDisabled) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onToothClick(toothNumber);
            }
          }}
        >
          {shape.paths.map((d) => (
            <path key={d.slice(0, 24)} d={d} />
          ))}
        </svg>

        {isLoading ? (
          <span className="tooth__crown-loading" aria-hidden>
            <Loader2 className="tooth__crown-spinner animate-spin" />
          </span>
        ) : null}
      </div>

      <svg viewBox={FACE_SHAPE.vb} className="tooth__face" aria-hidden={!facesInteractive}>
        {FACE_ORDER.map((letter) => {
          const isSelectedFace = selectedFaceSet.has(letter);
          const isListedFace = listedFaceSet.has(letter);
          return (
            <path
              key={letter}
              d={FACE_SHAPE.paths[letter]}
              data-face={letter}
              className={cn(
                isSelectedFace && 'is-highlighted',
                !isSelectedFace && isListedFace && 'is-listed',
                !isSelectedFace && !isListedFace && !facesInteractive && 'is-idle',
              )}
              onClick={(event) => {
                event.stopPropagation();
                if (interactionDisabled || !facesInteractive) return;
                onFaceClick(toothNumber, letter);
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
