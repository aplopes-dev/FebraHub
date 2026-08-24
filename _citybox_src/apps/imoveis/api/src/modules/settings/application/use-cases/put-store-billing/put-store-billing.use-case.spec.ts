import { DEFAULT_BILLING_SETTINGS } from '../../../domain/entities/store-settings.entity';
import { InvalidBillingStatusError } from '../../../domain/errors/invalid-billing-status.error';
import { InMemoryStoreSettingsRepository } from '../../../infrastructure/database/in-memory-store-settings.repository';
import { PutStoreBillingUseCase } from './put-store-billing.use-case';

const STORE = 'store-1';

describe('PutStoreBillingUseCase', () => {
  let repo: InMemoryStoreSettingsRepository;
  let useCase: PutStoreBillingUseCase;

  beforeEach(() => {
    repo = new InMemoryStoreSettingsRepository();
    useCase = new PutStoreBillingUseCase(repo);
  });

  it('grava plano, status, renovação e valor', async () => {
    const settings = await useCase.execute({
      storeId: STORE,
      planName: 'Enterprise',
      status: 'past_due',
      renewsAt: '2026-09-01T00:00:00.000Z',
      amountCents: 49900,
    });

    expect(settings.billing.planName).toBe('Enterprise');
    expect(settings.billing.status).toBe('past_due');
    expect(settings.billing.renewsAt?.toISOString()).toBe(
      '2026-09-01T00:00:00.000Z',
    );
    expect(settings.billing.amountCents).toBe(49900);
  });

  it('mantém os campos omitidos', async () => {
    await useCase.execute({
      storeId: STORE,
      planName: 'Enterprise',
      amountCents: 49900,
    });

    const settings = await useCase.execute({
      storeId: STORE,
      status: 'canceled',
    });

    expect(settings.billing.planName).toBe('Enterprise');
    expect(settings.billing.amountCents).toBe(49900);
    expect(settings.billing.status).toBe('canceled');
  });

  it('aceita `renewsAt` nulo para limpar a data', async () => {
    await useCase.execute({
      storeId: STORE,
      renewsAt: '2026-09-01T00:00:00.000Z',
    });

    const settings = await useCase.execute({ storeId: STORE, renewsAt: null });

    expect(settings.billing.renewsAt).toBeNull();
  });

  it('rejeita status fora do catálogo', async () => {
    await expect(
      useCase.execute({ storeId: STORE, status: 'trialing' }),
    ).rejects.toBeInstanceOf(InvalidBillingStatusError);
  });

  it('parte dos padrões quando a loja ainda não tem linha', async () => {
    const settings = await useCase.execute({
      storeId: STORE,
      status: 'canceled',
    });

    expect(settings.billing.planName).toBe(DEFAULT_BILLING_SETTINGS.planName);
    expect(settings.billing.amountCents).toBe(
      DEFAULT_BILLING_SETTINGS.amountCents,
    );
  });
});
