import { ListQuestionsUseCase } from './list-questions.use-case';
import { InMemoryAnamnesisQuestionRepository } from '../../../tests/in-memory-anamnesis-question.repository';
import {
  GLOBAL_QUESTION_1,
  GLOBAL_QUESTION_4,
  STORE_ID,
} from '../../../tests/fixtures';

describe('ListQuestionsUseCase', () => {
  let useCase: ListQuestionsUseCase;
  let questionRepo: InMemoryAnamnesisQuestionRepository;

  beforeEach(() => {
    questionRepo = new InMemoryAnamnesisQuestionRepository();
    questionRepo.seed([
      GLOBAL_QUESTION_1,
      GLOBAL_QUESTION_4,
      {
        id: 'clinic-lib-1',
        storeId: STORE_ID,
        templateId: null,
        text: 'Pergunta da clínica',
        type: 'text',
        scope: 'clinic',
        generatesAlert: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'template-only-1',
        storeId: STORE_ID,
        templateId: 'template-1',
        text: 'Não deve aparecer na biblioteca',
        type: 'text',
        scope: 'clinic',
        generatesAlert: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    useCase = new ListQuestionsUseCase(questionRepo);
  });

  it('should return global and store library questions', async () => {
    const questions = await useCase.execute({ storeId: STORE_ID });

    expect(questions).toHaveLength(3);
    expect(
      questions.some((question) => question.id === 'template-only-1'),
    ).toBe(false);
  });

  it('should filter library by search term', async () => {
    const questions = await useCase.execute({
      storeId: STORE_ID,
      search: 'queixa',
    });

    expect(questions).toHaveLength(1);
    expect(questions[0]?.id).toBe(GLOBAL_QUESTION_4.id);
  });
});
