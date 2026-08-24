import { Body, Controller, Headers, HttpCode, Inject, Post, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth/auth.decorators.js';
import { sanitizePciForStorage } from '../../common/security/pci-payload.js';
import { safeCompare } from '../../common/security/safe-compare.js';
import { toJson } from '../../common/utils/prisma-json.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ProviderWebhookProcessor } from './provider-webhook.processor.js';

@ApiTags('provider-webhooks')
@Controller('webhooks/providers')
@Public()
export class ProviderWebhookController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ProviderWebhookProcessor) private readonly processor: ProviderWebhookProcessor,
  ) {}

  @Post('asaas')
  @HttpCode(200)
  async asaas(
    @Body() body: Record<string, unknown>,
    @Headers('asaas-access-token') token?: string,
  ) {
    this.validateAsaasToken(token);
    const eventType = String(body.event ?? 'UNKNOWN');
    const paymentId = (body.payment as { id?: string } | undefined)?.id;

    const duplicate = paymentId
      ? await this.prisma.db.providerWebhookEvent.findFirst({
          where: { provider: 'ASAAS', eventId: paymentId, eventType, status: 'PROCESSED' },
        })
      : null;
    if (duplicate) {
      return { ok: true, duplicate: true };
    }

    const stored = await this.prisma.db.providerWebhookEvent.create({
      data: {
        provider: 'ASAAS',
        eventType,
        eventId: paymentId,
        signatureValid: true,
        rawPayload: sanitizePciForStorage(body) as object,
        headersJson: toJson({ 'asaas-access-token': token ? '[present]' : '[missing]' }),
        status: 'RECEIVED',
      },
    });

    this.processor.enqueue(stored.id);
    return { ok: true, id: stored.id };
  }

  private validateAsaasToken(token?: string) {
    const expected = process.env.ASAAS_WEBHOOK_TOKEN?.trim();
    if (!expected) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('ASAAS_WEBHOOK_TOKEN não configurado');
      }
      return;
    }
    if (!token || !safeCompare(token, expected)) {
      throw new UnauthorizedException('Token de webhook Asaas inválido');
    }
  }

  @Post('pagbank')
  @HttpCode(200)
  async pagbank(
    @Body() body: Record<string, unknown>,
    @Headers('x-authenticity-token') authenticityToken?: string,
  ) {
    this.validatePagBankToken(authenticityToken);
    const charge = (body.charges as Array<{ id?: string; status?: string }> | undefined)?.[0];
    const eventType = String(body.event ?? charge?.status ?? 'ORDER_UPDATED');
    const eventRef = charge?.id ?? (body.id as string | undefined);

    const duplicate = eventRef
      ? await this.prisma.db.providerWebhookEvent.findFirst({
          where: { provider: 'PAGBANK', eventId: eventRef, eventType, status: 'PROCESSED' },
        })
      : null;
    if (duplicate) {
      return { ok: true, duplicate: true };
    }

    const stored = await this.prisma.db.providerWebhookEvent.create({
      data: {
        provider: 'PAGBANK',
        eventType,
        eventId: eventRef,
        signatureValid: true,
        rawPayload: sanitizePciForStorage(body) as object,
        headersJson: toJson({
          'x-authenticity-token': authenticityToken ? '[present]' : '[missing]',
        }),
        status: 'RECEIVED',
      },
    });

    this.processor.enqueue(stored.id);
    return { ok: true, id: stored.id };
  }

  private validatePagBankToken(token?: string) {
    const expected = process.env.PAGBANK_WEBHOOK_TOKEN?.trim();
    if (!expected) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('PAGBANK_WEBHOOK_TOKEN não configurado');
      }
      return;
    }
    if (!token || !safeCompare(token, expected)) {
      throw new UnauthorizedException('Token de webhook PagBank inválido');
    }
  }

  @Post('infinitepay')
  @HttpCode(200)
  async infinitepay(
    @Body() body: Record<string, unknown>,
    @Headers('x-infinitepay-token') token?: string,
  ) {
    this.validateInfinitePayToken(token);
    const eventType = body.transaction_nsu ? 'PAYMENT_RECEIVED' : 'PAYMENT_UPDATED';
    const eventRef = String(body.transaction_nsu ?? body.invoice_slug ?? body.order_nsu ?? 'unknown');

    const duplicate = eventRef
      ? await this.prisma.db.providerWebhookEvent.findFirst({
          where: { provider: 'INFINITE_PAY', eventId: eventRef, eventType, status: 'PROCESSED' },
        })
      : null;
    if (duplicate) {
      return { ok: true, duplicate: true };
    }

    const stored = await this.prisma.db.providerWebhookEvent.create({
      data: {
        provider: 'INFINITE_PAY',
        eventType,
        eventId: eventRef,
        signatureValid: true,
        rawPayload: sanitizePciForStorage(body) as object,
        headersJson: toJson({ 'x-infinitepay-token': token ? '[present]' : '[missing]' }),
        status: 'RECEIVED',
      },
    });

    this.processor.enqueue(stored.id);
    return { ok: true, id: stored.id };
  }

  private validateInfinitePayToken(token?: string) {
    const expected = process.env.INFINITEPAY_WEBHOOK_TOKEN?.trim();
    if (!expected) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('INFINITEPAY_WEBHOOK_TOKEN não configurado');
      }
      return;
    }
    if (!token || !safeCompare(token, expected)) {
      throw new UnauthorizedException('Token de webhook InfinitePay inválido');
    }
  }

  @Post('stone')
  @HttpCode(200)
  async stone(
    @Body() body: Record<string, unknown>,
    @Headers('x-stone-signature') signature?: string,
  ) {
    this.validateStoneWebhook(signature);
    const eventType = String(body.event ?? body.type ?? 'charge.updated');
    const eventRef = String(body.id ?? body.charge_id ?? body.reference_id ?? 'unknown');

    const duplicate = eventRef
      ? await this.prisma.db.providerWebhookEvent.findFirst({
          where: { provider: 'STONE', eventId: eventRef, eventType, status: 'PROCESSED' },
        })
      : null;
    if (duplicate) {
      return { ok: true, duplicate: true };
    }

    const stored = await this.prisma.db.providerWebhookEvent.create({
      data: {
        provider: 'STONE',
        eventType,
        eventId: eventRef,
        signatureValid: true,
        rawPayload: sanitizePciForStorage(body) as object,
        headersJson: toJson({ 'x-stone-signature': signature ? '[present]' : '[missing]' }),
        status: 'RECEIVED',
      },
    });

    this.processor.enqueue(stored.id);
    return { ok: true, id: stored.id };
  }

  private validateStoneWebhook(signature?: string) {
    const expected = process.env.STONE_WEBHOOK_TOKEN?.trim();
    if (!expected) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('STONE_WEBHOOK_TOKEN não configurado');
      }
      return;
    }
    if (!signature || !safeCompare(signature, expected)) {
      throw new UnauthorizedException('Assinatura de webhook Stone inválida');
    }
  }
}
