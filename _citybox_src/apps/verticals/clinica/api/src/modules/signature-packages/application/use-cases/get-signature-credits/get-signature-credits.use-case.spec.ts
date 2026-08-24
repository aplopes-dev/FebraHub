import { GetSignatureCreditsUseCase } from './get-signature-credits.use-case';
import { InMemorySignatureCreditBalanceRepository } from '../../../tests/in-memory-signature-credit-balance.repository';
import { SignatureCreditBalance } from '../../../domain/entities/signature-credit-balance.entity';
import { SIGNATURE_CREDIT_SEED_BALANCE } from '../../../domain/signature-package-catalog';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

describe('GetSignatureCreditsUseCase', () => {
  let useCase: GetSignatureCreditsUseCase;
  let repo: InMemorySignatureCreditBalanceRepository;

  beforeEach(() => {
    repo = new InMemorySignatureCreditBalanceRepository();
    useCase = new GetSignatureCreditsUseCase(repo);
  });

  it('should seed balance with 0 credits when missing', async () => {
    const balance = await useCase.execute({ storeId: STORE_ID });

    expect(balance).toBeInstanceOf(SignatureCreditBalance);
    expect(balance.storeId).toBe(STORE_ID);
    expect(balance.balance).toBe(SIGNATURE_CREDIT_SEED_BALANCE);
    expect(repo.getAll()).toHaveLength(1);
  });

  it('should return existing balance without reseeding', async () => {
    await repo.save(
      SignatureCreditBalance.create({ storeId: STORE_ID, balance: 42 }),
    );

    const balance = await useCase.execute({ storeId: STORE_ID });

    expect(balance.balance).toBe(42);
    expect(repo.getAll()).toHaveLength(1);
  });
});
