import { mergeTemplateWithLibrary } from './merge-template-with-library';
import { GLOBAL_QUESTION_1, GLOBAL_QUESTION_4 } from '../../tests/fixtures';

describe('mergeTemplateWithLibrary', () => {
  const library = [GLOBAL_QUESTION_1, GLOBAL_QUESTION_4];

  it('should include every library question with active false when payload is empty', () => {
    const merged = mergeTemplateWithLibrary(library, []);

    expect(merged).toHaveLength(2);
    expect(merged).toEqual([
      { questionId: GLOBAL_QUESTION_1.id, active: false },
      { questionId: GLOBAL_QUESTION_4.id, active: false },
    ]);
  });

  it('should preserve active flags from payload and default missing questions to inactive', () => {
    const merged = mergeTemplateWithLibrary(library, [
      { questionId: GLOBAL_QUESTION_1.id, active: true },
    ]);

    expect(merged).toHaveLength(2);
    expect(merged[0]).toEqual({
      questionId: GLOBAL_QUESTION_1.id,
      active: true,
    });
    expect(merged[1]).toEqual({
      questionId: GLOBAL_QUESTION_4.id,
      active: false,
    });
  });

  it('should append pending library questions not yet persisted', () => {
    const pending = [{ id: 'new-question-id' }];
    const merged = mergeTemplateWithLibrary(library, [], pending);

    expect(merged).toHaveLength(3);
    expect(merged[2]).toEqual({ questionId: 'new-question-id', active: false });
  });
});
