import { Module } from '@nestjs/common';
import { ListSubscriptionsRoute } from './infrastructure/http/routes/list-subscriptions/list-subscriptions.route';
import { FindSubscriptionByIdRoute } from './infrastructure/http/routes/find-subscription-by-id/find-subscription-by-id.route';
import { CreateSubscriptionRoute } from './infrastructure/http/routes/create-subscription/create-subscription.route';
import { CancelSubscriptionRoute } from './infrastructure/http/routes/cancel-subscription/cancel-subscription.route';
import { ListSubscriptionsUseCase } from './application/use-cases/list-subscriptions/list-subscriptions.use-case';
import { FindSubscriptionByIdUseCase } from './application/use-cases/find-subscription-by-id/find-subscription-by-id.use-case';
import { CreateSubscriptionUseCase } from './application/use-cases/create-subscription/create-subscription.use-case';
import { CancelSubscriptionUseCase } from './application/use-cases/cancel-subscription/cancel-subscription.use-case';
import { PrismaSubscriptionRepository } from './infrastructure/database/prisma-subscription.repository';
import { SubscriptionRepository } from './domain/repositories/subscription.repository.interface';

@Module({
  controllers: [
    ListSubscriptionsRoute,
    FindSubscriptionByIdRoute,
    CreateSubscriptionRoute,
    CancelSubscriptionRoute,
  ],
  providers: [
    { provide: SubscriptionRepository, useClass: PrismaSubscriptionRepository },
    ListSubscriptionsUseCase,
    FindSubscriptionByIdUseCase,
    CreateSubscriptionUseCase,
    CancelSubscriptionUseCase,
  ],
  exports: [SubscriptionRepository],
})
export class SubscriptionsModule {}
