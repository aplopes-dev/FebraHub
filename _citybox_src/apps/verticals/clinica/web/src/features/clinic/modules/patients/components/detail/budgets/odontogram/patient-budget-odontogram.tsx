'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@citybox/ui';
import {
  FACE_ORDER,
  FACE_UI_LABEL,
  normalizeHofRegionIds,
  type FaceLetter,
  type OdontogramTab,
} from './odontogram-data';
import { OdontogramArch } from './odontogram-arch';
import { OdontogramHof } from './odontogram-hof';
import {
  ODONTOGRAM_REGION_LABELS,
  toggleRegionLabel,
  toggleSingleToothNumber,
  type OdontogramRegionLabel,
} from '../../../../lib/odontogram-regions';
import { formatToothLocationLabel } from '../../../../lib/tooth-location-label';
import './odontogram.css';

export { formatToothLocationLabel };

export type PatientBudgetOdontogramProps = {
  value: number[];
  onChange: (toothNumbers: number[]) => void;
  regionLabels?: string[];
  onRegionLabelsChange?: (regionLabels: string[]) => void;
  hofRegionIds?: string[];
  onHofChange?: (ids: string[]) => void;
  hofAnnotations?: unknown | null;
  onHofAnnotationsChange?: (annotations: unknown | null) => void;
  toothFaces?: Record<number, FaceLetter[]>;
  onToothFacesChange?: (faces: Record<number, FaceLetter[]>) => void;
  listedToothNumbers?: number[];
  listedHofRegionIds?: string[];
  /** Dentes com tratamento em aberto (amarelo). */
  openToothNumbers?: number[];
  /** Dentes com tratamento finalizado (verde). */
  finalizedToothNumbers?: number[];
  /** Dentes com anotação clínica ("!" ao lado do número). */
  annotatedToothNumbers?: number[];
  /** Dente com spinner na coroa enquanto carrega anotações. */
  loadingToothNumber?: number | null;
  /** Quando false, oculta a aba HOF (Permanentes/Decíduos apenas). Default true. */
  showHof?: boolean;
  /** Conteúdo abaixo dos badges Maxila/Mandíbula… (somente vista dental). */
  dentalFooter?: ReactNode;
  /**
   * Se definido, o clique no dente abre/aciona este callback em vez de
   * alternar a seleção (comportamento da aba Prontuário).
   */
  onToothOpen?: (toothNumber: number) => void;
  /** Faces clicáveis. Default true. */
  facesInteractive?: boolean;
  disabled?: boolean;
  /** Aba controlada (opcional). Sem `tab`, usa estado interno. */
  tab?: OdontogramTab;
  onTabChange?: (tab: OdontogramTab) => void;
};

const TAB_LABELS: Record<OdontogramTab, string> = {
  perm: 'PERMANENTES',
  decid: 'DECÍDUOS',
  hof: 'HOF',
};

function toggleFaceInMap(
  current: Readonly<Record<number, FaceLetter[]>>,
  toothNumber: number,
  face: FaceLetter,
): Record<number, FaceLetter[]> {
  const existing = current[toothNumber] ?? [];
  const nextFaces = existing.includes(face)
    ? existing.filter((item) => item !== face)
    : FACE_ORDER.filter((letter) => letter === face || existing.includes(letter));

  if (nextFaces.length === 0) {
    const { [toothNumber]: _removed, ...rest } = current;
    return rest;
  }

  return { ...current, [toothNumber]: nextFaces };
}

