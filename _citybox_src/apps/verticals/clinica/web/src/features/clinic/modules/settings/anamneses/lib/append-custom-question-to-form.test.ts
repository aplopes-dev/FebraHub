import { describe, expect, it } from 'vitest';
import {
  appendCustomQuestionToForm,
  insertActiveQuestionRef,
} from './append-custom-question-to-form';
import { mergeTemplateQuestionsWithLibrary } from './merge-template-questions-with-library';
import type { ClinicAnamnesisQuestion } from '../types/clinic-anamnesis';

function question(
  id: string,
  overrides: Partial<ClinicAnamnesisQuestion> = {},
): ClinicAnamnesisQuestion {
  return {
    id,
    text: `Pergunta ${id}`,
    type: 'text',
    scope: 'clinic',
    ...overrides,
  };
}

describe('insertActiveQuestionRef', () => {
  it('coloca a nova pergunta no topo quando não há ativas', () => {
    const refs = [
      { questionId: 'lib-1', active: false },
      { questionId: 'lib-2', active: false },
      { questionId: 'lib-3', active: false },
    ];

    expect(insertActiveQuestionRef(refs, 'custom-a')).toEqual([
      { questionId: 'custom-a', active: true },
      { questionId: 'lib-1', active: false },
      { questionId: 'lib-2', active: false },
      { questionId: 'lib-3', active: false },
    ]);
  });

  it('insere após a última ativa, não no fim da lista', () => {
    const refs = [
      { questionId: 'lib-1', active: true },
      { questionId: 'lib-2', active: false },
      { questionId: 'lib-3', active: true },
      { questionId: 'lib-4', active: false },
      { questionId: 'lib-5', active: false },
    ];

    expect(insertActiveQuestionRef(refs, 'custom-b')).toEqual([
      { questionId: 'lib-1', active: true },
      { questionId: 'lib-2', active: false },
      { questionId: 'lib-3', active: true },
      { questionId: 'custom-b', active: true },
      { questionId: 'lib-4', active: false },
      { questionId: 'lib-5', active: false },
    ]);
  });
});

describe('appendCustomQuestionToForm', () => {
  it('preserva pergunta da biblioteca já ativada ao criar nova custom', () => {
    const libraryQuestion = question('lib-q1', { scope: 'global' });
    const customA = question('custom-a');
    const customB = question('custom-b');
    const customC = question('custom-c');

    const current = {
      templateQuestions: [
        { questionId: 'custom-a', active: true },
        { questionId: 'custom-b', active: true },
        { questionId: 'lib-q1', active: true },
      ],
      customQuestions: [customA, customB],
    };

    const next = appendCustomQuestionToForm(current, customC);

    expect(next.templateQuestions).toEqual([
      { questionId: 'custom-a', active: true },
      { questionId: 'custom-b', active: true },
      { questionId: 'lib-q1', active: true },
      { questionId: 'custom-c', active: true },
    ]);
    expect(next.customQuestions).toHaveLength(3);
    expect(next.customQuestions.at(-1)?.id).toBe('custom-c');

    const afterSync = mergeTemplateQuestionsWithLibrary(
      [libraryQuestion],
      next.templateQuestions,
      next.customQuestions,
    );
    expect(afterSync.find((ref) => ref.questionId === 'lib-q1')?.active).toBe(true);
  });

  it('em modelo novo, cria a pergunta no topo e não após todas as desativadas', () => {
    const library = [question('lib-1', { scope: 'global' }), question('lib-2', { scope: 'global' })];
    const current = {
      templateQuestions: mergeTemplateQuestionsWithLibrary(library, []),
      customQuestions: [],
    };
    const newCustom = question('custom-a');

    const next = appendCustomQuestionToForm(current, newCustom);

    expect(next.templateQuestions[0]).toEqual({ questionId: 'custom-a', active: true });
    expect(next.templateQuestions.slice(1).every((ref) => !ref.active)).toBe(true);
  });

  it('regressão: merge com library=[] descartava a pergunta ativada da biblioteca', () => {
    const current = {
      templateQuestions: [
        { questionId: 'custom-a', active: true },
        { questionId: 'lib-q1', active: true },
      ],
      customQuestions: [question('custom-a')],
    };
    const newCustom = question('custom-b');

    const buggy = mergeTemplateQuestionsWithLibrary(
      [],
      current.templateQuestions,
      [...current.customQuestions, newCustom],
    ).map((ref) => (ref.questionId === newCustom.id ? { ...ref, active: true } : ref));

    expect(buggy.some((ref) => ref.questionId === 'lib-q1')).toBe(false);

    const fixed = appendCustomQuestionToForm(current, newCustom);
    expect(fixed.templateQuestions.find((ref) => ref.questionId === 'lib-q1')?.active).toBe(true);
    expect(fixed.templateQuestions.map((ref) => ref.questionId)).toEqual([
      'custom-a',
      'lib-q1',
      'custom-b',
    ]);
  });
});
