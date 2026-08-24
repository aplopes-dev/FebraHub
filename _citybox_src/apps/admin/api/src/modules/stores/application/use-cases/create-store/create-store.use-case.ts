import { Injectable, Optional } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { UnitOfWork } from '../../../../../shared/core/unit-of-work';
import { StoreRepository } from '../../../domain/repositories/store.repository.interface';
import { Store } from '../../../domain/entities/store.entity';
import { StoreSlugTakenError } from '../../../domain/errors/store-slug-taken.error';
import { PlanNotFoundError } from '../../../domain/errors/plan-not-found.error';
import { PlanVerticalMismatchError } from '../../../domain/errors/plan-vertical-mismatch.error';
import { PlanPriceNotFoundError } from '../../../domain/errors/plan-price-not-found.error';
import { SubscriptionRepository } from '../../../../subscriptions/domain/repositories/subscription.repository.interface';
import { Subscription } from '../../../../subscriptions/domain/entities/subscription.entity';
import { calculateBillingPeriod } from '../../../../subscriptions/application/utils/billing-period';
import { generateUpfrontInvoices } from '../../../../subscriptions/application/utils/generate-upfront-invoices';
import { InvoiceRepository } from '../../../../invoices/domain/repositories/invoice.repository.interface';
import { PlanRepository } from '../../../../plans/domain/repositories/plan.repository.interface';
import type { CreateStoreDto } from '../../dtos/store.dto';
import {
  mapUpsertDtoToStoreProps,
  normalizeStoreSlug,
} from '../../mappers/store.mapper';

export type CreateStoreResult = {
  store: Store;
  /** Credenciais só saem em `POST …/provision` — o create não toca Keycloak. */
  meta: null;
};

/**
 * Cadastra a loja (billing + dados fiscais) **sem** provisionar a vertical.
 *
 * Organização, membro OWNER e usuário no Keycloak nascem só quando o operador
 * confirma `POST /v1/stores/:id/provision` no detalhe — aí a senha provisória
 * volta na mesma resposta HTTP.
 */
@Injectable()
export class CreateStoreUseCase implements IUseCase<
  CreateStoreDto,
  CreateStoreResult
> {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly planRepository: PlanRepository,
    private readonly unitOfWork: UnitOfWork,
    @Optional() private readonly invoiceRepository?: InvoiceRepository,
  ) {}

  async execute(dto: CreateStoreDto): Promise<CreateStoreResult> {
    const slug = normalizeStoreSlug(dto.slug);
    const existingSlug = await this.storeRepository.findBySlug(slug);
    if (existingSlug) {
      throw new StoreSlugTakenError(CreateStoreUseCase.name, slug);
    }

    const plan = await this.planRepository.findById(dto.planId);
    if (!plan) {
      throw new PlanNotFoundError(CreateStoreUseCase.name, dto.planId);
    }
    if (plan.vertical !== dto.vertical) {
      throw new PlanVerticalMismatchError(
        CreateStoreUseCase.name,
        dto.vertical,
        plan.vertical,
      );
    }

    const cycle = dto.billingCycle;
    const planPrice = await this.subscriptionRepository.findPriceByPlanAndCycle(
      plan.id,
      cycle,
    );
    if (!planPrice) {
      throw new PlanPriceNotFoundError(
        CreateStoreUseCase.name,
        plan.id,
        dto.billingCycle,
      );
    }

    const store = Store.create(
      mapUpsertDtoToStoreProps({ ...dto, slug }, CreateStoreUseCase.name),
    );
    const now = new Date();
    const { periodStart, periodEnd } = calculateBillingPeriod(
      now,
      dto.dueDay,
      cycle,
    );

    const saved = await this.unitOfWork.run(async () => {
      const persisted = await this.storeRepository.save(store);

      const subscription = Subscription.create({
        storeId: persisted.id,
        planPriceId: planPrice.id,
        cycle,
        dayOfMonth: dto.dueDay,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });
      await this.subscriptionRepository.save(subscription);

      if (this.invoiceRepository) {
        const invoices = generateUpfrontInvoices({
          subscriptionId: subscription.id,
          storeId: persisted.id,
          priceCents: planPrice.priceCents,
          cycle,
          dayOfMonth: dto.dueDay,
          referenceDate: now,
        });
        for (const invoice of invoices) {
          await this.invoiceRepository.save(invoice);
        }
      }

      return persisted;
    });

    return { store: saved, meta: null };
  }
}
