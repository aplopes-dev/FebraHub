import { describe, expect, it } from 'vitest';
import {
  parseNutritionInitAnamnesisSection,
  formatNutritionAnamnesisAnswer,
} from './parse-nutrition-init-anamnesis';

describe('parseNutritionInitAnamnesisSection', () => {
  it('reads the dynamic snapshot saved with a template', () => {
    const snapshot = parseNutritionInitAnamnesisSection({
      templateId: 'tpl-1',
      templateName: 'Anamnese de acompanhamento nutricional resumida',
      consultationReason: '<p>Ganho de peso</p>',
      questions: [
        {
          id: 'q-1',
          text: 'Gestante?',
          type: 'single_choice',
          options: [
            { value: 'sim', label: 'Sim' },
            { value: 'nao', label: 'Não' },
            { value: 'outro', label: 'Outro', allowsOther: true },
          ],
        },
      ],
      answers: [{ questionId: 'q-1', choiceValue: 'nao' }],
    });

    expect(snapshot?.templateName).toBe(
      'Anamnese de acompanhamento nutricional resumida',
    );
    expect(snapshot?.consultationReason).toBe('<p>Ganho de peso</p>');
    expect(snapshot?.answers[0]?.choiceValue).toBe('nao');
    expect(
      formatNutritionAnamnesisAnswer(snapshot!.questions[0], snapshot!.answers[0]),
    ).toBe('Não');
  });

  it('falls back to the legacy catalog JSON', () => {
    const snapshot = parseNutritionInitAnamnesisSection({
      chiefComplaint: '<p>Ganho de peso</p>',
      previousTreatments: '<p>Dieta</p>',
      notes: 'Retorno',
      answers: {
        gestante: { value: 'nao' },
        tabagista: { value: 'outro', otherText: 'Parou há 2 anos' },
      },
    });

    expect(snapshot?.templateName).toBe('Anamnese nutricional (legado)');
    expect(snapshot?.consultationReason).toBe('<p>Ganho de peso</p>');
    expect(
      snapshot?.answers.some(
        (answer) => answer.questionId === 'tabagista' && answer.auxiliaryText === 'Parou há 2 anos',
      ),
    ).toBe(true);
  });

  it('returns null for an empty section', () => {
    expect(parseNutritionInitAnamnesisSection({})).toBeNull();
    expect(parseNutritionInitAnamnesisSection(undefined)).toBeNull();
  });
});
