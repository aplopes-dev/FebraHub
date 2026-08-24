import { describe, expect, it } from 'vitest';
import { dedupeSpecialtiesByName } from './use-commission-plan-specialties';
import type { PlanSpecialtyItem } from '../../plans/types/clinic-plan-specialty';

function specialty(
  overrides: Partial<PlanSpecialtyItem> & Pick<PlanSpecialtyItem, 'id' | 'name'>,
): PlanSpecialtyItem {
  return {
    treatments: [],
    ...overrides,
  };
}

describe('dedupeSpecialtiesByName', () => {
  it('mantém uma especialidade por nome (case-insensitive)', () => {
    const result = dedupeSpecialtiesByName([
      specialty({ id: 'a', name: 'Ortodontia' }),
      specialty({ id: 'b', name: 'ortodontia' }),
      specialty({ id: 'c', name: 'Clínica Geral' }),
    ]);
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id)).toEqual(['c', 'a']);
  });

  it('ordena por nome pt-BR', () => {
    const result = dedupeSpecialtiesByName([
      specialty({ id: '2', name: 'Zebra' }),
      specialty({ id: '1', name: 'Álgebra' }),
    ]);
    expect(result.map((s) => s.name)).toEqual(['Álgebra', 'Zebra']);
  });
});
