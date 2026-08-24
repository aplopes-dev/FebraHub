import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ProviderType } from '../../generated/prisma/enums.js';
import { IdempotencyService } from '../../common/idempotency/idempotency.service.js';
import { hashPayload, parseOptionalDate } from '../../common/utils/serialization.js';
import { toJson } from '../../common/utils/prisma-json.js';
import { sanitizePciForStorage } from '../../common/security/pci-payload.js';
import { PaymentMetricsService } from '../../common/observability/payment-metrics.service.js';
import { AuditLogService, ProviderRequestService } from '../audit/audit.service.js';
import { ProviderAccountsService } from '../provider-accounts/provider-accounts.service.js';
import { PaymentProviderFactory } from '../providers/payment-provider.factory.js';
import { ProviderRoutingService } from '../providers/provider-routing.service.js';
import type { ProviderCredentials } from '../providers/payment-provider.interface.js';
import { InternalWebhookService } from '../webhooks/internal-webhook.service.js';
import { SplitsService } from '../splits/splits.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateChargeDto } from './dto/create-charge.dto.js';
import { mapProviderStatusToChargeStatus, toChargeResponse } from './charge.mapper.js';

@Injectable()
export class ChargesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(IdempotencyService) private readonly idempotency: IdempotencyService,
    @Inject(PaymentProviderFactory) private readonly providerFactory: PaymentProviderFactory,
    @Inject(ProviderRoutingService) private readonly routing: ProviderRoutingService,
    @Inject(ProviderAccountsService) private readonly providerAccounts: ProviderAccountsService,
    @Inject(AuditLogService) private readonly audit: AuditLogService,
    @Inject(ProviderRequestService) private readonly providerRequests: ProviderRequestService,
    @Inject(InternalWebhookService) private readonly webhooks: InternalWebhookService,
    @Inject(SplitsService) private readonly splits: SplitsService,
    @Inject(PaymentMetricsService) private readonly metrics: PaymentMetricsService,
  ) {}

  async create(
    tenantId: string,
    authSourceSystem: string,
    idempotencyKey: string | undefined,
    dto: CreateChargeDto,
  ) {
    if (dto.sourceSystem !== authSourceSystem) {
      throw new BadRequestException('sourceSystem deve corresponder à API Key');
    }
    if (!idempotencyKey) {
      throw new BadRequestException('Header Idempotency-Key é obrigatório');
    }

    const requestHash = hashPayload(dto);
    const idem = await this.idempotency.acquire({
      tenantId,
      sourceSystem: dto.sourceSystem,
      operation: 'create_charge',
      key: idempotencyKey,
      requestHash,
    });
    if (idem.kind === 'replay') return idem.body;

    try {
      const merchant = await this.prisma.db.merchant.findFirst({
        where: { id: dto.merchantId, tenantId },
      });
      if (!merchant) throw new NotFoundException('Merchant não encontrado');

      const routing = await this.routing.resolveForCharge({
        tenantId,
        merchantId: dto.merchantId,
        requested: (dto.provider ?? 'AUTO') as ProviderType | 'AUTO',
        paymentMethods: dto.paymentMethods,
        routingStrategy: dto.routingStrategy,
      });
      const providerCode = routing.provider;
      const account = await this.providerAccounts.getActiveAccount(
        tenantId,
        dto.merchantId,
        providerCode,
      );
      const credentials = this.providerAccounts.resolveCredentials(providerCode, account);
      const provider = this.providerFactory.getProvider(providerCode);

      if (dto.splitRules?.length) {
        this.splits.validateAndResolve(dto.amount, dto.splitRules);
      }

      const customer = await this.prisma.db.paymentCustomer.upsert({
        where: {
          tenantId_merchantId_cpfCnpj: {
            tenantId,
            merchantId: dto.merchantId,
            cpfCnpj: dto.customer.cpfCnpj,
          },
        },
        create: {
          tenantId,
          merchantId: dto.merchantId,
          name: dto.customer.name,
          cpfCnpj: dto.customer.cpfCnpj,
          email: dto.customer.email,
          phone: dto.customer.phone,
          addressJson: toJson(dto.customer.address),
        },
        update: {
          name: dto.customer.name,
          email: dto.customer.email,
          phone: dto.customer.phone,
          addressJson: toJson(dto.customer.address),
        },
      });

      const charge = await this.prisma.db.charge.create({
        data: {
          tenantId,
          merchantId: dto.merchantId,
          providerAccountId: account?.id,
          sourceSystem: dto.sourceSystem,
          externalReference: dto.externalReference,
          idempotencyKey,
          description: dto.description,
          amount: dto.amount,
          currency: dto.currency ?? 'BRL',
          status: 'DRAFT',
          dueDate: parseOptionalDate(dto.dueDate),
          expiresAt: parseOptionalDate(dto.expiresAt),
          provider: providerCode,
          metadataJson: toJson(
            sanitizePciForStorage({
              ...(dto.metadata ?? {}),
              routingStrategy: dto.routingStrategy ?? 'DEFAULT',
              routingFallbackFrom: routing.fallbackFrom,
            }),
          ),
          items: dto.items?.length
            ? {
                create: dto.items.map((item) => ({
                  externalItemId: item.externalItemId,
                  description: item.description,
                  quantity: item.quantity,
                  unitValue: item.unitValue,
                  totalValue: item.totalValue,
                })),
              }
            : undefined,
        },
        include: { items: true },
      });

      let splitRecords: Awaited<ReturnType<SplitsService['createForCharge']>> = [];
      if (dto.splitRules?.length) {
        splitRecords = await this.splits.createForCharge({
          tenantId,
          chargeId: charge.id,
          chargeAmount: dto.amount,
          rules: dto.splitRules,
        });
      }

      const providerSplitRules = dto.splitRules?.length
        ? this.splits.validateAndResolve(dto.amount, dto.splitRules).map((rule) => ({
            recipientId: rule.recipientId,
            type: rule.type,
            amount: rule.amount,
            percentage: rule.percentage ?? undefined,
            providerWalletId: rule.providerWalletId,
          }))
        : undefined;

      let providerCustomerId: string | undefined;
      if (providerCode !== 'STUB' && credentials) {
        providerCustomerId = await this.ensureProviderCustomer({
          tenantId,
          customerId: customer.id,
          providerAccountId: account?.id,
          provider: providerCode,
          credentials,
          customer: dto.customer,
          providerImpl: provider,
        });
      }

      let providerResult;
      try {
        providerResult = await provider.createCharge({
          amount: dto.amount,
          currency: dto.currency ?? 'BRL',
          description: dto.description,
          dueDate: dto.dueDate,
          expiresAt: dto.expiresAt,
          externalReference: dto.externalReference,
          paymentMethods: dto.paymentMethods,
          customer: {
            name: dto.customer.name,
            cpfCnpj: dto.customer.cpfCnpj,
            email: dto.customer.email,
            phone: dto.customer.phone,
          },
          metadata: dto.metadata,
          credentials: credentials ?? undefined,
          providerCustomerId,
          splitRules: providerSplitRules,
        });
        await this.providerRequests.log({
          tenantId,
          provider: providerCode,
          operation: 'createCharge',
          chargeId: charge.id,
          requestPayload: dto,
          responsePayload: providerResult,
          status: 'SUCCESS',
          httpStatus: 200,
        });
      } catch (error) {
        this.metrics.increment('provider_errors_total', { provider: providerCode });
        await this.providerRequests.log({
          tenantId,
          provider: providerCode,
          operation: 'createCharge',
          chargeId: charge.id,
          requestPayload: dto,
          status: 'ERROR',
          errorMessage: error instanceof Error ? error.message : 'provider error',
        });
        throw error;
      }

      const updated = await this.prisma.db.charge.update({
        where: { id: charge.id },
        data: {
          status: mapProviderStatusToChargeStatus(providerResult.status) as never,
          paymentUrl: providerResult.paymentUrl,
          providerChargeId: providerResult.providerChargeId,
          providerOrderId: providerResult.providerOrderId,
          providerPaymentId: providerResult.providerPaymentId,
          rawProviderPayload: sanitizePciForStorage(providerResult.rawPayload) as object,
        },
        include: { items: true },
      });

      await this.audit.log({
        tenantId,
        actor: dto.sourceSystem,
        action: 'charge.created',
        resourceType: 'charge',
        resourceId: updated.id,
        metadata: {
          provider: providerCode,
          customerId: customer.id,
          routingFallbackFrom: routing.fallbackFrom,
        },
      });

      const response = toChargeResponse(updated, {
        paymentMethods: dto.paymentMethods,
        pix: providerResult.pix,
        boleto: providerResult.boleto,
        checkout: providerResult.checkout,
        infiniteTap: providerResult.infiniteTap,
        stonePos: providerResult.stonePos,
        splits: splitRecords,
      });

      await this.webhooks.deliver({
        tenantId,
        sourceSystem: dto.sourceSystem,
        eventType: 'payment.charge.created',
        payload: this.webhooks.buildPayload({
          event: 'payment.charge.created',
          chargeId: updated.id,
          sourceSystem: dto.sourceSystem,
          externalReference: dto.externalReference,
          provider: providerCode,
          status: updated.status,
          amount: dto.amount,
        }),
      });

      await this.idempotency.complete(idem.recordId, response);
      this.metrics.increment('charges_created_total', { provider: providerCode });
      return response;
    } catch (error) {
      if (idem.kind === 'new') await this.idempotency.fail(idem.recordId);
      if (error instanceof ConflictException) throw error;
      throw error;
    }
  }

  async list(tenantId: string, sourceSystem?: string) {
    const rows = await this.prisma.db.charge.findMany({
      where: { tenantId, ...(sourceSystem ? { sourceSystem } : {}) },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => toChargeResponse(row));
  }

  async get(tenantId: string, id: string) {
    const charge = await this.prisma.db.charge.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!charge) throw new NotFoundException('Charge não encontrada');
    const splits = await this.splits.listByCharge(tenantId, id);
    return toChargeResponse(charge, { splits });
  }

  async cancel(tenantId: string, id: string) {
    const charge = await this.prisma.db.charge.findFirst({ where: { id, tenantId } });
    if (!charge) throw new NotFoundException('Charge não encontrada');
    if (!charge.provider || !charge.providerChargeId) {
      throw new BadRequestException('Charge sem referência de provider');
    }

    const credentials = await this.resolveChargeCredentials(charge);
    const provider = this.providerFactory.getProvider(charge.provider);
    const result = await provider.cancelCharge({
      providerChargeId: charge.providerChargeId,
      credentials: credentials ?? undefined,
    });

    const updated = await this.prisma.db.charge.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        rawProviderPayload: result.rawPayload as object,
      },
      include: { items: true },
    });

    await this.webhooks.deliver({
      tenantId,
      sourceSystem: charge.sourceSystem,
      eventType: 'payment.charge.cancelled',
      payload: this.webhooks.buildPayload({
        event: 'payment.charge.cancelled',
        chargeId: updated.id,
        sourceSystem: charge.sourceSystem,
        externalReference: charge.externalReference,
        provider: charge.provider,
        status: updated.status,
        amount: Number(updated.amount),
      }),
    });

    return toChargeResponse(updated);
  }

  async syncStatus(tenantId: string, id: string) {
    const charge = await this.prisma.db.charge.findFirst({ where: { id, tenantId } });
    if (!charge) throw new NotFoundException('Charge não encontrada');
    if (!charge.provider || !charge.providerChargeId) {
      throw new BadRequestException('Charge sem referência de provider');
    }

    const credentials = await this.resolveChargeCredentials(charge);
    const provider = this.providerFactory.getProvider(charge.provider);
    const result = await provider.getCharge({
      providerChargeId: charge.providerChargeId,
      externalReference: charge.externalReference,
      credentials: credentials ?? undefined,
    });

    const updated = await this.prisma.db.charge.update({
      where: { id },
      data: {
        status: mapProviderStatusToChargeStatus(result.status) as never,
        paymentUrl: result.paymentUrl ?? charge.paymentUrl,
        rawProviderPayload: result.rawPayload as object,
      },
      include: { items: true },
    });

    return toChargeResponse(updated);
  }

  private async resolveChargeCredentials(charge: {
    tenantId: string;
    merchantId: string;
    provider: ProviderType | null;
    providerAccountId: string | null;
  }) {
    if (!charge.provider) return null;
    const account = charge.providerAccountId
      ? await this.prisma.db.providerAccount.findUnique({ where: { id: charge.providerAccountId } })
      : await this.providerAccounts.getActiveAccount(
          charge.tenantId,
          charge.merchantId,
          charge.provider,
        );
    return this.providerAccounts.resolveCredentials(charge.provider, account);
  }

  private async ensureProviderCustomer(input: {
    tenantId: string;
    customerId: string;
    providerAccountId?: string;
    provider: ProviderType;
    credentials: ProviderCredentials;
    customer: CreateChargeDto['customer'];
    providerImpl: ReturnType<PaymentProviderFactory['getProvider']>;
  }) {
    if (input.providerAccountId) {
      const linked = await this.prisma.db.providerCustomer.findFirst({
        where: { customerId: input.customerId, providerAccountId: input.providerAccountId },
      });
      if (linked) return linked.providerCustomerId;
    }

    const created = await input.providerImpl.createCustomer({
      name: input.customer.name,
      cpfCnpj: input.customer.cpfCnpj,
      email: input.customer.email,
      phone: input.customer.phone,
      credentials: input.credentials,
    });

    if (input.providerAccountId) {
      await this.prisma.db.providerCustomer.create({
        data: {
          customerId: input.customerId,
          providerAccountId: input.providerAccountId,
          providerCustomerId: created.providerCustomerId,
          rawPayload: created.rawPayload as object,
        },
      });
    }

    return created.providerCustomerId;
  }
}
