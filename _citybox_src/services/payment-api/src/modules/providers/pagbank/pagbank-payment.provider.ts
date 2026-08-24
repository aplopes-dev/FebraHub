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
import { createPagBankClient } from './pagbank.client.js';
import { mapPagBankPaymentStatus } from './pagbank-status.mapper.js';
import {
  buildPagBankCustomer,
  findPagBankLink,
  formatPagBankDueDate,
  fromPagBankCents,
  resolvePagBankFlow,
  resolvePagBankPaymentMethods,
  toPagBankCents,
  type PagBankCheckoutResponse,
  type PagBankOrderResponse,
  type PagBankWebhookPayload,
} from './pagbank.types.js';

@Injectable()
export class PagBankPaymentProvider implements PaymentProvider {
  private requireCredentials(input: { credentials?: { apiKey: string; environment: 'SANDBOX' | 'PRODUCTION' } }) {
    if (!input.credentials?.apiKey) {
      throw new BadRequestException('Credenciais PagBank não configuradas');
    }
    return input.credentials;
  }

  async createCustomer(input: CreateProviderCustomerInput): Promise<ProviderCustomerResult> {
    const taxId = input.cpfCnpj.replace(/\D/g, '');
    return {
      providerCustomerId: `pagbank_cus_${taxId}`,
      rawPayload: { embedded: true, customer: buildPagBankCustomer(input) },
    };
  }

  async createCharge(input: CreateProviderChargeInput): Promise<ProviderChargeResult> {
    const credentials = this.requireCredentials(input);
    const client = createPagBankClient(credentials);
    const flow = resolvePagBankFlow(input.paymentMethods);
    const customer = buildPagBankCustomer(input.customer);
    const cents = toPagBankCents(input.amount);
    const itemName = input.description ?? `Cobrança ${input.externalReference}`;

    if (flow === 'CHECKOUT') {
      return this.createCheckoutCharge(client, input, customer, cents, itemName);
    }

    const orderBody: Record<string, unknown> = {
      reference_id: input.externalReference,
      customer,
      items: [
        {
          reference_id: input.externalReference,
          name: itemName.slice(0, 100),
          quantity: 1,
          unit_amount: cents,
        },
      ],
    };

    if (flow === 'PIX') {
      orderBody.qr_codes = [
        {
          amount: { value: cents },
          ...(input.expiresAt ? { expiration_date: input.expiresAt } : {}),
        },
      ];
    }

    if (flow === 'BOLETO') {
      orderBody.charges = [
        {
          reference_id: input.externalReference,
          description: itemName.slice(0, 255),
          amount: { value: cents, currency: 'BRL' },
          payment_method: {
            type: 'BOLETO',
            boleto: {
              due_date: formatPagBankDueDate(input.dueDate, input.expiresAt),
              instruction_lines: {
                line_1: input.description?.slice(0, 75) ?? 'Pagamento via Citybox',
              },
            },
          },
        },
      ];
    }

    const order = await client.request<PagBankOrderResponse>('POST', '/orders', orderBody);
    return this.toChargeResult(order, flow);
  }

  async getCharge(input: GetProviderChargeInput): Promise<ProviderChargeResult> {
    const credentials = this.requireCredentials(input);
    const client = createPagBankClient(credentials);
    const id = input.providerChargeId;
    if (id.startsWith('ORDE_')) {
      const order = await client.request<PagBankOrderResponse>('GET', `/orders/${id}`);
      return this.toChargeResult(order);
    }
    if (id.startsWith('CHEC_')) {
      const checkout = await client.request<PagBankCheckoutResponse>('GET', `/checkouts/${id}`);
      return this.checkoutToChargeResult(checkout);
    }
    const charge = await client.request<PagBankOrderResponse['charges'] extends (infer T)[] ? T : never>(
      'GET',
      `/charges/${id}`,
    );
    return {
      providerChargeId: (charge as { id: string }).id,
      status: mapPagBankPaymentStatus((charge as { status: string }).status),
      rawPayload: charge,
    };
  }

  async cancelCharge(input: CancelProviderChargeInput): Promise<ProviderCancelResult> {
    const credentials = this.requireCredentials(input);
    const client = createPagBankClient(credentials);
    const result = await client.request<{ status?: string }>(
      'POST',
      `/charges/${input.providerChargeId}/cancel`,
    );
    return { status: 'CANCELLED', rawPayload: result };
  }

