import { DeleteTemplateUseCase } from './delete-template.use-case';
import { InMemoryAnamnesisTemplateRepository } from '../../../tests/in-memory-anamnesis-template.repository';
import { TemplateNotFoundError } from '../../../domain/errors/template-not-found.error';
import { STORE_ID } from '../../../tests/fixtures';

describe('DeleteTemplateUseCase', () => {
  let useCase: DeleteTemplateUseCase;
  let templateRepo: InMemoryAnamnesisTemplateRepository;

  beforeEach(async () => {
    templateRepo = new InMemoryAnamnesisTemplateRepository();
    useCase = new DeleteTemplateUseCase(templateRepo);

    await templateRepo.saveAggregate({
      id: 'template-1',
      storeId: STORE_ID,
      name: 'Modelo',
      status: 'active',
      templateQuestions: [],
      customQuestions: [
        {
          id: 'custom-1',
          text: 'Custom',
          type: 'text',
          scope: 'clinic',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('should delete template', async () => {
    await useCase.execute({ storeId: STORE_ID, id: 'template-1' });
    expect(templateRepo.getAll()).toHaveLength(0);
  });

  it('should throw when template does not exist', async () => {
    await expect(
      useCase.execute({ storeId: STORE_ID, id: 'missing' }),
    ).rejects.toBeInstanceOf(TemplateNotFoundError);
  });
});
