import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ProviderType } from '../../generated/prisma/enums.js';
import { parseOptionalDate } from '../../common/utils/serialization.js';
import { toJson } from '../../common/utils/prisma-json.js';
import { AuditLogService } from '../audit/audit.service.js';
import { ProviderAccountsService } from '../provider-accounts/provider-accounts.service.js';
import { PaymentProviderFactory } from '../providers/payment-provider.factory.js';
import { ProviderRoutingService } from '../providers/provider-routing.service.js';
import { InternalWebhookService } from '../webhooks/internal-webhook.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateSubscriptionDto, ResumeSubscriptionDto } from './dto/subscription.dto.js';
import { mapProviderSubscriptionStatus, toSubscriptionResponse } from './subscription.mapper.js';

@Injectable()
export class SubscriptionsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PaymentProviderFactory) private readonly providerFactory: PaymentProviderFactory,
    @Inject(ProviderRoutingService) private readonly routing: ProviderRoutingService,
    @Inject(ProviderAccountsService) private readonly providerAccounts: ProviderAccountsService,
    @Inject(AuditLogService) private readonly audit: AuditLogService,
    @Inject(InternalWebhookService) private readonly webhooks: InternalWebhookService,
  ) {}

  async create(tenantId: string, authSourceSystem: string, dto: CreateSubscriptionDto) {
    if (dto.sourceSystem !== authSourceSystem) {
      throw new BadRequestException('sourceSystem deve corresponder à API Key');
    }

    const merchant = await this.prisma.db.merchant.findFirst({
      where: { id: dto.merchantId, tenantId },
    });
    if (!merchant) throw new NotFoundException('Merchant não encontrado');

    const routing = await this.routing.resolveForCharge({
      tenantId,
      merchantId: dto.merchantId,
      requested: (dto.provider ?? 'AUTO') as ProviderType | 'AUTO',
      paymentMethods: [dto.paymentMethod],
    });
    const providerCode = routing.provider;

    try {
      this.providerFactory.getSubscriptionProvider(providerCode);
    } catch {
      throw new BadRequestException(`Provider ${providerCode} não suporta assinaturas`);
    }

    const account = await this.providerAccounts.getActiveAccount(tenantId, dto.merchantId, providerCode);
    const credentials = this.providerAccounts.resolveCredentials(providerCode, account);
    const subscriptionProvider = this.providerFactory.getSubscriptionProvider(providerCode);

    const customer = await this.prisma.db.paymentCustomer.create({
      data: {
        tenantId,
        merchantId: dto.merchantId,
        name: dto.customer.name,
        cpfCnpj: dto.customer.cpfCnpj,
        email: dto.customer.email,
        phone: dto.customer.phone,
        addressJson: toJson(dto.customer.address),
      },
    });

    let providerCustomerId: string | undefined;
    if (providerCode !== 'STUB' && credentials) {
      const paymentProvider = this.providerFactory.getProvider(providerCode);
      const created = await paymentProvider.createCustomer({
        name: dto.customer.name,
        cpfCnpj: dto.customer.cpfCnpj,
        email: dto.customer.email,
        phone: dto.customer.phone,
        credentials,
      });
      providerCustomerId = created.providerCustomerId;
      if (account?.id) {
        await this.prisma.db.providerCustomer.create({
          data: {
            customerId: customer.id,
            providerAccountId: account.id,
            providerCustomerId,
            rawPayload: created.rawPayload as object,
          },
        });
      }
    }

    const providerResult = await subscriptionProvider.createSubscription({
      amount: dto.amount,
      currency: dto.currency ?? 'BRL',
      description: dto.description,
      externalReference: dto.externalReference,
      billingCycle: dto.billingCycle,
      paymentMethod: dto.paymentMethod,
      nextDueDate: dto.nextDueDate,
      customer: {
        name: dto.customer.name,
        cpfCnpj: dto.customer.cpfCnpj,
        email: dto.customer.email,
        phone: dto.customer.phone,
      },
      credentials: credentials ?? undefined,
      providerCustomerId,
      metadata: dto.metadata,
    });

    const subscription = await this.prisma.db.subscription.create({
      data: {
        tenantId,
        merchantId: dto.merchantId,
        customerId: customer.id,
        providerAccountId: account?.id,
        sourceSystem: dto.sourceSystem,
        externalReference: dto.externalReference,
        provider: providerCode,
        status: mapProviderSubscriptionStatus(providerResult.status) as never,
        amount: dto.amount,
        currency: dto.currency ?? 'BRL',
        billingCycle: dto.billingCycle as never,
        paymentMethod: dto.paymentMethod,
        nextDueDate: parseOptionalDate(providerResult.nextDueDate ?? dto.nextDueDate),
        providerSubscriptionId: providerResult.providerSubscriptionId,
        description: dto.description,
        metadataJson: toJson({
          ...(dto.metadata ?? {}),
          verticalIntegration: 'subscriptions',
          routingFallbackFrom: routing.fallbackFrom,
        }),
        rawProviderPayload: providerResult.rawPayload as object,
      },
    });

    await this.prisma.db.subscriptionCycle.create({
      data: {
        subscriptionId: subscription.id,
        cycleNumber: 1,
        status: 'PENDING',
        amount: dto.amount,
        dueDate: subscription.nextDueDate ?? parseOptionalDate(dto.nextDueDate) ?? new Date(),
      },
    });

    await this.audit.log({
      tenantId,
      actor: dto.sourceSystem,
      action: 'subscription.created',
      resourceType: 'subscription',
      resourceId: subscription.id,
      metadata: { provider: providerCode },
    });

    await this.webhooks.deliver({
      tenantId,
      sourceSystem: dto.sourceSystem,
      eventType: 'payment.subscription.created',
      payload: this.webhooks.buildPayload({
        event: 'payment.subscription.created',
        sourceSystem: dto.sourceSystem,
        externalReference: dto.externalReference,
        provider: providerCode,
        status: subscription.status,
        amount: dto.amount,
      }),
    });

    return toSubscriptionResponse(subscription);
  }

  async list(tenantId: string, sourceSystem?: string) {
    const rows = await this.prisma.db.subscription.findMany({
      where: { tenantId, ...(sourceSystem ? { sourceSystem } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => toSubscriptionResponse(row));
  }

  async get(tenantId: string, id: string) {
    const subscription = await this.prisma.db.subscription.findFirst({
      where: { id, tenantId },
    });
    if (!subscription) throw new NotFoundException('Subscription não encontrada');
    return toSubscriptionResponse(subscription);
  }

  async cancel(tenantId: string, id: string, actor: string) {
    const subscription = await this.getEntity(tenantId, id);
    const credentials = await this.resolveCredentials(subscription);
    const provider = this.providerFactory.getSubscriptionProvider(subscription.provider);
    if (!subscription.providerSubscriptionId) {
      throw new BadRequestException('Subscription sem referência no provider');
    }

    await provider.cancelSubscription({
      providerSubscriptionId: subscription.providerSubscriptionId,
      credentials: credentials ?? undefined,
    });

    const updated = await this.prisma.db.subscription.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    await this.notifyLifecycle(updated, 'payment.subscription.cancelled', actor);
    return toSubscriptionResponse(updated);
  }

  async pause(tenantId: string, id: string, actor: string) {
    const subscription = await this.getEntity(tenantId, id);
    const credentials = await this.resolveCredentials(subscription);
    const provider = this.providerFactory.getSubscriptionProvider(subscription.provider);
    if (!subscription.providerSubscriptionId) {
      throw new BadRequestException('Subscription sem referência no provider');
    }

    await provider.updateSubscription({
      providerSubscriptionId: subscription.providerSubscriptionId,
      status: 'INACTIVE',
      credentials: credentials ?? undefined,
    });

    const updated = await this.prisma.db.subscription.update({
      where: { id },
      data: { status: 'PAUSED', pausedAt: new Date() },
    });

    await this.notifyLifecycle(updated, 'payment.subscription.paused', actor);
    return toSubscriptionResponse(updated);
  }

  async resume(tenantId: string, id: string, actor: string, dto: ResumeSubscriptionDto) {
    const subscription = await this.getEntity(tenantId, id);
    const credentials = await this.resolveCredentials(subscription);
    const provider = this.providerFactory.getSubscriptionProvider(subscription.provider);
    if (!subscription.providerSubscriptionId) {
      throw new BadRequestException('Subscription sem referência no provider');
    }

    const providerResult = await provider.updateSubscription({
      providerSubscriptionId: subscription.providerSubscriptionId,
      status: 'ACTIVE',
      nextDueDate: dto.nextDueDate,
      credentials: credentials ?? undefined,
    });

    const updated = await this.prisma.db.subscription.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        pausedAt: null,
        nextDueDate: parseOptionalDate(providerResult.nextDueDate ?? dto.nextDueDate),
      },
    });

    await this.notifyLifecycle(updated, 'payment.subscription.resumed', actor);
    return toSubscriptionResponse(updated);
  }

  private async getEntity(tenantId: string, id: string) {
    const subscription = await this.prisma.db.subscription.findFirst({ where: { id, tenantId } });
    if (!subscription) throw new NotFoundException('Subscription não encontrada');
    return subscription;
  }

  private async resolveCredentials(subscription: {
    tenantId: string;
    merchantId: string;
    provider: ProviderType;
    providerAccountId: string | null;
  }) {
    const account = subscription.providerAccountId
      ? await this.prisma.db.providerAccount.findUnique({ where: { id: subscription.providerAccountId } })
      : await this.providerAccounts.getActiveAccount(
          subscription.tenantId,
          subscription.merchantId,
          subscription.provider,
        );
    return this.providerAccounts.resolveCredentials(subscription.provider, account);
  }

  private async notifyLifecycle(
    subscription: {
      id: string;
      tenantId: string;
      sourceSystem: string;
      externalReference: string;
      provider: ProviderType;
      status: string;
      amount: { toString(): string };
    },
    eventType: string,
    actor: string,
  ) {
    await this.audit.log({
      tenantId: subscription.tenantId,
      actor,
      action: eventType,
      resourceType: 'subscription',
      resourceId: subscription.id,
    });
    await this.webhooks.deliver({
      tenantId: subscription.tenantId,
      sourceSystem: subscription.sourceSystem,
      eventType,
      payload: this.webhooks.buildPayload({
        event: eventType,
        sourceSystem: subscription.sourceSystem,
        externalReference: subscription.externalReference,
        provider: subscription.provider,
        status: subscription.status,
        amount: Number(subscription.amount.toString()),
      }),
    });
  }
}