  async refundPayment(input: RefundProviderPaymentInput): Promise<ProviderRefundResult> {
    const credentials = this.requireCredentials(input);
    const client = createPagBankClient(credentials);
    const body = input.amount ? { amount: { value: toPagBankCents(input.amount) } } : undefined;
    const result = await client.request<{ id?: string; status?: string }>(
      'POST',
      `/charges/${input.providerPaymentId}/cancel`,
      body,
    );
    return {
      providerRefundId: result.id ?? input.providerPaymentId,
      status: 'REFUNDED',
      rawPayload: result,
    };
  }

  async parseWebhook(input: ProviderWebhookInput): Promise<NormalizedProviderEvent> {
    const body = input.rawBody as PagBankWebhookPayload;
    const charge = body.charges?.[0];
    const orderId = body.id;
    const chargeId = charge?.id ?? orderId;
    const status = charge?.status ?? body.status ?? 'WAITING';
    const paidAt = charge?.paid_at;
    const amount = charge?.amount?.value != null ? fromPagBankCents(charge.amount.value) : undefined;

    return {
      eventType: body.event ?? `CHARGE_${status}`,
      eventId: chargeId,
      providerOrderId: orderId,
      providerChargeId: chargeId,
      providerPaymentId: chargeId,
      status: mapPagBankPaymentStatus(status),
      amount,
      paidAt,
      rawPayload: body,
    };
  }

  private async createCheckoutCharge(
    client: ReturnType<typeof createPagBankClient>,
    input: CreateProviderChargeInput,
    customer: ReturnType<typeof buildPagBankCustomer>,
    cents: number,
    itemName: string,
  ): Promise<ProviderChargeResult> {
    const checkout = await client.request<PagBankCheckoutResponse>('POST', '/checkouts', {
      reference_id: input.externalReference,
      customer_modifiable: false,
      customer,
      items: [
        {
          reference_id: input.externalReference,
          name: itemName.slice(0, 100),
          quantity: 1,
          unit_amount: cents,
        },
      ],
      payment_methods: resolvePagBankPaymentMethods(input.paymentMethods),
    });
    return this.checkoutToChargeResult(checkout);
  }

  private toChargeResult(
    order: PagBankOrderResponse,
    flow?: 'PIX' | 'BOLETO' | 'CHECKOUT',
  ): ProviderChargeResult {
    const charge = order.charges?.[0];
    const qr = order.qr_codes?.[0];
    const payLink = findPagBankLink(order.links, 'PAY') ?? findPagBankLink(charge?.links, 'PAY');
    const qrBase64 = findPagBankLink(qr?.links, 'QRCODE.BASE64');

    const result: ProviderChargeResult = {
      providerOrderId: order.id,
      providerChargeId: charge?.id ?? order.id,
      providerPaymentId: charge?.id,
      status: mapPagBankPaymentStatus(charge?.status ?? order.status ?? 'WAITING'),
      paymentUrl: payLink,
      rawPayload: order,
    };

    if (flow === 'PIX' || qr) {
      result.pix = {
        copyPaste: qr?.text,
        qrCodeUrl: qrBase64,
        expiresAt: qr?.expiration_date,
      };
    }

    if (flow === 'BOLETO' || charge?.payment_method?.type === 'BOLETO') {
      const boleto = charge?.payment_method?.boleto;
      result.boleto = {
        digitableLine: boleto?.formatted_barcode,
        barcode: boleto?.barcode,
        bankSlipUrl: findPagBankLink(charge?.links, 'BOLETO.PRINT'),
      };
    }

    if (payLink) {
      result.checkout = { url: payLink };
      result.paymentUrl = payLink;
    }

    return result;
  }

  private checkoutToChargeResult(checkout: PagBankCheckoutResponse): ProviderChargeResult {
    const payLink = findPagBankLink(checkout.links, 'PAY');
    return {
      providerOrderId: checkout.id,
      providerChargeId: checkout.id,
      status: mapPagBankPaymentStatus(checkout.status ?? 'WAITING'),
      paymentUrl: payLink,
      checkout: payLink ? { url: payLink } : undefined,
      rawPayload: checkout,
    };
  }
}
