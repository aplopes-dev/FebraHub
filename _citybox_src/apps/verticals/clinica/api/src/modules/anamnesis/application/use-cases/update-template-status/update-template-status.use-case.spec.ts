import { UpdateTemplateStatusUseCase } from './update-template-status.use-case';
import { InMemoryAnamnesisTemplateRepository } from '../../../tests/in-memory-anamnesis-template.repository';
import { TemplateNotFoundError } from '../../../domain/errors/template-not-found.error';
import { STORE_ID } from '../../../tests/fixtures';

describe('UpdateTemplateStatusUseCase', () => {
  let useCase: UpdateTemplateStatusUseCase;
  let templateRepo: InMemoryAnamnesisTemplateRepository;

  beforeEach(async () => {
    templateRepo = new InMemoryAnamnesisTemplateRepository();
    useCase = new UpdateTemplateStatusUseCase(templateRepo);

    await templateRepo.saveAggregate({
      id: 'template-1',
      storeId: STORE_ID,
      name: 'Modelo',
      status: 'active',
      templateQuestions: [],
      customQuestions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('should toggle template status', async () => {
    const updated = await useCase.execute({
      storeId: STORE_ID,
      id: 'template-1',
      status: 'inactive',
    });

    expect(updated.status).toBe('inactive');
  });

  it('should throw when template does not exist', async () => {
    await expect(
      useCase.execute({
        storeId: STORE_ID,
        id: 'missing',
        status: 'inactive',
      }),
    ).rejects.toBeInstanceOf(TemplateNotFoundError);
  });
});
