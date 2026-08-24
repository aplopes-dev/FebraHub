import { ARCH_LAYOUT, type OdontogramTab } from '../components/detail/budgets/odontogram/odontogram-data';

export const ODONTOGRAM_REGION_LABELS = [
  'Maxila',
  'Mandíbula',
  'Face',
  'Arcada superior',
  'Arcada inferior',
  'Arcadas',
] as const;

export type OdontogramRegionLabel = (typeof ODONTOGRAM_REGION_LABELS)[number];

export function odontogramUpperTeeth(tab: Exclude<OdontogramTab, 'hof'>): number[] {
  const layout = ARCH_LAYOUT[tab];
  return [...layout.topLeft, ...layout.topRight];
}

export function odontogramLowerTeeth(tab: Exclude<OdontogramTab, 'hof'>): number[] {
  const layout = ARCH_LAYOUT[tab];
  return [...layout.bottomLeft, ...layout.bottomRight];
}

export function odontogramRegionTeeth(
  label: OdontogramRegionLabel,
  tab: Exclude<OdontogramTab, 'hof'>,
): number[] {
  switch (label) {
    case 'Maxila':
    case 'Arcada superior':
      return odontogramUpperTeeth(tab);
    case 'Mandíbula':
    case 'Arcada inferior':
      return odontogramLowerTeeth(tab);
    case 'Arcadas':
      return [...odontogramUpperTeeth(tab), ...odontogramLowerTeeth(tab)];
    case 'Face':
    default:
      return [];
  }
}

/** Dentes permanentes + decíduos cobertos pela região. */
export function odontogramRegionTeethAllDentitions(label: OdontogramRegionLabel): number[] {
  if (label === 'Face') {
    return [];
  }
  return [
    ...odontogramRegionTeeth(label, 'perm'),
    ...odontogramRegionTeeth(label, 'decid'),
  ];
}

export function resolveOdontogramSelectionTeeth(
  toothNumbers: readonly number[],
  regionLabels: readonly string[],
): number[] {
  const next = new Set(toothNumbers);
  for (const label of regionLabels) {
    if (!isOdontogramRegionLabel(label) || label === 'Face') {
      continue;
    }
    for (const tooth of odontogramRegionTeethAllDentitions(label)) {
      next.add(tooth);
    }
  }
  return [...next].sort((a, b) => a - b);
}

export function isOdontogramRegionLabel(value: string): value is OdontogramRegionLabel {
  return (ODONTOGRAM_REGION_LABELS as readonly string[]).includes(value);
}

/** Toggle a set of tooth numbers immutably (add if not all present, else remove). */
export function toggleToothNumbersInSet(
  current: readonly number[],
  teeth: readonly number[],
): number[] {
  if (teeth.length === 0) {
    return [...current];
  }

  const currentSet = new Set(current);
  const allSelected = teeth.every((n) => currentSet.has(n));

  if (allSelected) {
    const remove = new Set(teeth);
    return current.filter((n) => !remove.has(n));
  }

  const next = new Set(current);
  for (const n of teeth) {
    next.add(n);
  }
  return [...next].sort((a, b) => a - b);
}

export function toggleSingleToothNumber(
  current: readonly number[],
  toothNumber: number,
): number[] {
  if (current.includes(toothNumber)) {
    return current.filter((n) => n !== toothNumber);
  }
  return [...current, toothNumber].sort((a, b) => a - b);
}

export function isRegionFullySelected(
  label: OdontogramRegionLabel,
  tab: Exclude<OdontogramTab, 'hof'>,
  selected: readonly number[],
): boolean {
  const teeth = odontogramRegionTeeth(label, tab);
  if (teeth.length === 0) {
    return false;
  }
  const selectedSet = new Set(selected);
  return teeth.every((n) => selectedSet.has(n));
}

/** Toggle de rótulo de região (não expande para dentes). */
export function toggleRegionLabel(
  current: readonly string[],
  label: OdontogramRegionLabel,
): OdontogramRegionLabel[] {
  const regions = current.filter(isOdontogramRegionLabel);
  if (regions.includes(label)) {
    return regions.filter((item) => item !== label);
  }
  return [...regions, label];
}
