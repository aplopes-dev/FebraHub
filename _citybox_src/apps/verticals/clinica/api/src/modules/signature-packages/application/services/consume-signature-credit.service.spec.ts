import { ConsumeSignatureCreditService } from './consume-signature-credit.service';
import { SignatureCreditBalance } from '../../domain/entities/signature-credit-balance.entity';
import { SignatureCreditsInsufficientError } from '../../domain/errors/signature-credits-insufficient.error';
import { InMemorySignatureCreditBalanceRepository } from '../../tests/in-memory-signature-credit-balance.repository';

describe('ConsumeSignatureCreditService', () => {
  const STORE_ID = 'store-credits-1';

  it('debits 1 credit when balance is sufficient', async () => {
    const repo = new InMemorySignatureCreditBalanceRepository();
    await repo.save(
      SignatureCreditBalance.create({ storeId: STORE_ID, balance: 5 }),
    );
    const service = new ConsumeSignatureCreditService(repo);

    const result = await service.consume(STORE_ID);

    expect(result.balance).toBe(4);
    expect((await repo.findByStoreId(STORE_ID))?.balance).toBe(4);
  });

  it('throws when balance is zero', async () => {
    const repo = new InMemorySignatureCreditBalanceRepository();
    await repo.save(
      SignatureCreditBalance.create({ storeId: STORE_ID, balance: 0 }),
    );
    const service = new ConsumeSignatureCreditService(repo);

    await expect(service.consume(STORE_ID)).rejects.toBeInstanceOf(
      SignatureCreditsInsufficientError,
    );
  });

  it('refunds previously consumed credits', async () => {
    const repo = new InMemorySignatureCreditBalanceRepository();
    await repo.save(
      SignatureCreditBalance.create({ storeId: STORE_ID, balance: 2 }),
    );
    const service = new ConsumeSignatureCreditService(repo);

    await service.consume(STORE_ID);
    const refunded = await service.refund(STORE_ID);

    expect(refunded.balance).toBe(2);
  });
});
