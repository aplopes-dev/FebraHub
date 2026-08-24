import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CLINIC_PLAN_SPECIALTY_NAMES,
  DEFAULT_FISIOTERAPIA_PLAN_SPECIALTY_NAMES,
} from './default-clinic-specialty-names';
import { createEmptySystemSpecialties } from './plan-specialty-factories';

describe('createEmptySystemSpecialties', () => {
  it('cria todas as especialidades odonto do catálogo sem tratamentos', () => {
    const specialties = createEmptySystemSpecialties();

    expect(specialties).toHaveLength(DEFAULT_CLINIC_PLAN_SPECIALTY_NAMES.length);
    expect(specialties.map((s) => s.name)).toEqual([
      ...DEFAULT_CLINIC_PLAN_SPECIALTY_NAMES,
    ]);
    expect(specialties.every((s) => s.treatments.length === 0)).toBe(true);
    expect(specialties[0]?.name).toBe('Cirurgia');
    expect(specialties.find((s) => s.name === 'Harmonização Facial')?.locationUiType).toBe(
      'face_region',
    );
    expect(new Set(specialties.map((s) => s.id)).size).toBe(specialties.length);
  });

  it('cria especialidades de fisioterapia quando a vertente é fisio', () => {
    const specialties = createEmptySystemSpecialties('fisioterapia');

    expect(specialties).toHaveLength(DEFAULT_FISIOTERAPIA_PLAN_SPECIALTY_NAMES.length);
    expect(specialties[0]?.name).toBe('Avaliação e Consultas');
  });
});
