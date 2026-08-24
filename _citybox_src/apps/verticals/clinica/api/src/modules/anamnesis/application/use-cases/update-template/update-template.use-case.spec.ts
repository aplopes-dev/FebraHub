import { UpdateTemplateUseCase } from './update-template.use-case';
import { InMemoryAnamnesisTemplateRepository } from '../../../tests/in-memory-anamnesis-template.repository';
import { InMemoryAnamnesisQuestionRepository } from '../../../tests/in-memory-anamnesis-question.repository';
import { TemplateNotFoundError } from '../../../domain/errors/template-not-found.error';
import {
  GLOBAL_QUESTION_1,
  GLOBAL_QUESTION_4,
  STORE_ID,
} from '../../../tests/fixtures';

describe('UpdateTemplateUseCase', () => {
  let useCase: UpdateTemplateUseCase;
  let templateRepo: InMemoryAnamnesisTemplateRepository;
  let questionRepo: InMemoryAnamnesisQuestionRepository;

  beforeEach(async () => {
    templateRepo = new InMemoryAnamnesisTemplateRepository();
    questionRepo = new InMemoryAnamnesisQuestionRepository();
    questionRepo.seed([GLOBAL_QUESTION_1, GLOBAL_QUESTION_4]);
    useCase = new UpdateTemplateUseCase(templateRepo, questionRepo);

    await templateRepo.saveAggregate({
      id: 'template-1',
      storeId: STORE_ID,
      name: 'Modelo original',
      status: 'active',
      templateQuestions: [{ questionId: GLOBAL_QUESTION_1.id, active: true }],
      customQuestions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('should reorder template questions and replace custom questions', async () => {
    const updated = await useCase.execute({
      storeId: STORE_ID,
      id: 'template-1',
      name: 'Modelo atualizado',
      status: 'inactive',
      templateQuestions: [
        { questionId: GLOBAL_QUESTION_4.id, active: true },
        { questionId: GLOBAL_QUESTION_1.id, active: false },
      ],
      customQuestions: [
        {
          text: 'Pergunta custom',
          type: 'text',
        },
      ],
    });

    expect(updated.name).toBe('Modelo atualizado');
    expect(updated.status).toBe('inactive');
    expect(updated.templateQuestions).toHaveLength(3);
    expect(updated.templateQuestions[0]?.questionId).toBe(GLOBAL_QUESTION_4.id);
    expect(updated.customQuestions).toHaveLength(1);
  });

  it('should throw when template does not exist', async () => {
    await expect(
      useCase.execute({
        storeId: STORE_ID,
        id: 'missing',
        name: 'X',
        status: 'active',
        templateQuestions: [],
        customQuestions: [],
      }),
    ).rejects.toBeInstanceOf(TemplateNotFoundError);
  });
});
