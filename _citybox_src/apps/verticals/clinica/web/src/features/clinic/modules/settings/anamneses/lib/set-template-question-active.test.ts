import { describe, expect, it } from 'vitest';
import {
  partitionTemplateQuestionsByActive,
  setTemplateQuestionActive,
} from './set-template-question-active';

describe('setTemplateQuestionActive', () => {
  it('ao desativar, mantém a posição e só troca active', () => {
    const refs = [
      { questionId: 'a', active: true },
      { questionId: 'b', active: true },
      { questionId: 'c', active: true },
      { questionId: 'd', active: false },
    ];

    expect(setTemplateQuestionActive(refs, 'b', false)).toEqual([
      { questionId: 'a', active: true },
      { questionId: 'b', active: false },
      { questionId: 'c', active: true },
      { questionId: 'd', active: false },
    ]);
  });

  it('ao ativar, mantém a posição e só troca active', () => {
    const refs = [
      { questionId: 'a', active: true },
      { questionId: 'b', active: false },
      { questionId: 'c', active: false },
      { questionId: 'd', active: false },
    ];

    expect(setTemplateQuestionActive(refs, 'c', true)).toEqual([
      { questionId: 'a', active: true },
      { questionId: 'b', active: false },
      { questionId: 'c', active: true },
      { questionId: 'd', active: false },
    ]);
  });

  it('é imutável em relação aos refs de entrada', () => {
    const refs = [
      { questionId: 'a', active: true },
      { questionId: 'b', active: false },
    ];
    const next = setTemplateQuestionActive(refs, 'a', false);

    expect(next).not.toBe(refs);
    expect(next[0]).not.toBe(refs[0]);
    expect(refs[0]?.active).toBe(true);
  });
});

describe('partitionTemplateQuestionsByActive', () => {
  it('move desativadas para o fim preservando ordem relativa', () => {
    const refs = [
      { questionId: 'a', active: true },
      { questionId: 'b', active: false },
      { questionId: 'c', active: true },
      { questionId: 'd', active: false },
    ];

    expect(partitionTemplateQuestionsByActive(refs)).toEqual([
      { questionId: 'a', active: true },
      { questionId: 'c', active: true },
      { questionId: 'b', active: false },
      { questionId: 'd', active: false },
    ]);
  });

  it('não altera lista já particionada', () => {
    const refs = [
      { questionId: 'a', active: true },
      { questionId: 'c', active: true },
      { questionId: 'b', active: false },
    ];

    expect(partitionTemplateQuestionsByActive(refs)).toEqual(refs);
  });
});
