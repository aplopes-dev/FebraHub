import { describe, expect, it } from 'vitest';
import {
  storeShowsBudgetTreatmentSessions,
  storeShowsNutritionInitializeFlow,
  storeShowsToothMap,
  storeSupportsTreatmentToothFaces,
} from './clinic-strand';

describe('storeSupportsTreatmentToothFaces', () => {
  it('habilita faces de dente só em odontologia', () => {
    expect(storeSupportsTreatmentToothFaces('odontologia')).toBe(true);
    expect(storeSupportsTreatmentToothFaces('fisioterapia')).toBe(false);
    expect(storeSupportsTreatmentToothFaces('nutricao')).toBe(false);
  });

  it('HOF (face) não implica checkbox Aceita faces', () => {
    expect(storeShowsToothMap('odontologia')).toBe(true);
    expect(storeSupportsTreatmentToothFaces('fisioterapia')).toBe(false);
  });
});

describe('storeShowsBudgetTreatmentSessions', () => {
  it('habilita sessões no orçamento só em fisioterapia', () => {
    expect(storeShowsBudgetTreatmentSessions('fisioterapia')).toBe(true);
    expect(storeShowsBudgetTreatmentSessions('odontologia')).toBe(false);
    expect(storeShowsBudgetTreatmentSessions('nutricao')).toBe(false);
    expect(storeShowsBudgetTreatmentSessions(null)).toBe(false);
  });
});

describe('storeShowsNutritionInitializeFlow', () => {
  it('habilita fluxo Inicializar só em nutrição', () => {
    expect(storeShowsNutritionInitializeFlow('nutricao')).toBe(true);
    expect(storeShowsNutritionInitializeFlow('fisioterapia')).toBe(false);
    expect(storeShowsNutritionInitializeFlow('odontologia')).toBe(false);
  });
});
