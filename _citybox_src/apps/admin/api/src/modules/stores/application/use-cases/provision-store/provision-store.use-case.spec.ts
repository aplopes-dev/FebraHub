import { ProvisionStoreUseCase } from './provision-store.use-case';
import { InMemoryStoreRepository } from '../../../tests/in-memory-store.repository';
import { InMemorySubscriptionRepository } from '../../../../subscriptions/tests/in-memory-subscription.repository';
import { InMemoryPlanRepository } from '../../../../plans/tests/in-memory-plan.repository';
import { FakeVerticalMemberProvisioning } from '../../../tests/fake-vertical-member-provisioning';
import { Store } from '../../../domain/entities/store.entity';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';
import { StoreAlreadyProvisionedConflictError } from '../../../domain/errors/store-already-provisioned-conflict.error';
import {
  VerticalNotSupportedError,
  VerticalProvisioningError,
} from '../../../domain/errors/vertical-provisioning.error';
import { Plan } from '../../../../plans/domain/entities/plan.entity';
import { Subscription } from '../../../../subscriptions/domain/entities/subscription.entity';

describe('ProvisionStoreUseCase', () => {
  let storeRepo: InMemoryStoreRepository;
  let subscriptionRepo: InMemorySubscriptionRepository;
  let planRepo: InMemoryPlanRepository;
  let vertical: FakeVerticalMemberProvisioning;
  let useCase: ProvisionStoreUseCase;

  beforeEach(() => {
    storeRepo = new InMemoryStoreRepository();
    subscriptionRepo = new InMemorySubscriptionRepository();
    planRepo = new InMemoryPlanRepository();
    vertical = new FakeVerticalMemberProvisioning({
      supportedVerticals: ['Comércio'],
    });
    useCase = new ProvisionStoreUseCase(
      storeRepo,
      subscriptionRepo,
      planRepo,
      vertical,
    );
  });

  async function seedPendingStore(): Promise<Store> {
    const plan = await planRepo.save(
      Plan.create({
        code: 'comercio-basico',
        name: 'Comércio Básico',
        description: 'Plano',
        prices: [{ cycle: 'MONTHLY', priceCents: 9900 }],
        vertical: 'Comércio',
        tier: 'basico',
        maxNegocios: 1,
        maxUsers: 5,
      }),
    );
    const store = await storeRepo.save(
      Store.create({
        vertical: 'Comércio',
        tradeName: 'Maria Doces',
        slug: 'maria-doces',
        personType: 'PJ',
        document: '11444777000161',
        legalName: 'Maria Doces LTDA',
        responsibleName: 'Carlos Mendes',
        billingEmail: 'carlos@example.com',
        timezone: 'America/Sao_Paulo',
        deploymentStatus: 'PENDING',
      }),
    );
    await subscriptionRepo.save(
      Subscription.create({
        storeId: store.id,
        planPriceId: crypto.randomUUID(),
        planId: plan.id,
        cycle: 'MONTHLY',
        dayOfMonth: 10,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
      }),
    );
    return store;
  }

  it('provisions via vertical and marks ACTIVE with credentials', async () => {
    const store = await seedPendingStore();

    const result = await useCase.execute({ storeId: store.id });

    expect(result.username).toBe('carlos@example.com');
    expect(result.provisionalPassword).toBe('fake-provision-password');
    const updated = await storeRepo.findById(store.id);
    expect(updated?.deploymentStatus).toBe('ACTIVE');
    expect(vertical.provisionCalls).toHaveLength(1);
  });

  it('marks FAILED when the vertical call fails', async () => {
    const store = await seedPendingStore();
    vertical.failProvision = true;

    await expect(useCase.execute({ storeId: store.id })).rejects.toBeInstanceOf(
      VerticalProvisioningError,
    );

    const updated = await storeRepo.findById(store.id);
    expect(updated?.deploymentStatus).toBe('FAILED');
  });

  it('throws 409 when already ACTIVE', async () => {
    const store = await seedPendingStore();
    store.setDeploymentStatus('ACTIVE');
    await storeRepo.save(store);

    await expect(useCase.execute({ storeId: store.id })).rejects.toBeInstanceOf(
      StoreAlreadyProvisionedConflictError,
    );
  });

  it('throws when vertical URL is not configured', async () => {
    const unsupported = new FakeVerticalMemberProvisioning({
      supportedVerticals: [],
    });
    useCase = new ProvisionStoreUseCase(
      storeRepo,
      subscriptionRepo,
      planRepo,
      unsupported,
    );
    const store = await seedPendingStore();

    await expect(useCase.execute({ storeId: store.id })).rejects.toBeInstanceOf(
      VerticalNotSupportedError,
    );
  });

  it('throws StoreNotFoundError', async () => {
    await expect(
      useCase.execute({
        storeId: '00000000-0000-4000-8000-000000000099',
      }),
    ).rejects.toBeInstanceOf(StoreNotFoundError);
  });
});
