import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { UnitOfWork } from '../../../../../shared/core/unit-of-work';
import { StoreRepository } from '../../../domain/repositories/store.repository.interface';
import { StoreDetailRepository } from '../../../domain/repositories/store-detail.repository.interface';
import { Store } from '../../../domain/entities/store.entity';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';
import { PlanNotFoundError } from '../../../domain/errors/plan-not-found.error';
import { PlanVerticalMismatchError } from '../../../domain/errors/plan-vertical-mismatch.error';
import { PlanPriceNotFoundError } from '../../../domain/errors/plan-price-not-found.error';
import { PlanRepository } from '../../../../plans/domain/repositories/plan.repository.interface';
import { SubscriptionRepository } from '../../../../subscriptions/domain/repositories/subscription.repository.interface';
import { Subscription } from '../../../../subscriptions/domain/entities/subscription.entity';
import type { SubscriptionCycle } from '../../../../subscriptions/domain/entities/subscription.entity';
import { calculateBillingPeriod } from '../../../../subscriptions/application/utils/billing-period';
import { StoreEventsPublisher } from '../../../../../shared/infra/messaging/store-events.publisher';
import { mapStoreToPlatformEvent } from '../../../../../shared/infra/messaging/store-platform-event.mapper';

export interface ChangeStorePlanDto {
  id: string;
  planId: string;
  billingCycle: SubscriptionCycle;
  dueDay: number;
  actor: string;
}

@Injectable()
export class ChangeStorePlanUseCase implements IUseCase<
  ChangeStorePlanDto,
  Store
> {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly storeDetailRepository: StoreDetailRepository,
    private readonly planRepository: PlanRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly storeEventsPublisher: StoreEventsPublisher,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(dto: ChangeStorePlanDto): Promise<Store> {
    const store = await this.storeRepository.findById(dto.id);
    if (!store) {
      throw new StoreNotFoundError(ChangeStorePlanUseCase.name, dto.id);
    }

    const plan = await this.planRepository.findById(dto.planId);
    if (!plan) {
      throw new PlanNotFoundError(ChangeStorePlanUseCase.name, dto.planId);
    }
    if (plan.vertical !== store.vertical) {
      throw new PlanVerticalMismatchError(
        ChangeStorePlanUseCase.name,
        store.vertical,
        plan.vertical,
      );
    }

    const planPrice = await this.subscriptionRepository.findPriceByPlanAndCycle(
      plan.id,
      dto.billingCycle,
    );
    if (!planPrice) {
      throw new PlanPriceNotFoundError(
        ChangeStorePlanUseCase.name,
        plan.id,
        dto.billingCycle,
      );
    }

    const now = new Date();
    const { periodStart, periodEnd } = calculateBillingPeriod(
      now,
      dto.dueDay,
      dto.billingCycle,
    );

    const activeSubscription =
      await this.subscriptionRepository.findActiveByStoreId(dto.id);

    // Assinatura + auditoria + evento no outbox commitam juntos: a vertical não pode
    // receber plan_changed de um plano que não foi persistido, nem deixar de receber
    // um que foi (o snapshot de quota dela depende disso).
    await this.unitOfWork.run(async () => {
      if (activeSubscription) {
        activeSubscription.changePlan({
          planPriceId: planPrice.id,
          cycle: dto.billingCycle,
          dayOfMonth: dto.dueDay,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        });
        await this.subscriptionRepository.save(activeSubscription);
      } else {
        const subscription = Subscription.create({
          storeId: dto.id,
          planPriceId: planPrice.id,
          cycle: dto.billingCycle,
          dayOfMonth: dto.dueDay,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        });
        await this.subscriptionRepository.save(subscription);
      }

      await this.storeDetailRepository.recordAuditEvent({
        storeId: store.id,
        severity: 'info',
        actor: dto.actor,
        module: 'Loja',
        action: `Trocou o plano para ${plan.name}`,
      });

      await this.storeEventsPublisher.publishStorePlanChanged(
        mapStoreToPlatformEvent(store, plan),
      );
    });

    return store;
  }
}
