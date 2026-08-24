import { describe, expect, it } from 'vitest';
import type { ClinicAnamnesisQuestion } from '../../settings/anamneses/types/clinic-anamnesis';
import {
  getClinicNewAnamnesisAnswerForQuestion,
  getEmptyAnswerForQuestion,
} from './patient-anamnesis-form';

function question(
  partial: Pick<ClinicAnamnesisQuestion, 'id' | 'type'> &
    Partial<ClinicAnamnesisQuestion>,
): ClinicAnamnesisQuestion {
  return {
    text: 'Pergunta',
    scope: 'clinic',
    generatesAlert: false,
    ...partial,
  };
}

describe('getClinicNewAnamnesisAnswerForQuestion', () => {
  it('pré-seleciona Não em perguntas Sim/Não/Não sei', () => {
    expect(
      getClinicNewAnamnesisAnswerForQuestion(
        question({ id: 'q-1', type: 'yes_no_unknown' }),
      ),
    ).toEqual({
      questionId: 'q-1',
      triState: 'no',
      lateral: undefined,
      text: undefined,
      auxiliaryText: undefined,
    });
  });

  it('pré-seleciona Não em Sim/Não/Não sei com texto auxiliar', () => {
    expect(
      getClinicNewAnamnesisAnswerForQuestion(
        question({ id: 'q-2', type: 'yes_no_unknown_text' }),
      ),
    ).toEqual({
      questionId: 'q-2',
      triState: 'no',
      lateral: undefined,
      text: undefined,
      auxiliaryText: '',
    });
  });

  it('não pré-seleciona lateral nem texto livre', () => {
    expect(
      getClinicNewAnamnesisAnswerForQuestion(
        question({ id: 'q-3', type: 'left_right_unknown' }),
      ).lateral,
    ).toBeUndefined();

    expect(
      getClinicNewAnamnesisAnswerForQuestion(question({ id: 'q-4', type: 'text' })),
    ).toEqual(getEmptyAnswerForQuestion(question({ id: 'q-4', type: 'text' })));
  });
});
