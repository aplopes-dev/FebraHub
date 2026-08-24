import { ListContractModelsUseCase } from './list-contract-models.use-case';
import { InMemoryContractModelRepository } from '../../../tests/in-memory-contract-model.repository';
import { ContractModel } from '../../../domain/entities/contract-model.entity';

const STORE_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_STORE_ID = '22222222-2222-4222-8222-222222222222';

describe('ListContractModelsUseCase', () => {
  let useCase: ListContractModelsUseCase;
  let repo: InMemoryContractModelRepository;

  beforeEach(() => {
    repo = new InMemoryContractModelRepository();
    useCase = new ListContractModelsUseCase(repo);
  });

  it('should return only models scoped to the store', async () => {
    await repo.save(
      ContractModel.create({
        storeId: STORE_ID,
        name: 'Modelo A',
        isDefault: true,
      }),
    );
    await repo.save(
      ContractModel.create({ storeId: OTHER_STORE_ID, name: 'Modelo B' }),
    );

    const models = await useCase.execute({ storeId: STORE_ID });

    expect(models).toHaveLength(1);
    expect(models[0]?.name).toBe('Modelo A');
  });
});