export function PatientBudgetOdontogram({
  value,
  onChange,
  regionLabels = [],
  onRegionLabelsChange,
  hofRegionIds = [],
  onHofChange,
  hofAnnotations = null,
  onHofAnnotationsChange,
  toothFaces = {},
  onToothFacesChange,
  listedToothNumbers = [],
  listedHofRegionIds = [],
  openToothNumbers = [],
  finalizedToothNumbers = [],
  annotatedToothNumbers = [],
  loadingToothNumber = null,
  showHof = true,
  dentalFooter = null,
  onToothOpen,
  facesInteractive = true,
  disabled = false,
  tab: controlledTab,
  onTabChange,
}: PatientBudgetOdontogramProps) {
  const [uncontrolledTab, setUncontrolledTab] = useState<OdontogramTab>('perm');
  const tab = controlledTab ?? uncontrolledTab;
  const setTab = (next: OdontogramTab) => {
    onTabChange?.(next);
    if (controlledTab === undefined) {
      setUncontrolledTab(next);
    }
  };
  const [hofGender, setHofGender] = useState<'woman' | 'man'>('woman');
  const [activeToothForFaces, setActiveToothForFaces] = useState<number | null>(null);

  const tabs = showHof
    ? (['perm', 'decid', 'hof'] as const)
    : (['perm', 'decid'] as const);

  const handleToothClick = (toothNumber: number) => {
    if (onToothOpen) {
      onToothOpen(toothNumber);
      return;
    }

    const next = toggleSingleToothNumber(value, toothNumber);
    onChange(next);

    if (next.includes(toothNumber)) {
      setActiveToothForFaces(toothNumber);
    } else {
      if (activeToothForFaces === toothNumber) {
        setActiveToothForFaces(null);
      }
      if (toothFaces[toothNumber]?.length && onToothFacesChange) {
        const { [toothNumber]: _removed, ...rest } = toothFaces;
        onToothFacesChange(rest);
      }
    }
  };

  const handleFaceClick = (toothNumber: number, face: FaceLetter) => {
    if (!value.includes(toothNumber)) {
      onChange(toggleSingleToothNumber(value, toothNumber));
    }
    setActiveToothForFaces(toothNumber);
    onToothFacesChange?.(toggleFaceInMap(toothFaces, toothNumber, face));
  };

  const handleRegionClick = (label: OdontogramRegionLabel) => {
    onRegionLabelsChange?.(toggleRegionLabel(regionLabels, label));
  };

  const handleHofToggle = (regionId: string) => {
    if (!onHofChange) return;
    const normalizedId = normalizeHofRegionIds([regionId])[0] ?? regionId;
    const current = normalizeHofRegionIds(hofRegionIds);
    if (current.includes(normalizedId)) {
      onHofChange(current.filter((id) => id !== normalizedId));
    } else {
      onHofChange([...current, normalizedId]);
    }
  };

  const showFacesPanel = activeToothForFaces != null && value.includes(activeToothForFaces);
  const activeFaces = activeToothForFaces != null ? (toothFaces[activeToothForFaces] ?? []) : [];
  const selectedRegionSet = new Set(regionLabels);
  const isHofTab = showHof && tab === 'hof';

  return (
    <div className="patient-budget-odontogram">
      <div className="odonto-frame">
        <nav className="odonto-tabs" aria-label="Tipo de odontograma">
          {tabs.map((tabName) => (
            <button
              key={tabName}
              type="button"
              className={cn('odonto-tab', tab === tabName && 'is-active')}
              disabled={disabled}
              onClick={() => setTab(tabName)}
            >
              {TAB_LABELS[tabName]}
            </button>
          ))}
        </nav>

        <section className="odonto-panel">
          {isHofTab ? (
            <OdontogramHof
              gender={hofGender}
              selectedRegionIds={hofRegionIds}
              listedRegionIds={listedHofRegionIds}
              hofAnnotations={hofAnnotations}
              onHofAnnotationsChange={onHofAnnotationsChange}
              disabled={disabled}
              onGenderChange={setHofGender}
              onRegionToggle={handleHofToggle}
            />
          ) : (
            <div className="dental-view">
              <OdontogramArch
                tab={tab === 'hof' ? 'perm' : tab}
                selectedTeeth={value}
                listedTeeth={listedToothNumbers}
                openToothNumbers={openToothNumbers}
                finalizedToothNumbers={finalizedToothNumbers}
                annotatedToothNumbers={annotatedToothNumbers}
                loadingToothNumber={loadingToothNumber}
                toothFaces={toothFaces}
                facesInteractive={facesInteractive && !onToothOpen}
                disabled={disabled}
                onToothClick={handleToothClick}
                onFaceClick={handleFaceClick}
              />

              {showFacesPanel && facesInteractive && !onToothOpen ? (
                <div className="faces-panel">
                  <span className="faces-panel__label">Face - Dente {activeToothForFaces}</span>
                  <div className="faces-panel__options">
                    {FACE_ORDER.map((letter) => (
                      <label key={letter} className="face-check">
                        <input
                          type="checkbox"
                          checked={activeFaces.includes(letter)}
                          disabled={disabled}
                          onChange={() => {
                            if (activeToothForFaces != null) {
                              handleFaceClick(activeToothForFaces, letter);
                            }
                          }}
                        />
                        {FACE_UI_LABEL[letter]}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="region-buttons">
                {ODONTOGRAM_REGION_LABELS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={cn(selectedRegionSet.has(label) && 'is-active')}
                    disabled={disabled}
                    onClick={() => handleRegionClick(label)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {dentalFooter}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
