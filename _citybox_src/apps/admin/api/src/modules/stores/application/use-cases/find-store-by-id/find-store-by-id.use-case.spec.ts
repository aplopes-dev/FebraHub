import { createPassThroughUnitOfWork } from '../../../../../shared/core/tests/pass-through-unit-of-work';
import { FindStoreByIdUseCase } from './find-store-by-id.use-case';
import { CreateStoreUseCase } from '../create-store/create-store.use-case';
import { InMemoryStoreRepository } from '../../../tests/in-memory-store.repository';
import { InMemoryStoreDetailRepository } from '../../../tests/in-memory-store-detail.repository';
import { InMemorySubscriptionRepository } from '../../../../subscriptions/tests/in-memory-subscription.repository';
import { InMemoryInvoiceRepository } from '../../../../invoices/tests/in-memory-invoice.repository';
import { InMemoryPlanRepository } from '../../../../plans/tests/in-memory-plan.repository';
import { buildCreateStoreFixture } from '../../../tests/build-create-store-fixture';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';
import { FakeVerticalMemberProvisioning } from '../../../tests/fake-vertical-member-provisioning';

describe('FindStoreByIdUseCase', () => {
  let useCase: FindStoreByIdUseCase;
  let storeRepo: InMemoryStoreRepository;
  let detailRepo: InMemoryStoreDetailRepository;
  let subscriptionRepo: InMemorySubscriptionRepository;
  let invoiceRepo: InMemoryInvoiceRepository;
  let planRepo: InMemoryPlanRepository;
  let provisioning: FakeVerticalMemberProvisioning;

  function buildUseCase(
    supportedVerticals: string[] = [],
  ): FindStoreByIdUseCase {
    provisioning = new FakeVerticalMemberProvisioning({ supportedVerticals });
    return new FindStoreByIdUseCase(
      storeRepo,
      detailRepo,
      subscriptionRepo,
      invoiceRepo,
      provisioning,
    );
  }

  async function seedStore() {
    const createStore = new CreateStoreUseCase(
      storeRepo,
      subscriptionRepo,
      planRepo,
      createPassThroughUnitOfWork(),
      invoiceRepo,
    );
    const dto = await buildCreateStoreFixture(planRepo, subscriptionRepo);
    const created = await createStore.execute(dto);
    return { store: created.store, vertical: dto.vertical };
  }

  beforeEach(() => {
    storeRepo = new InMemoryStoreRepository();
    subscriptionRepo = new InMemorySubscriptionRepository();
    invoiceRepo = new InMemoryInvoiceRepository();
    planRepo = new InMemoryPlanRepository();
    detailRepo = new InMemoryStoreDetailRepository();
    useCase = buildUseCase();
  });

  // A assinatura e as faturas saem direto da loja (`storeId`) — não há mais Cliente
  // intermediário no resultado desde a Fase 10.
  it('finds a store with its own subscription and invoices (FR-001)', async () => {
    const { store } = await seedStore();

    const result = await useCase.execute({ id: store.id });

    expect(result.store.id).toBe(store.id);
    expect(result.subscription?.storeId).toBe(store.id);
    expect(result.invoices.length).toBeGreaterThan(0);
    expect(
      result.invoices.every((invoice) => invoice.storeId === store.id),
    ).toBe(true);
  });

  // A aba "Membros" do admin decide por este campo de onde ler a equipe. Ele sai do
  // `isSupported` do provider, não de um `if (vertical === 'Clínica')`: quando outra
  // vertical expuser API de membros, o valor vira 'vertical' sem tocar em UI.
  it('marks teamSource as vertical when the vertical owns the team', async () => {
    const { store, vertical } = await seedStore();
    useCase = buildUseCase([vertical]);

    const result = await useCase.execute({ id: store.id });

    expect(result.teamSource).toBe('vertical');
  });

  it('marks teamSource as vertical for Comércio when ERP is supported', async () => {
    const { store } = await seedStore();
    useCase = buildUseCase(['Comércio']);

    const result = await useCase.execute({ id: store.id });

    expect(result.teamSource).toBe('vertical');
  });

  it('keeps teamSource as platform when the vertical exposes no member API', async () => {
    const { store } = await seedStore();

    const result = await useCase.execute({ id: store.id });

    expect(result.teamSource).toBe('platform');
  });

  it('should throw StoreNotFoundError when missing', async () => {
    await expect(
      useCase.execute({ id: '00000000-0000-4000-8000-000000000001' }),
    ).rejects.toBeInstanceOf(StoreNotFoundError);
  });
});
