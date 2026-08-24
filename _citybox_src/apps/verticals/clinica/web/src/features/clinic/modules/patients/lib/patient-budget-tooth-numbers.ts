import type { MultiSelectOption } from '@citybox/ui/molecules';
import { formatBodyRegionDisplayLabel } from '@/lib/body-region-location';
import {
  HOF_REGIONS,
  normalizeHofRegionIds,
  resolveHofRegionIdAlias,
} from '../components/detail/budgets/odontogram/odontogram-data';
import { ODONTOGRAM_REGION_LABELS } from './odontogram-regions';

/** Numeração FDI permanente exibida no odontograma do orçamento. */
export const PATIENT_BUDGET_UPPER_RIGHT_TEETH = [18, 17, 16, 15, 14, 13, 12, 11] as const;
export const PATIENT_BUDGET_UPPER_LEFT_TEETH = [21, 22, 23, 24, 25, 26, 27, 28] as const;
export const PATIENT_BUDGET_LOWER_RIGHT_TEETH = [48, 47, 46, 45, 44, 43, 42, 41] as const;
export const PATIENT_BUDGET_LOWER_LEFT_TEETH = [31, 32, 33, 34, 35, 36, 37, 38] as const;

export const PATIENT_BUDGET_DECIDUOUS_UPPER_RIGHT_TEETH = [55, 54, 53, 52, 51] as const;
export const PATIENT_BUDGET_DECIDUOUS_UPPER_LEFT_TEETH = [61, 62, 63, 64, 65] as const;
export const PATIENT_BUDGET_DECIDUOUS_LOWER_RIGHT_TEETH = [85, 84, 83, 82, 81] as const;
export const PATIENT_BUDGET_DECIDUOUS_LOWER_LEFT_TEETH = [71, 72, 73, 74, 75] as const;

export const PATIENT_BUDGET_ALL_TEETH = [
  ...PATIENT_BUDGET_UPPER_RIGHT_TEETH,
  ...PATIENT_BUDGET_UPPER_LEFT_TEETH,
  ...PATIENT_BUDGET_LOWER_RIGHT_TEETH,
  ...PATIENT_BUDGET_LOWER_LEFT_TEETH,
] as const;

export const PATIENT_BUDGET_ALL_SELECTABLE_TEETH = [
  ...PATIENT_BUDGET_ALL_TEETH,
  ...PATIENT_BUDGET_DECIDUOUS_UPPER_RIGHT_TEETH,
  ...PATIENT_BUDGET_DECIDUOUS_UPPER_LEFT_TEETH,
  ...PATIENT_BUDGET_DECIDUOUS_LOWER_LEFT_TEETH,
  ...PATIENT_BUDGET_DECIDUOUS_LOWER_RIGHT_TEETH,
] as const;

const REGION_SELECT_LABELS: Record<(typeof ODONTOGRAM_REGION_LABELS)[number], string> = {
  Maxila: 'Maxila',
  Mandíbula: 'Mandíbula',
  Face: 'Face',
  'Arcada superior': 'Arcada Superior',
  'Arcada inferior': 'Arcada Inferior',
  Arcadas: 'Arcadas',
};

export const PATIENT_BUDGET_TOOTH_REGION_SELECT_OPTIONS: MultiSelectOption[] = [
  ...PATIENT_BUDGET_ALL_SELECTABLE_TEETH.map((tooth) => ({
    value: String(tooth),
    label: String(tooth),
  })),
  ...ODONTOGRAM_REGION_LABELS.map((region) => ({
    value: region,
    label: REGION_SELECT_LABELS[region],
  })),
  ...HOF_REGIONS.map((region) => ({
    value: region.label,
    label: region.label,
  })),
];

export function hofRegionIdsToSelectLabels(hofRegionIds: readonly string[]): string[] {
  return normalizeHofRegionIds(hofRegionIds).map(
    (regionId) => HOF_REGIONS.find((region) => region.id === regionId)?.label ?? regionId,
  );
}

export function resolveHofRegionIdFromSelectValue(value: string): string | null {
  const alias = resolveHofRegionIdAlias(value);
  if (alias) return alias;
  const byLabel = HOF_REGIONS.find((region) => region.label === value);
  if (byLabel) return byLabel.id;
  const byId = HOF_REGIONS.find((region) => region.id === value);
  return byId?.id ?? null;
}
export function formatPatientBudgetToothLabel(toothNumber: number): string {
  return String(toothNumber);
}

export function formatPatientBudgetTreatmentLocation(item: {
  toothNumber: number;
  locationType?: 'tooth' | 'body_region' | 'session' | 'none';
  locationLabel?: string;
}): string {
  if (item.locationType === 'session') {
    return 'Sessão';
  }

  if (item.locationType === 'none') {
    return '—';
  }

  if (item.locationType === 'body_region' || item.toothNumber === 0) {
    return formatBodyRegionDisplayLabel(item.locationLabel);
  }

  if (item.locationLabel?.trim()) {
    return item.locationLabel.trim();
  }

  return formatPatientBudgetToothLabel(item.toothNumber);
}

export function togglePatientBudgetToothNumber(
  current: number[],
  toothNumber: number,
): number[] {
  if (current.includes(toothNumber)) {
    return current.filter((item) => item !== toothNumber);
  }

  return [...current, toothNumber].sort((left, right) => left - right);
}

export function removePatientBudgetToothNumber(
  current: number[],
  toothNumber: number,
): number[] {
  return current.filter((item) => item !== toothNumber);
}

export function formatPatientBudgetToothSelectionLabel(toothNumbers: number[]): string {
  if (toothNumbers.length === 0) {
    return 'Selecionar Dente/Região';
  }

  if (toothNumbers.length === 1) {
    return `Dente ${formatPatientBudgetToothLabel(toothNumbers[0]!)}`;
  }

  return `${toothNumbers.length} dentes selecionados`;
}

export function parsePatientBudgetToothRegionSelectValue(values: string[]): {
  toothNumbers: number[];
  regionLabels: string[];
  hofRegionIds: string[];
} {
  const toothNumbers: number[] = [];
  const regionLabels: string[] = [];
  const hofRegionIds: string[] = [];

  for (const value of values) {
    if (/^\d+$/.test(value)) {
      toothNumbers.push(Number(value));
      continue;
    }

    const hofRegionId = resolveHofRegionIdFromSelectValue(value);
    if (hofRegionId) {
      hofRegionIds.push(hofRegionId);
      continue;
    }

    regionLabels.push(value);
  }

  return {
    toothNumbers: [...new Set(toothNumbers)].sort((a, b) => a - b),
    regionLabels: [...new Set(regionLabels)],
    hofRegionIds: normalizeHofRegionIds(hofRegionIds),
  };
}
