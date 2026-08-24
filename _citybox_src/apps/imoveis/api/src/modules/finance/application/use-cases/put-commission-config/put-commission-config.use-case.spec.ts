import { InvalidSplitError } from '../../../../transactions/domain/errors/invalid-split.error';
import { InMemoryCommissionConfigRepository } from '../../../infrastructure/database/in-memory-commission-config.repository';
import {
  PutCommissionConfigUseCase,
  type PutCommissionConfigInput,
} from './put-commission-config.use-case';

const STORE = 'store-1';

const VALID_INPUT: PutCommissionConfigInput = {
  storeId: STORE,
  global: {
    defaultCommissionPercent: 5,
    defaultSplit: { agencyPercent: 50, captorPercent: 25, sellerPercent: 25 },
  },
  agentOverrides: [{ agentId: 'ana-helena', captorPercentOverride: 40 }],
};

describe('PutCommissionConfigUseCase', () => {
  let repo: InMemoryCommissionConfigRepository;
  let useCase: PutCommissionConfigUseCase;

  beforeEach(() => {
    repo = new InMemoryCommissionConfigRepository();
    useCase = new PutCommissionConfigUseCase(repo);
  });

  it('persists the config and normalizes missing seller overrides to null', async () => {
    const config = await useCase.execute(VALID_INPUT);

    expect(config.defaultCommissionPercent).toBe(5);
    expect(config.agentOverrides[0]).toEqual({
      agentId: 'ana-helena',
      captorPercentOverride: 40,
      sellerPercentOverride: null,
    });
    await expect(repo.getByStoreId(STORE)).resolves.not.toBeNull();
  });

  it('replaces overrides on a second save', async () => {
    await useCase.execute(VALID_INPUT);

    const config = await useCase.execute({
      ...VALID_INPUT,
      agentOverrides: [],
    });

    expect(config.agentOverrides).toHaveLength(0);
  });

  it('rejects splits that do not add up to 100%', async () => {
    await expect(
      useCase.execute({
        ...VALID_INPUT,
        global: {
          defaultCommissionPercent: 5,
          defaultSplit: {
            agencyPercent: 50,
            captorPercent: 25,
            sellerPercent: 20,
          },
        },
      }),
    ).rejects.toBeInstanceOf(InvalidSplitError);
  });

  it('rejects an out-of-range default commission', async () => {
    await expect(
      useCase.execute({
        ...VALID_INPUT,
        global: { ...VALID_INPUT.global, defaultCommissionPercent: 140 },
      }),
    ).rejects.toBeInstanceOf(InvalidSplitError);
  });
});
