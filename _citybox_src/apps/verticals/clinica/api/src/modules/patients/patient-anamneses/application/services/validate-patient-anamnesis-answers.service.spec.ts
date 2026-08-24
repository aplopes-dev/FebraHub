
import { ValidatePatientAnamnesisAnswersService } from './validate-patient-anamnesis-answers.service';
import type { ResolvedQuestion } from '../utils/resolve-template-questions';

describe('ValidatePatientAnamnesisAnswersService', () => {
  const service = new ValidatePatientAnamnesisAnswersService();

  it('accepts rich_text answers with HTML content', () => {
    const questions: ResolvedQuestion[] = [
      { id: 'q-rich', text: 'Tratamentos anteriores', type: 'rich_text' },
    ];

    const answers = service.validateProfessionalCreate(
      'test',
      '<p>Queixa</p>',
      [{ questionId: 'q-rich', text: '<p>Dieta prévia</p>' }],
      questions,
    );

    expect(answers).toEqual([
      { questionId: 'consultation-reason', text: '<p>Queixa</p>' },
      { questionId: 'q-rich', text: '<p>Dieta prévia</p>' },
    ]);
  });

  it('rejects empty rich_text HTML', () => {
    expect(() =>
      service.validateProfessionalCreate(
        'test',
        '<p>Queixa</p>',
        [{ questionId: 'q-rich', text: '<p></p>' }],
        [{ id: 'q-rich', text: 'Tratamentos anteriores', type: 'rich_text' }],
      ),
    ).toThrow(expect.objectContaining({ externalMessage: 'Preencha todas as perguntas obrigatórias' }));
  });

  it('requires auxiliary text when single_choice allows other', () => {
    const questions: ResolvedQuestion[] = [
      {
        id: 'q-choice',
        text: 'Gestante?',
        type: 'single_choice',
        options: [
          { value: 'sim', label: 'Sim' },
          { value: 'nao', label: 'Não' },
          { value: 'outro', label: 'Outro', allowsOther: true },
        ],
      },
    ];

    expect(() =>
      service.validateProfessionalCreate(
        'test',
        '<p>Queixa</p>',
        [{ questionId: 'q-choice', choiceValue: 'outro' }],
        questions,
      ),
    ).toThrow(expect.objectContaining({ externalMessage: 'Descreva a resposta' }));

    const answers = service.validateProfessionalCreate(
      'test',
      '<p>Queixa</p>',
      [
        {
          questionId: 'q-choice',
          choiceValue: 'outro',
          auxiliaryText: 'Há 8 semanas',
        },
      ],
      questions,
    );

    expect(answers[1]).toMatchObject({
      questionId: 'q-choice',
      choiceValue: 'outro',
      auxiliaryText: 'Há 8 semanas',
    });
  });
});
