import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ProviderType } from '../../generated/prisma/enums.js';
import { decimalToNumber } from '../../common/utils/serialization.js';
import { PaymentMetricsService } from '../../common/observability/payment-metrics.service.js';
import { AuditLogService, ProviderRequestService } from '../audit/audit.service.js';
import { ProviderAccountsService } from '../provider-accounts/provider-accounts.service.js';
import { PaymentProviderFactory } from '../providers/payment-provider.factory.js';
import { InternalWebhookService } from '../webhooks/internal-webhook.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { toPaymentResponse } from '../charges/charge.mapper.js';
import type { CapturePaymentDto } from './dto/capture-payment.dto.js';
import type { RefundPaymentDto } from './dto/refund-payment.dto.js';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PaymentProviderFactory) private readonly providerFactory: PaymentProviderFactory,
    @Inject(ProviderAccountsService) private readonly providerAccounts: ProviderAccountsService,
    @Inject(AuditLogService) private readonly audit: AuditLogService,
    @Inject(ProviderRequestService) private readonly providerRequests: ProviderRequestService,
    @Inject(InternalWebhookService) private readonly webhooks: InternalWebhookService,
    @Inject(PaymentMetricsService) private readonly metrics: PaymentMetricsService,
  ) {}

  async list(tenantId: string, chargeId?: string) {
    const payments = await this.prisma.db.payment.findMany({
      where: chargeId
        ? { chargeId, charge: { tenantId } }
        : { charge: { tenantId } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return payments.map((payment) => toPaymentResponse(payment));
  }

  async get(tenantId: string, id: string) {
    const payment = await this.prisma.db.payment.findFirst({
      where: { id, charge: { tenantId } },
    });
    if (!payment) throw new NotFoundException('Payment não encontrado');
    return toPaymentResponse(payment);
  }

  async refund(
    tenantId: string,
    paymentId: string,
    requestedBy: string,
    dto: RefundPaymentDto,
  ) {
    const payment = await this.prisma.db.payment.findFirst({
      where: { id: paymentId, charge: { tenantId } },
      include: { charge: true },
    });
    if (!payment) throw new NotFoundException('Payment não encontrado');
    if (!payment.providerPaymentId) {
      throw new BadRequestException('Payment sem referência no provider');
    }

    const account = payment.charge.providerAccountId
      ? await this.prisma.db.providerAccount.findUnique({
          where: { id: payment.charge.providerAccountId },
        })
      : await this.providerAccounts.getActiveAccount(
          tenantId,
          payment.charge.merchantId,
          payment.provider,
        );
    const credentials = this.providerAccounts.resolveCredentials(payment.provider, account);
    const provider = this.providerFactory.getProvider(payment.provider);
    const amount = dto.amount ?? decimalToNumber(payment.grossAmount);

    const refundResult = await provider.refundPayment({
      providerPaymentId: payment.providerPaymentId,
      amount,
      reason: dto.reason,
      credentials: credentials ?? undefined,
    });

    const refund = await this.prisma.db.refund.create({
      data: {
        paymentId: payment.id,
        provider: payment.provider,
        status: 'COMPLETED',
        amount,
        reason: dto.reason,
        providerRefundId: refundResult.providerRefundId,
        requestedBy,
        processedAt: new Date(),
        rawProviderPayload: refundResult.rawPayload as object,
      },
    });

    await this.prisma.db.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    });
    await this.prisma.db.charge.update({
      where: { id: payment.chargeId },
      data: { status: 'REFUNDED' },
    });

    await this.providerRequests.log({
      tenantId,
      provider: payment.provider,
      operation: 'refundPayment',
      chargeId: payment.chargeId,
      paymentId: payment.id,
      requestPayload: dto,
      responsePayload: refundResult,
      status: 'SUCCESS',
      httpStatus: 200,
    });

    await this.audit.log({
      tenantId,
      actor: requestedBy,
      action: 'payment.refunded',
      resourceType: 'refund',
      resourceId: refund.id,
      metadata: { paymentId: payment.id },
    });

    await this.webhooks.deliver({
      tenantId,
      sourceSystem: payment.charge.sourceSystem,
      eventType: 'payment.payment.refunded',
      payload: this.webhooks.buildPayload({
        event: 'payment.payment.refunded',
        chargeId: payment.chargeId,
        paymentId: payment.id,
        sourceSystem: payment.charge.sourceSystem,
        externalReference: payment.charge.externalReference,
        provider: payment.provider,
        status: 'REFUNDED',
        amount,
      }),
    });

    this.metrics.increment('refunds_total', { provider: payment.provider });

    return {
      refund,
      payment: toPaymentResponse({ ...payment, status: 'REFUNDED' }),
    };
  }

  async capture(
    tenantId: string,
    paymentId: string,
    requestedBy: string,
    dto: CapturePaymentDto,
  ) {
    const payment = await this.loadPaymentWithCharge(tenantId, paymentId);
    if (payment.status !== 'AUTHORIZED' && payment.status !== 'PENDING') {
      throw new BadRequestException('Captura disponível apenas para pagamentos autorizados');
    }
    if (!payment.charge.providerChargeId) {
      throw new BadRequestException('Charge sem referência no provider');
    }

    const credentials = await this.resolveCredentials(tenantId, payment);
    const provider = this.providerFactory.getProvider(payment.provider);
    if (!provider.capturePayment) {
      throw new BadRequestException(`Provider ${payment.provider} não suporta captura`);
    }

    const amount = dto.amount ?? decimalToNumber(payment.grossAmount);
    const result = await provider.capturePayment({
      providerChargeId: payment.charge.providerChargeId,
      amount,
      credentials: credentials ?? undefined,
    });

    const updatedPayment = await this.prisma.db.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        confirmedAt: new Date(),
        paidAt: new Date(),
        rawProviderPayload: result.rawPayload as object,
      },
    });
    await this.prisma.db.charge.update({
      where: { id: payment.chargeId },
      data: {
        status: result.status as never,
        rawProviderPayload: result.rawPayload as object,
      },
    });

    await this.providerRequests.log({
      tenantId,
      provider: payment.provider,
      operation: 'capturePayment',
      chargeId: payment.chargeId,
      paymentId: payment.id,
      requestPayload: dto,
      responsePayload: result,
      status: 'SUCCESS',
      httpStatus: 200,
    });

    await this.audit.log({
      tenantId,
      actor: requestedBy,
      action: 'payment.captured',
      resourceType: 'payment',
      resourceId: payment.id,
      metadata: { amount },
    });

    await this.webhooks.deliver({
      tenantId,
      sourceSystem: payment.charge.sourceSystem,
      eventType: 'payment.payment.captured',
      payload: this.webhooks.buildPayload({
        event: 'payment.payment.captured',
        chargeId: payment.chargeId,
        paymentId: payment.id,
        sourceSystem: payment.charge.sourceSystem,
        externalReference: payment.charge.externalReference,
        provider: payment.provider,
        status: updatedPayment.status,
        amount,
      }),
    });

    return { payment: toPaymentResponse(updatedPayment), providerResult: result };
  }

  async voidPayment(tenantId: string, paymentId: string, requestedBy: string) {
    const payment = await this.loadPaymentWithCharge(tenantId, paymentId);
    if (!payment.charge.providerChargeId) {
      throw new BadRequestException('Charge sem referência no provider');
    }

    const credentials = await this.resolveCredentials(tenantId, payment);
    const provider = this.providerFactory.getProvider(payment.provider);
    const result = await provider.cancelCharge({
      providerChargeId: payment.charge.providerChargeId,
      credentials: credentials ?? undefined,
    });

    const updatedPayment = await this.prisma.db.payment.update({
      where: { id: payment.id },
      data: { status: 'CANCELLED' },
    });
    await this.prisma.db.charge.update({
      where: { id: payment.chargeId },
      data: { status: 'CANCELLED', rawProviderPayload: result.rawPayload as object },
    });

    await this.providerRequests.log({
      tenantId,
      provider: payment.provider,
      operation: 'voidPayment',
      chargeId: payment.chargeId,
      paymentId: payment.id,
      responsePayload: result,
      status: 'SUCCESS',
      httpStatus: 200,
    });

    await this.audit.log({
      tenantId,
      actor: requestedBy,
      action: 'payment.voided',
      resourceType: 'payment',
      resourceId: payment.id,
    });

    return { payment: toPaymentResponse(updatedPayment), providerResult: result };
  }

  private async loadPaymentWithCharge(tenantId: string, paymentId: string) {
    const payment = await this.prisma.db.payment.findFirst({
      where: { id: paymentId, charge: { tenantId } },
      include: { charge: true },
    });
    if (!payment) throw new NotFoundException('Payment não encontrado');
    return payment;
  }

  private async resolveCredentials(
    tenantId: string,
    payment: {
      provider: ProviderType;
      charge: { merchantId: string; providerAccountId: string | null };
    },
  ) {
    const account = payment.charge.providerAccountId
      ? await this.prisma.db.providerAccount.findUnique({
          where: { id: payment.charge.providerAccountId },
        })
      : await this.providerAccounts.getActiveAccount(
          tenantId,
          payment.charge.merchantId,
          payment.provider,
        );
    return this.providerAccounts.resolveCredentials(payment.provider, account);
  }
}
