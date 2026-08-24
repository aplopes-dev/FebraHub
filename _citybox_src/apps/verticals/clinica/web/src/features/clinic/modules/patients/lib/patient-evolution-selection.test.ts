import { describe, expect, it } from 'vitest';
import {
  filterEvolutionsByIds,
  isAllEvolutionsSelected,
  isSomeEvolutionsSelected,
  selectAllEvolutionIds,
  toggleEvolutionSelection,
} from './patient-evolution-selection';

describe('patient-evolution-selection', () => {
  const allIds = ['e-1', 'e-2', 'e-3'];

  it('selects all evolution ids', () => {
    expect(selectAllEvolutionIds(allIds)).toEqual(allIds);
  });

  it('toggles a single evolution selection', () => {
    expect(toggleEvolutionSelection(['e-1'], 'e-2')).toEqual(['e-1', 'e-2']);
    expect(toggleEvolutionSelection(['e-1', 'e-2'], 'e-1')).toEqual(['e-2']);
  });

  it('detects all and partial selection states', () => {
    expect(isAllEvolutionsSelected(allIds, allIds)).toBe(true);
    expect(isAllEvolutionsSelected(allIds, ['e-1'])).toBe(false);
    expect(isSomeEvolutionsSelected(allIds, ['e-1'])).toBe(true);
    expect(isSomeEvolutionsSelected(allIds, [])).toBe(false);
  });

  it('filters evolutions by selected ids', () => {
    const evolutions = [
      { id: 'e-1', label: 'A' },
      { id: 'e-2', label: 'B' },
      { id: 'e-3', label: 'C' },
    ];

    expect(filterEvolutionsByIds(evolutions, ['e-2', 'e-3'])).toEqual([
      { id: 'e-2', label: 'B' },
      { id: 'e-3', label: 'C' },
    ]);
  });
});
