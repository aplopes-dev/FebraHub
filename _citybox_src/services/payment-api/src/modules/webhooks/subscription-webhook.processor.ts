import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ProviderType } from '../../generated/prisma/enums.js';
import { parseOptionalDate } from '../../common/utils/serialization.js';
import { mapAsaasSubscriptionEventToInternal } from '../providers/asaas/asaas-subscription.mapper.js';
import type { NormalizedProviderEvent } from '../providers/payment-provider.interface.js';
import { mapProviderSubscriptionStatus } from '../subscriptions/subscription.mapper.js';
import { InternalWebhookService } from './internal-webhook.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class SubscriptionWebhookProcessor {
  private readonly logger = new Logger(SubscriptionWebhookProcessor.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(InternalWebhookService) private readonly internalWebhooks: InternalWebhookService,
  ) {}

  async handle(provider: ProviderType, normalized: NormalizedProviderEvent): Promise<boolean> {
    if (!normalized.subscriptionEvent && !normalized.providerSubscriptionId) {
      return false;
    }

    const subscription = await this.prisma.db.subscription.findFirst({
      where: {
        OR: [
          ...(normalized.providerSubscriptionId
            ? [{ providerSubscriptionId: normalized.providerSubscriptionId }]
            : []),
        ],
        provider,
      },
    });

    if (!subscription) {
      this.logger.warn(`Subscription não encontrada para webhook ${normalized.eventType}`);
      return true;
    }

    const status = mapProviderSubscriptionStatus(normalized.status);
    const updateData: {
      status: typeof subscription.status;
      nextDueDate?: Date;
      cancelledAt?: Date;
      pausedAt?: Date | null;
      rawProviderPayload: object;
    } = {
      status: status as typeof subscription.status,
      rawProviderPayload: normalized.rawPayload as object,
    };

    if (normalized.nextDueDate) {
      updateData.nextDueDate = parseOptionalDate(normalized.nextDueDate);
    }
    if (status === 'CANCELLED') updateData.cancelledAt = new Date();
    if (status === 'PAUSED') updateData.pausedAt = new Date();
    if (status === 'ACTIVE') updateData.pausedAt = null;

    const updated = await this.prisma.db.subscription.update({
      where: { id: subscription.id },
      data: updateData,
    });

    if (normalized.providerChargeId && normalized.eventType.includes('PAYMENT')) {
      await this.prisma.db.subscriptionCycle.create({
        data: {
          subscriptionId: subscription.id,
          cycleNumber: await this.nextCycleNumber(subscription.id),
          status: normalized.status === 'PAID' || normalized.status === 'RECEIVED' ? 'PAID' : 'PENDING',
          amount: normalized.amount ?? subscription.amount,
          dueDate: updated.nextDueDate ?? new Date(),
          providerChargeId: normalized.providerChargeId,
          paidAt: normalized.paidAt ? new Date(normalized.paidAt) : undefined,
        },
      }).catch(() => undefined);
    }

    const internalEvent =
      provider === 'ASAAS'
        ? mapAsaasSubscriptionEventToInternal(normalized.eventType)
        : 'payment.subscription.updated';

    await this.internalWebhooks.deliver({
      tenantId: subscription.tenantId,
      sourceSystem: subscription.sourceSystem,
      eventType: internalEvent,
      payload: this.internalWebhooks.buildPayload({
        event: internalEvent,
        sourceSystem: subscription.sourceSystem,
        externalReference: subscription.externalReference,
        provider: subscription.provider,
        status: updated.status,
        amount: Number(subscription.amount.toString()),
      }),
    });

    return true;
  }

  private async nextCycleNumber(subscriptionId: string) {
    const last = await this.prisma.db.subscriptionCycle.findFirst({
      where: { subscriptionId },
      orderBy: { cycleNumber: 'desc' },
    });
    return (last?.cycleNumber ?? 0) + 1;
  }
}
