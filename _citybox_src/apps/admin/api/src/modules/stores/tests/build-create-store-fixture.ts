import { Plan } from '../../plans/domain/entities/plan.entity';
import type { InMemoryPlanRepository } from '../../plans/tests/in-memory-plan.repository';
import type { InMemorySubscriptionRepository } from '../../subscriptions/tests/in-memory-subscription.repository';
import type { CreateStoreDto } from '../application/dtos/store.dto';

/**
 * Cria um Plan de teste (vertical Comércio) e retorna um CreateStoreDto válido
 * pronto para `CreateStoreUseCase.execute()` — usado por specs que precisam
 * de uma Store existente como fixture, sem repetir o setup de plano em cada arquivo.
 */
export async function buildCreateStoreFixture(
  planRepo: InMemoryPlanRepository,
  subscriptionRepo: InMemorySubscriptionRepository,
  overrides: Partial<CreateStoreDto> = {},
): Promise<CreateStoreDto> {
  const vertical = overrides.vertical ?? 'Comércio';
  const plan = await planRepo.save(
    Plan.create({
      code: `plano-${crypto.randomUUID()}`,
      name: `${vertical} Básico`,
      description: `Plano de entrada para a vertical ${vertical}`,
      prices: [{ cycle: 'MONTHLY', priceCents: 9900 }],
      vertical,
      tier: 'basico',
      maxNegocios: 5,
      maxUsers: 10,
    }),
  );
  subscriptionRepo.addPrice(plan.id, 'MONTHLY', crypto.randomUUID(), 9900);

  return {
    vertical: 'Comércio',
    tradeName: 'Maria Doces',
    slug: 'maria-doces',
    document: '11.444.777/0001-61',
    personType: 'PJ',
    responsibleName: 'Carlos Mendes',
    billingEmail: 'carlos@example.com',
    timezone: 'America/Sao_Paulo',
    planId: plan.id,
    billingCycle: 'MONTHLY',
    dueDay: 10,
    ...overrides,
  };
}
