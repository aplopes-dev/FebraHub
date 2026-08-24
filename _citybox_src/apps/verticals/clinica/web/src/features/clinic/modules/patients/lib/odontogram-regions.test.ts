import { describe, expect, it } from 'vitest';
import {
  isUpperArch,
  normalizeHofRegionIds,
  resolveHofRegionIdAlias,
  resolveToothShape,
} from '../components/detail/budgets/odontogram/odontogram-data';
import {
  isRegionFullySelected,
  odontogramRegionTeeth,
  resolveOdontogramSelectionTeeth,
  toggleRegionLabel,
  toggleSingleToothNumber,
  toggleToothNumbersInSet,
} from './odontogram-regions';
import { formatPatientBudgetTreatmentLocation, parsePatientBudgetToothRegionSelectValue } from './patient-budget-tooth-numbers';

describe('resolveToothShape', () => {
  it('maps permanent quadrants and mirrors left side', () => {
    expect(resolveToothShape(11)).toEqual({ key: 11, mirror: false });
    expect(resolveToothShape(21)).toEqual({ key: 11, mirror: true });
    expect(resolveToothShape(36)).toEqual({ key: 46, mirror: true });
    expect(resolveToothShape(46)).toEqual({ key: 46, mirror: false });
  });

  it('maps deciduous teeth to permanent crown shapes', () => {
    expect(resolveToothShape(51)).toEqual({ key: 11, mirror: false });
    expect(resolveToothShape(65)).toEqual({ key: 17, mirror: true });
    expect(resolveToothShape(85)).toEqual({ key: 47, mirror: false });
  });

  it('detects upper arch', () => {
    expect(isUpperArch(11)).toBe(true);
    expect(isUpperArch(51)).toBe(true);
    expect(isUpperArch(41)).toBe(false);
    expect(isUpperArch(81)).toBe(false);
  });
});

describe('odontogramRegionTeeth', () => {
  it('expands Maxila and Arcadas for permanent dentition', () => {
    expect(odontogramRegionTeeth('Maxila', 'perm')).toEqual([
      18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
    ]);
    expect(odontogramRegionTeeth('Arcadas', 'perm')).toHaveLength(32);
    expect(odontogramRegionTeeth('Face', 'perm')).toEqual([]);
  });

  it('toggles tooth sets immutably', () => {
    expect(toggleSingleToothNumber([11, 21], 16)).toEqual([11, 16, 21]);
    expect(toggleSingleToothNumber([11, 16], 11)).toEqual([16]);

    const maxila = odontogramRegionTeeth('Maxila', 'perm');
    const selected = toggleToothNumbersInSet([], maxila);
    expect(selected).toHaveLength(16);
    expect(isRegionFullySelected('Maxila', 'perm', selected)).toBe(true);
    expect(toggleToothNumbersInSet(selected, maxila)).toEqual([]);
  });

  it('resolves region selection across permanent and deciduous teeth', () => {
    const maxila = resolveOdontogramSelectionTeeth([], ['Maxila']);
    expect(maxila).toHaveLength(26);
    expect(maxila).toEqual(
      [
        ...odontogramRegionTeeth('Maxila', 'perm'),
        ...odontogramRegionTeeth('Maxila', 'decid'),
      ].sort((a, b) => a - b),
    );
    expect(resolveOdontogramSelectionTeeth([11], ['Face'])).toEqual([11]);
  });

  it('toggles region labels without expanding teeth', () => {
    expect(toggleRegionLabel([], 'Maxila')).toEqual(['Maxila']);
    expect(toggleRegionLabel(['Maxila'], 'Maxila')).toEqual([]);
    expect(toggleRegionLabel(['Maxila'], 'Face')).toEqual(['Maxila', 'Face']);
  });
});

describe('formatPatientBudgetTreatmentLocation', () => {
  it('prefers body_region label and enriched tooth labels', () => {
    expect(
      formatPatientBudgetTreatmentLocation({
        toothNumber: 0,
        locationType: 'body_region',
        locationLabel: 'body:quadril-direito',
      }),
    ).toBe('Quadril Direito');
    expect(
      formatPatientBudgetTreatmentLocation({
        toothNumber: 15,
        locationType: 'tooth',
        locationLabel: '15 · M,O',
      }),
    ).toBe('15 · M,O');
    expect(
      formatPatientBudgetTreatmentLocation({
        toothNumber: 0,
        locationType: 'session',
      }),
    ).toBe('Sessão');
  });
});

describe('parsePatientBudgetToothRegionSelectValue', () => {
  it('separates teeth, odontogram regions and HOF regions', () => {
    expect(
      parsePatientBudgetToothRegionSelectValue([
        '11',
        'Maxila',
        'Região Frontal',
        'Mento',
      ]),
    ).toEqual({
      toothNumbers: [11],
      regionLabels: ['Maxila'],
      hofRegionIds: ['frontal', 'mento'],
    });
  });

  it('unifies legacy têmpora labels into a single temporal region', () => {
    expect(
      parsePatientBudgetToothRegionSelectValue([
        'Têmpora Direita',
        'Têmpora Esquerda',
        'Têmpora',
      ]),
    ).toEqual({
      toothNumbers: [],
      regionLabels: [],
      hofRegionIds: ['temporal'],
    });
  });
});

describe('normalizeHofRegionIds', () => {
  it('maps temporal-d/e aliases to temporal', () => {
    expect(resolveHofRegionIdAlias('temporal-d')).toBe('temporal');
    expect(resolveHofRegionIdAlias('Têmpora Esquerda')).toBe('temporal');
    expect(normalizeHofRegionIds(['frontal', 'temporal-d', 'temporal-e'])).toEqual([
      'frontal',
      'temporal',
    ]);
  });

  it('maps nasogeniano aliases to nasogeniano', () => {
    expect(resolveHofRegionIdAlias('nasogeniano-d')).toBe('nasogeniano');
    expect(resolveHofRegionIdAlias('Sulco Nasogeniano Esquerdo')).toBe('nasogeniano');
    expect(normalizeHofRegionIds(['nasogeniano-d', 'nasogeniano-e', 'glabela'])).toEqual([
      'nasogeniano',
      'glabela',
    ]);
  });

  it('maps malar-d/e aliases to malar', () => {
    expect(resolveHofRegionIdAlias('malar-e')).toBe('malar');
    expect(resolveHofRegionIdAlias('Região Malar Direita')).toBe('malar');
    expect(normalizeHofRegionIds(['malar-d', 'malar-e'])).toEqual(['malar']);
  });
});
