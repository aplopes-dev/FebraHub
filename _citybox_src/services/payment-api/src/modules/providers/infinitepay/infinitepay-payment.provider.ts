import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  CancelProviderChargeInput,
  CreateProviderChargeInput,
  CreateProviderCustomerInput,
  GetProviderChargeInput,
  NormalizedProviderEvent,
  PaymentProvider,
  ProviderCancelResult,
  ProviderChargeResult,
  ProviderCustomerResult,
  ProviderRefundResult,
  ProviderWebhookInput,
  RefundProviderPaymentInput,
} from '../payment-provider.interface.js';
import { createInfinitePayClient } from './infinitepay.client.js';
import { mapInfinitePayWebhookToChargeStatus } from './infinitepay-status.mapper.js';
import {
  buildInfiniteTapDeepLink,
  fromInfinitePayCents,
  isInfiniteTapFlow,
  resolveInfinitePayHandle,
  toInfinitePayCents,
  type InfinitePayWebhookPayload,
} from './infinitepay.types.js';

@Injectable()
export class InfinitePayPaymentProvider implements PaymentProvider {
  private requireCredentials(input: { credentials?: { apiKey: string; environment: 'SANDBOX' | 'PRODUCTION' } }) {
    if (!input.credentials?.apiKey) {
      throw new BadRequestException('Credenciais InfinitePay não configuradas (handle/InfiniteTag)');
    }
    return input.credentials;
  }

  async createCustomer(input: CreateProviderCustomerInput): Promise<ProviderCustomerResult> {
    const taxId = input.cpfCnpj.replace(/\D/g, '');
    return {
      providerCustomerId: `infinitepay_cus_${taxId}`,
      rawPayload: { embedded: true, customer: input },
    };
  }

  async createCharge(input: CreateProviderChargeInput): Promise<ProviderChargeResult> {
    const credentials = this.requireCredentials(input);
    const handle = resolveInfinitePayHandle(credentials);
    const amountCents = toInfinitePayCents(input.amount);
    const orderNsu = input.externalReference;

    if (isInfiniteTapFlow(input.paymentMethods)) {
      return {
        providerChargeId: orderNsu,
        providerOrderId: orderNsu,
        status: 'WAITING_PAYMENT',
        infiniteTap: {
          orderNsu,
          amountCents,
          handle,
          deepLink: buildInfiniteTapDeepLink({ handle, orderNsu, amountCents }),
          instructions:
            'Abra o app InfinitePay no celular do lojista para concluir o pagamento por aproximação (InfiniteTap).',
        },
        rawPayload: {
          flow: 'INFINITE_TAP',
          handle,
          order_nsu: orderNsu,
          amount: amountCents,
        },
      };
    }

    const client = createInfinitePayClient(credentials);
    const webhookUrl = process.env.INFINITEPAY_WEBHOOK_URL?.trim();
    const redirectUrl = process.env.INFINITEPAY_REDIRECT_URL?.trim();

    const link = await client.createLink({
      handle,
      order_nsu: orderNsu,
      redirect_url: redirectUrl,
      webhook_url: webhookUrl,
      items: [
        {
          quantity: 1,
          price: amountCents,
          description: (input.description ?? `Cobrança ${orderNsu}`).slice(0, 255),
        },
      ],
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        phone_number: input.customer.phone,
      },
    });

    const slug = this.extractSlugFromUrl(link.url) ?? link.slug;

    return {
      providerChargeId: slug ?? orderNsu,
      providerOrderId: orderNsu,
      status: 'WAITING_PAYMENT',
      paymentUrl: link.url,
      checkout: { url: link.url },
      rawPayload: { link, slug, order_nsu: orderNsu },
    };
  }

  async getCharge(input: GetProviderChargeInput): Promise<ProviderChargeResult> {
    const credentials = this.requireCredentials(input);
    const client = createInfinitePayClient(credentials);
    const handle = resolveInfinitePayHandle(credentials);

    const orderNsu = input.externalReference ?? input.providerChargeId;
    const slug = input.providerChargeId;

    const check = await client.paymentCheck({
      handle,
      order_nsu: orderNsu,
      slug: slug !== orderNsu ? slug : undefined,
    });

    const status = check.paid ? 'PAID' : 'WAITING_PAYMENT';
    return {
      providerChargeId: slug,
      providerOrderId: orderNsu,
      status,
      rawPayload: check,
    };
  }

  async cancelCharge(input: CancelProviderChargeInput): Promise<ProviderCancelResult> {
    return {
      status: 'CANCELLED',
      rawPayload: {
        note: 'InfinitePay checkout links não suportam cancelamento via API nesta fase',
        providerChargeId: input.providerChargeId,
      },
    };
  }

  async refundPayment(_input: RefundProviderPaymentInput): Promise<ProviderRefundResult> {
    throw new BadRequestException('Estorno InfinitePay não suportado nesta fase — processe no app InfinitePay');
  }

  async parseWebhook(input: ProviderWebhookInput): Promise<NormalizedProviderEvent> {
    const payload = input.rawBody as InfinitePayWebhookPayload;
    const paid = payload.paid_amount !== undefined || payload.transaction_nsu !== undefined;
    const status = mapInfinitePayWebhookToChargeStatus({ paid: true });
    const amount = payload.paid_amount
      ? fromInfinitePayCents(payload.paid_amount)
      : payload.amount
        ? fromInfinitePayCents(payload.amount)
        : undefined;

    return {
      eventType: paid ? 'PAYMENT_RECEIVED' : 'PAYMENT_UPDATED',
      eventId: payload.transaction_nsu ?? payload.invoice_slug,
      providerChargeId: payload.invoice_slug ?? payload.order_nsu,
      providerOrderId: payload.order_nsu,
      providerPaymentId: payload.transaction_nsu,
      status,
      amount,
      paidAt: paid ? new Date().toISOString() : undefined,
      rawPayload: payload,
    };
  }

  private extractSlugFromUrl(url: string): string | undefined {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      return parts.at(-1);
    } catch {
      return undefined;
    }
  }
}

export { mapInfinitePayCaptureMethod } from './infinitepay.types.js';
