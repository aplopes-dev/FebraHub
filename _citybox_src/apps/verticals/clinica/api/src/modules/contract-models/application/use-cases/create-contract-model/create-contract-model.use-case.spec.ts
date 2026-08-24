import { CreateContractModelUseCase } from './create-contract-model.use-case';
import { InMemoryContractModelRepository } from '../../../tests/in-memory-contract-model.repository';
import { ContractModel } from '../../../domain/entities/contract-model.entity';
import { ContractModelNameTakenError } from '../../../domain/errors/contract-model-name-taken.error';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

describe('CreateContractModelUseCase', () => {
  let useCase: CreateContractModelUseCase;
  let repo: InMemoryContractModelRepository;

  beforeEach(() => {
    repo = new InMemoryContractModelRepository();
    useCase = new CreateContractModelUseCase(repo);
  });

  it('should create a contract model scoped to the store', async () => {
    const model = await useCase.execute({
      storeId: STORE_ID,
      name: 'Contrato padrão',
      content: '<p>Conteúdo</p>',
      isDefault: false,
    });

    expect(model).toBeInstanceOf(ContractModel);
    expect(model.storeId).toBe(STORE_ID);
    expect(model.name).toBe('Contrato padrão');
    expect(model.content).toBe('<p>Conteúdo</p>');
    expect(model.isDefault).toBe(false);
    expect(repo.getAll()).toHaveLength(1);
  });

  it('should throw when name already exists for the store', async () => {
    await useCase.execute({
      storeId: STORE_ID,
      name: 'Contrato padrão',
      content: '',
      isDefault: false,
    });

    await expect(
      useCase.execute({
        storeId: STORE_ID,
        name: 'contrato padrão',
        content: '',
        isDefault: false,
      }),
    ).rejects.toBeInstanceOf(ContractModelNameTakenError);
  });

  it('should unset other defaults when creating with isDefault true', async () => {
    const first = await useCase.execute({
      storeId: STORE_ID,
      name: 'Primeiro',
      content: '',
      isDefault: true,
    });

    const second = await useCase.execute({
      storeId: STORE_ID,
      name: 'Segundo',
      content: '',
      isDefault: true,
    });

    const refreshedFirst = await repo.findById(STORE_ID, first.id);
    expect(refreshedFirst?.isDefault).toBe(false);
    expect(second.isDefault).toBe(true);
  });
});
