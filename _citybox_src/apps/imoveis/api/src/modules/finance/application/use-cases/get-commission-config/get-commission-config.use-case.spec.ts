import { InMemoryCommissionConfigRepository } from '../../../infrastructure/database/in-memory-commission-config.repository';
import { GetCommissionConfigUseCase } from './get-commission-config.use-case';

const STORE = 'store-1';

describe('GetCommissionConfigUseCase', () => {
  let repo: InMemoryCommissionConfigRepository;
  let useCase: GetCommissionConfigUseCase;

  beforeEach(() => {
    repo = new InMemoryCommissionConfigRepository();
    useCase = new GetCommissionConfigUseCase(repo);
  });

  it('returns defaults without persisting when the store has no config', async () => {
    const config = await useCase.execute({ storeId: STORE });

    expect(config.defaultCommissionPercent).toBe(6);
    expect(config.defaultSplit).toEqual({
      agencyPercent: 40,
      captorPercent: 30,
      sellerPercent: 30,
    });
    expect(config.agentOverrides).toEqual([]);
    await expect(repo.getByStoreId(STORE)).resolves.toBeNull();
  });

  it('returns the stored config when it exists', async () => {
    await repo.upsert(STORE, {
      global: {
        defaultCommissionPercent: 5,
        defaultSplit: {
          agencyPercent: 50,
          captorPercent: 25,
          sellerPercent: 25,
        },
      },
      agentOverrides: [
        {
          agentId: 'ana-helena',
          captorPercentOverride: 40,
          sellerPercentOverride: 20,
        },
      ],
    });

    const config = await useCase.execute({ storeId: STORE });

    expect(config.defaultCommissionPercent).toBe(5);
    expect(config.agentOverrides).toHaveLength(1);
  });
});
