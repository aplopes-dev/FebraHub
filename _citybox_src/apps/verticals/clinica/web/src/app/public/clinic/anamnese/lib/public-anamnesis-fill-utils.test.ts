import { describe, expect, it } from 'vitest';
import {
  computePublicAnamnesisProgress,
  isPublicAnamnesisAnswerComplete,
} from './public-anamnesis-fill-utils';

describe('isPublicAnamnesisAnswerComplete', () => {
  it('requires text for text questions', () => {
    expect(
      isPublicAnamnesisAnswerComplete(
        { id: 'q-1', type: 'text' },
        { questionId: 'q-1', text: 'Dor de dente' },
      ),
    ).toBe(true);

    expect(
      isPublicAnamnesisAnswerComplete({ id: 'q-1', type: 'text' }, { questionId: 'q-1', text: ' ' }),
    ).toBe(false);
  });

  it('requires auxiliary text for yes/no with text follow-up only when answering yes', () => {
    expect(
      isPublicAnamnesisAnswerComplete(
        { id: 'q-2', type: 'yes_no_unknown_text' },
        { questionId: 'q-2', triState: 'yes', auxiliaryText: 'Penicilina' },
      ),
    ).toBe(true);

    expect(
      isPublicAnamnesisAnswerComplete(
        { id: 'q-2', type: 'yes_no_unknown_text' },
        { questionId: 'q-2', triState: 'yes' },
      ),
    ).toBe(false);

    expect(
      isPublicAnamnesisAnswerComplete(
        { id: 'q-2', type: 'yes_no_unknown_text' },
        { questionId: 'q-2', triState: 'no' },
      ),
    ).toBe(true);
  });
});

describe('computePublicAnamnesisProgress', () => {
  it('computes answered count and percent', () => {
    const questions = [
      { id: 'q-1', type: 'text' as const },
      { id: 'q-2', type: 'yes_no_unknown' as const },
    ];

    const progress = computePublicAnamnesisProgress(questions, {
      'q-1': { questionId: 'q-1', text: 'Consulta de rotina' },
    });

    expect(progress).toEqual({ total: 2, answered: 1, percent: 50 });
  });
});
