import { CreateContractModelUseCase } from '../create-contract-model/create-contract-model.use-case';
import { UpdateContractModelUseCase } from './update-contract-model.use-case';
import { InMemoryContractModelRepository } from '../../../tests/in-memory-contract-model.repository';
import { ContractModelNotFoundError } from '../../../domain/errors/contract-model-not-found.error';
import { ContractModelNameTakenError } from '../../../domain/errors/contract-model-name-taken.error';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

describe('UpdateContractModelUseCase', () => {
  let useCase: UpdateContractModelUseCase;
  let createUseCase: CreateContractModelUseCase;
  let repo: InMemoryContractModelRepository;

  beforeEach(() => {
    repo = new InMemoryContractModelRepository();
    useCase = new UpdateContractModelUseCase(repo);
    createUseCase = new CreateContractModelUseCase(repo);
  });

  it('should update a contract model', async () => {
    const created = await createUseCase.execute({
      storeId: STORE_ID,
      name: 'Modelo A',
      content: '<p>Antigo</p>',
      isDefault: false,
    });

    const updated = await useCase.execute({
      storeId: STORE_ID,
      id: created.id,
      name: 'Modelo A atualizado',
      content: '<p>Novo</p>',
      isDefault: false,
    });

    expect(updated.name).toBe('Modelo A atualizado');
    expect(updated.content).toBe('<p>Novo</p>');
  });

  it('should throw when model is not found', async () => {
    await expect(
      useCase.execute({
        storeId: STORE_ID,
        id: '99999999-9999-4999-8999-999999999999',
        name: 'Inexistente',
        content: '',
        isDefault: false,
      }),
    ).rejects.toBeInstanceOf(ContractModelNotFoundError);
  });

  it('should throw when name already exists on another model', async () => {
    await createUseCase.execute({
      storeId: STORE_ID,
      name: 'Modelo A',
      content: '',
      isDefault: false,
    });
    const second = await createUseCase.execute({
      storeId: STORE_ID,
      name: 'Modelo B',
      content: '',
      isDefault: false,
    });

    await expect(
      useCase.execute({
        storeId: STORE_ID,
        id: second.id,
        name: 'modelo a',
        content: '',
        isDefault: false,
      }),
    ).rejects.toBeInstanceOf(ContractModelNameTakenError);
  });

  it('should unset other defaults when updating with isDefault true', async () => {
    const first = await createUseCase.execute({
      storeId: STORE_ID,
      name: 'Primeiro',
      content: '',
      isDefault: true,
    });
    const second = await createUseCase.execute({
      storeId: STORE_ID,
      name: 'Segundo',
      content: '',
      isDefault: false,
    });

    await useCase.execute({
      storeId: STORE_ID,
      id: second.id,
      name: 'Segundo',
      content: '',
      isDefault: true,
    });

    const refreshedFirst = await repo.findById(STORE_ID, first.id);
    const refreshedSecond = await repo.findById(STORE_ID, second.id);
    expect(refreshedFirst?.isDefault).toBe(false);
    expect(refreshedSecond?.isDefault).toBe(true);
  });
});
