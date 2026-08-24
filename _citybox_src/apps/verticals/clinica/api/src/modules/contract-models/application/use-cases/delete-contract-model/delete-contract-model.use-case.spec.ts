import { CreateContractModelUseCase } from '../create-contract-model/create-contract-model.use-case';
import { DeleteContractModelUseCase } from './delete-contract-model.use-case';
import { InMemoryContractModelRepository } from '../../../tests/in-memory-contract-model.repository';
import { ContractModelNotFoundError } from '../../../domain/errors/contract-model-not-found.error';
import { ContractModelIsDefaultError } from '../../../domain/errors/contract-model-is-default.error';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

describe('DeleteContractModelUseCase', () => {
  let useCase: DeleteContractModelUseCase;
  let createUseCase: CreateContractModelUseCase;
  let repo: InMemoryContractModelRepository;

  beforeEach(() => {
    repo = new InMemoryContractModelRepository();
    useCase = new DeleteContractModelUseCase(repo);
    createUseCase = new CreateContractModelUseCase(repo);
  });

  it('should delete a non-default contract model', async () => {
    const created = await createUseCase.execute({
      storeId: STORE_ID,
      name: 'Modelo A',
      content: '',
      isDefault: false,
    });

    await useCase.execute({ storeId: STORE_ID, id: created.id });

    expect(repo.getAll()).toHaveLength(0);
  });

  it('should throw when model is not found', async () => {
    await expect(
      useCase.execute({
        storeId: STORE_ID,
        id: '99999999-9999-4999-8999-999999999999',
      }),
    ).rejects.toBeInstanceOf(ContractModelNotFoundError);
  });

  it('should throw when trying to delete the default model', async () => {
    const created = await createUseCase.execute({
      storeId: STORE_ID,
      name: 'Modelo padrão',
      content: '',
      isDefault: true,
    });

    await expect(
      useCase.execute({ storeId: STORE_ID, id: created.id }),
    ).rejects.toBeInstanceOf(ContractModelIsDefaultError);
  });
});
