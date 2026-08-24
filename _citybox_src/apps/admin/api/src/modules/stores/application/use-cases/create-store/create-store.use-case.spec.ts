import { createPassThroughUnitOfWork } from '../../../../../shared/core/tests/pass-through-unit-of-work';
import { CreateStoreUseCase } from './create-store.use-case';
import { InMemoryStoreRepository } from '../../../tests/in-memory-store.repository';
import { InMemorySubscriptionRepository } from '../../../../subscriptions/tests/in-memory-subscription.repository';
import { InMemoryInvoiceRepository } from '../../../../invoices/tests/in-memory-invoice.repository';
import { InMemoryPlanRepository } from '../../../../plans/tests/in-memory-plan.repository';
import { Plan } from '../../../../plans/domain/entities/plan.entity';
import { Store } from '../../../domain/entities/store.entity';
import { StoreSlugTakenError } from '../../../domain/errors/store-slug-taken.error';
import { PlanNotFoundError } from '../../../domain/errors/plan-not-found.error';
import { PlanVerticalMismatchError } from '../../../domain/errors/plan-vertical-mismatch.error';
import { InvalidClinicStrandError } from '../../../domain/errors/invalid-clinic-strand.error';
import type { CreateStoreDto } from '../../dtos/store.dto';

function buildStoreDto(
  overrides: Partial<CreateStoreDto> = {},
): CreateStoreDto {
  return {
    vertical: 'Comércio',
    tradeName: 'Maria Doces',
    slug: 'maria-doces',
    document: '11.444.777/0001-61',
    personType: 'PJ',
    responsibleName: 'Carlos Mendes',
    billingEmail: 'carlos@example.com',
    timezone: 'America/Sao_Paulo',
    planId: '',
    billingCycle: 'MONTHLY',
    dueDay: 10,
    ...overrides,
  };
}

describe('CreateStoreUseCase', () => {
  let useCase: CreateStoreUseCase;
  let storeRepo: InMemoryStoreRepository;
  let subscriptionRepo: InMemorySubscriptionRepository;
  let invoiceRepo: InMemoryInvoiceRepository;
  let planRepo: InMemoryPlanRepository;
  let comercioPlanId: string;
  let clinicPlanId: string;

  beforeEach(async () => {
    storeRepo = new InMemoryStoreRepository();
    subscriptionRepo = new InMemorySubscriptionRepository();
    invoiceRepo = new InMemoryInvoiceRepository();
    planRepo = new InMemoryPlanRepository();

    const comercioPlan = await planRepo.save(
      Plan.create({
        code: 'comercio-basico',
        name: 'Comércio Básico',
        description: 'Plano de entrada para a vertical Comércio',
        prices: [{ cycle: 'MONTHLY', priceCents: 9900 }],
        vertical: 'Comércio',
        tier: 'basico',
        maxNegocios: 1,
        maxUsers: 5,
      }),
    );
    comercioPlanId = comercioPlan.id;
    subscriptionRepo.addPrice(
      comercioPlanId,
      'MONTHLY',
      crypto.randomUUID(),
      9900,
    );

    const clinicPlan = await planRepo.save(
      Plan.create({
        code: 'clinica-prata',
        name: 'Clínica Prata',
        description: 'Plano de entrada para a vertical Clínica',
        prices: [{ cycle: 'MONTHLY', priceCents: 19900 }],
        vertical: 'Clínica',
        tier: 'prata',
        maxNegocios: 1,
        maxUsers: 5,
      }),
    );
    clinicPlanId = clinicPlan.id;
    subscriptionRepo.addPrice(
      clinicPlanId,
      'MONTHLY',
      crypto.randomUUID(),
      19900,
    );

    useCase = new CreateStoreUseCase(
      storeRepo,
      subscriptionRepo,
      planRepo,
      createPassThroughUnitOfWork(),
      invoiceRepo,
    );
  });

  it('creates a store as PENDING without Keycloak or outbox event', async () => {
    const result = await useCase.execute(
      buildStoreDto({ planId: comercioPlanId }),
    );

    expect(result.store).toBeInstanceOf(Store);
    expect(result.store.status).toBe('IN_SETUP');
    expect(result.store.deploymentStatus).toBe('PENDING');
    expect(result.meta).toBeNull();
    expect(result.store.personType).toBe('PJ');
    expect(result.store.responsibleName).toBe('Carlos Mendes');
    expect(result.store.billingEmail).toBe('carlos@example.com');
    expect(storeRepo.getAll()).toHaveLength(1);

    const subscription = await subscriptionRepo.findActiveByStoreId(
      result.store.id,
    );
    expect(subscription).not.toBeNull();
    expect(subscription?.storeId).toBe(result.store.id);
  });

  it('allows two stores to share the same fiscal document (FR-016)', async () => {
    await useCase.execute(buildStoreDto({ planId: comercioPlanId }));

    const second = await useCase.execute(
      buildStoreDto({ planId: comercioPlanId, slug: 'maria-doces-filial' }),
    );

    expect(second.store.document).toBe('11444777000161');
  });

  it('throws StoreSlugTakenError for a duplicate slug', async () => {
    await useCase.execute(buildStoreDto({ planId: comercioPlanId }));

    await expect(
      useCase.execute(buildStoreDto({ planId: comercioPlanId })),
    ).rejects.toBeInstanceOf(StoreSlugTakenError);
  });

  it('throws PlanNotFoundError when the plan does not exist', async () => {
    await expect(
      useCase.execute(
        buildStoreDto({ planId: '00000000-0000-4000-8000-000000000001' }),
      ),
    ).rejects.toBeInstanceOf(PlanNotFoundError);
  });

  it('throws PlanVerticalMismatchError when the plan belongs to a different vertical', async () => {
    await expect(
      useCase.execute(
        buildStoreDto({ vertical: 'Comércio', planId: clinicPlanId }),
      ),
    ).rejects.toBeInstanceOf(PlanVerticalMismatchError);
  });

  it('persists odontologia when a Clínica store is created without clinicStrand', async () => {
    const result = await useCase.execute(
      buildStoreDto({ vertical: 'Clínica', planId: clinicPlanId }),
    );

    expect(result.store.clinicStrand).toBe('odontologia');
    expect(result.store.deploymentStatus).toBe('PENDING');
    expect(result.meta).toBeNull();
  });

  it('persists fisioterapia when provided on create', async () => {
    const result = await useCase.execute(
      buildStoreDto({
        vertical: 'Clínica',
        planId: clinicPlanId,
        clinicStrand: 'fisioterapia',
      }),
    );

    expect(result.store.clinicStrand).toBe('fisioterapia');
  });

  it('persists nutricao when provided on create', async () => {
    const result = await useCase.execute(
      buildStoreDto({
        vertical: 'Clínica',
        planId: clinicPlanId,
        clinicStrand: 'nutricao',
      }),
    );

    expect(result.store.clinicStrand).toBe('nutricao');
  });

  it('throws InvalidClinicStrandError for an unknown strand', async () => {
    await expect(
      useCase.execute(
        buildStoreDto({
          vertical: 'Clínica',
          planId: clinicPlanId,
          clinicStrand: 'estetica',
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidClinicStrandError);
  });

  it('ignores clinicStrand when the vertical is not Clínica', async () => {
    const result = await useCase.execute(
      buildStoreDto({
        planId: comercioPlanId,
        clinicStrand: 'fisioterapia',
      }),
    );

    expect(result.store.clinicStrand).toBeNull();
  });
});
