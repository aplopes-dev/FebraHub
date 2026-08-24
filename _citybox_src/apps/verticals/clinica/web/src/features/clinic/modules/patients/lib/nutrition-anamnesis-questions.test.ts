import { describe, expect, it } from 'vitest';
import {
  NUTRITION_ANAMNESIS_QUESTIONS,
  createEmptyNutritionAnamnesis,
  parseNutritionAnamnesis,
} from './nutrition-anamnesis-questions';

describe('parseNutritionAnamnesis', () => {
  it('returns an empty anamnesis when the section is missing or not an object', () => {
    const empty = createEmptyNutritionAnamnesis();

    expect(parseNutritionAnamnesis(undefined)).toEqual(empty);
    expect(parseNutritionAnamnesis(null)).toEqual(empty);
    expect(parseNutritionAnamnesis('texto')).toEqual(empty);
  });

  it('reads the text fields and keeps answers listed in the catalog', () => {
    const parsed = parseNutritionAnamnesis({
      chiefComplaint: '<p>Ganho de peso</p>',
      previousTreatments: '<p>Dieta em 2024</p>',
      notes: 'Retorno em 30 dias',
      answers: {
        gestante: { value: 'nao' },
        tabagista: { value: 'outro', otherText: 'Parou há 2 anos' },
        'patologias-cutaneas': { value: 'rosacea' },
      },
    });

    expect(parsed).toEqual({
      chiefComplaint: '<p>Ganho de peso</p>',
      previousTreatments: '<p>Dieta em 2024</p>',
      notes: 'Retorno em 30 dias',
      answers: {
        gestante: { value: 'nao' },
        tabagista: { value: 'outro', otherText: 'Parou há 2 anos' },
        'patologias-cutaneas': { value: 'rosacea' },
      },
    });
  });

  it('drops unknown questions and options outside the catalog', () => {
    const parsed = parseNutritionAnamnesis({
      answers: {
        gestante: { value: 'talvez' },
        'pergunta-inexistente': { value: 'sim' },
        diabetes: { value: 'sim' },
      },
    });

    expect(parsed.answers).toEqual({ diabetes: { value: 'sim' } });
  });

  it('omits an empty otherText so the answer stays minimal', () => {
    const parsed = parseNutritionAnamnesis({
      answers: { cirurgia: { value: 'sim', otherText: '' } },
    });

    expect(parsed.answers.cirurgia).toEqual({ value: 'sim' });
  });
});

describe('NUTRITION_ANAMNESIS_QUESTIONS', () => {
  it('keeps question ids unique — they are persisted in the initiation JSON', () => {
    const ids = NUTRITION_ANAMNESIS_QUESTIONS.map((question) => question.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps option values unique inside each question', () => {
    for (const question of NUTRITION_ANAMNESIS_QUESTIONS) {
      const values = question.options.map((option) => option.value);
      expect(new Set(values).size).toBe(values.length);
    }
  });
});
