import { DEFAULT_BILLING_SETTINGS } from '../../../domain/entities/store-settings.entity';
import { InMemoryStoreSettingsRepository } from '../../../infrastructure/database/in-memory-store-settings.repository';
import { GetStoreBillingUseCase } from './get-store-billing.use-case';

const STORE = 'store-1';

describe('GetStoreBillingUseCase', () => {
  let repo: InMemoryStoreSettingsRepository;
  let useCase: GetStoreBillingUseCase;

  beforeEach(() => {
    repo = new InMemoryStoreSettingsRepository();
    useCase = new GetStoreBillingUseCase(repo);
  });

  it('persiste a assinatura padrão na primeira leitura', async () => {
    const settings = await useCase.execute({ storeId: STORE });

    expect(settings.billing).toEqual(DEFAULT_BILLING_SETTINGS);
    expect(await repo.findByStoreId(STORE)).not.toBeNull();
  });

  it('devolve a assinatura já gravada', async () => {
    await repo.updateBilling(STORE, {
      planName: 'Enterprise',
      status: 'past_due',
      renewsAt: new Date('2026-09-01T00:00:00.000Z'),
      amountCents: 49900,
    });

    const settings = await useCase.execute({ storeId: STORE });

    expect(settings.billing.planName).toBe('Enterprise');
    expect(settings.billing.status).toBe('past_due');
    expect(settings.billing.amountCents).toBe(49900);
  });

  it('isola a assinatura por loja', async () => {
    await repo.updateBilling(STORE, {
      ...DEFAULT_BILLING_SETTINGS,
      planName: 'Enterprise',
    });

    const other = await useCase.execute({ storeId: 'store-2' });

    expect(other.billing.planName).toBe(DEFAULT_BILLING_SETTINGS.planName);
  });
});
