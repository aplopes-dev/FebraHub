import { Plan } from '../../plans/domain/entities/plan.entity';
import type { InMemoryPlanRepository } from '../../plans/tests/in-memory-plan.repository';
import { Subscription } from '../../subscriptions/domain/entities/subscription.entity';
import type { InMemorySubscriptionRepository } from '../../subscriptions/tests/in-memory-subscription.repository';
import { Store, type StoreVertical } from '../domain/entities/store.entity';
import type { InMemoryStoreRepository } from './in-memory-store.repository';

type SeedDeps = {
  storeRepo: InMemoryStoreRepository;
  subscriptionRepo: InMemorySubscriptionRepository;
  planRepo: InMemoryPlanRepository;
};

type SeedOptions = {
  slug: string;
  vertical?: StoreVertical;
  tradeName?: string;
  /** Teto de assentos do plano — usado pelos specs de cota de membros. */
  maxUsers?: number;
};

/**
 * Cria uma Loja já com plano + assinatura ATIVA vinculados a ela.
 *
 * Desde a Fase 10 (ADR PLAT-001) a loja é a própria unidade de billing: quem precisa de
 * uma loja "operacional" nos testes precisa da assinatura ativa por `storeId`, porque é
 * dela que sai o plano (e o `maxUsers`) consultado pelos casos de uso de equipe.
 */
export async function seedStoreWithSubscription(
  { storeRepo, subscriptionRepo, planRepo }: SeedDeps,
  options: SeedOptions,
): Promise<Store> {
  const vertical = options.vertical ?? 'Comércio';

  const plan = await planRepo.save(
    Plan.create({
      code: `plano-${crypto.randomUUID()}`,
      name: `${vertical} Básico`,
      description: `Plano de entrada para a vertical ${vertical}`,
      prices: [{ cycle: 'MONTHLY', priceCents: 9900 }],
      vertical,
      tier: 'basico',
      maxNegocios: 1,
      maxUsers: options.maxUsers ?? 2,
    }),
  );

  const planPriceId = crypto.randomUUID();
  subscriptionRepo.addPrice(plan.id, 'MONTHLY', planPriceId, 9900);

  const store = await storeRepo.save(
    Store.create({
      vertical,
      tradeName: options.tradeName ?? 'Maria Doces',
      slug: options.slug,
      timezone: 'America/Sao_Paulo',
      personType: 'PJ',
      responsibleName: 'Carlos Mendes',
      billingEmail: 'carlos@example.com',
    }),
  );

  await subscriptionRepo.save(
    Subscription.create({
      storeId: store.id,
      planPriceId,
      cycle: 'MONTHLY',
      dayOfMonth: 10,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }),
  );

  return store;
}
