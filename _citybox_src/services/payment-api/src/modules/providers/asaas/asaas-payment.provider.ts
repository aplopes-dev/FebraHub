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
import { createAsaasClient } from './asaas.client.js';
import {
  formatAsaasDueDate,
  resolveAsaasBillingType,
  type AsaasPaymentResponse,
  type AsaasPixQrCodeResponse,
  type AsaasWebhookPayload,
} from './asaas.types.js';
import { mapAsaasPaymentStatus } from './asaas-status.mapper.js';
import {
  isAsaasSubscriptionEvent,
  mapAsaasSubscriptionStatus,
} from './asaas-subscription.mapper.js';
import { buildAsaasSplitPayload } from './asaas-split.mapper.js';

@Injectable()
export class AsaasPaymentProvider implements PaymentProvider {
  private requireCredentials(input: { credentials?: { apiKey: string; environment: 'SANDBOX' | 'PRODUCTION' } }) {
    if (!input.credentials?.apiKey) {
      throw new BadRequestException('Credenciais Asaas não configuradas');
    }
    return input.credentials;
  }

  async createCustomer(input: CreateProviderCustomerInput): Promise<ProviderCustomerResult> {
    const credentials = this.requireCredentials(input);
    const client = createAsaasClient(credentials);
    const payload = await client.request<{ id: string }>('POST', '/customers', {
      name: input.name,
      cpfCnpj: input.cpfCnpj.replace(/\D/g, ''),
      email: input.email,
      mobilePhone: input.phone?.replace(/\D/g, ''),
    });
    return { providerCustomerId: payload.id, rawPayload: payload };
  }

  async createCharge(input: CreateProviderChargeInput): Promise<ProviderChargeResult> {
    const credentials = this.requireCredentials(input);
    const client = createAsaasClient(credentials);
    let customerId = input.providerCustomerId;
    if (!customerId) {
      const customer = await this.createCustomer({ ...input.customer, credentials });
      customerId = customer.providerCustomerId;
    }

    const billingType = resolveAsaasBillingType(input.paymentMethods);
    const splitPayload = input.splitRules?.length
      ? buildAsaasSplitPayload(input.splitRules)
      : undefined;

    const payment = await client.request<AsaasPaymentResponse>('POST', '/payments', {
      customer: customerId,
      billingType,
      value: input.amount,
      dueDate: formatAsaasDueDate(input.dueDate, input.expiresAt),
      description: input.description,
      externalReference: input.externalReference,
      ...(splitPayload?.length ? { split: splitPayload } : {}),
    });

    const result = this.toChargeResult(payment);

    if (billingType === 'PIX') {
      const pix = await client.request<AsaasPixQrCodeResponse>(
        'GET',
        `/payments/${payment.id}/pixQrCode`,
      );
      result.pix = {
        copyPaste: pix.payload,
        qrCodeUrl: pix.encodedImage ? `data:image/png;base64,${pix.encodedImage}` : undefined,
        expiresAt: pix.expirationDate,
      };
    }

    if (billingType === 'BOLETO') {
      result.boleto = {
        bankSlipUrl: payment.bankSlipUrl ?? payment.invoiceUrl,
        digitableLine: payment.invoiceUrl,
      };
    }

    if (billingType === 'CREDIT_CARD' || billingType === 'UNDEFINED') {
      result.checkout = { url: payment.invoiceUrl };
      result.paymentUrl = payment.invoiceUrl;
    }

    return result;
  }

  async getCharge(input: GetProviderChargeInput): Promise<ProviderChargeResult> {
    const credentials = this.requireCredentials(input);
    const client = createAsaasClient(credentials);
    const payment = await client.request<AsaasPaymentResponse>('GET', `/payments/${input.providerChargeId}`);
    return this.toChargeResult(payment);
  }

  async cancelCharge(input: CancelProviderChargeInput): Promise<ProviderCancelResult> {
    const credentials = this.requireCredentials(input);
    const client = createAsaasClient(credentials);
    const payment = await client.request<AsaasPaymentResponse>(
      'DELETE',
      `/payments/${input.providerChargeId}`,
    );
    return { status: 'CANCELLED', rawPayload: payment };
  }

  async refundPayment(input: RefundProviderPaymentInput): Promise<ProviderRefundResult> {
    const credentials = this.requireCredentials(input);
    const client = createAsaasClient(credentials);
    const refund = await client.request<{ id: string; status?: string }>(
      'POST',
      `/payments/${input.providerPaymentId}/refund`,
      {
        value: input.amount,
        description: input.reason,
      },
    );
    return {
      providerRefundId: refund.id,
      status: 'REFUNDED',
      rawPayload: refund,
    };
  }

  async parseWebhook(input: ProviderWebhookInput): Promise<NormalizedProviderEvent> {
    const body = input.rawBody as AsaasWebhookPayload;
    if (isAsaasSubscriptionEvent(body.event) || body.subscription) {
      const subscription = body.subscription;
      return {
        eventType: body.event,
        eventId: subscription?.id,
        providerSubscriptionId: subscription?.id,
        subscriptionEvent: true,
        status: mapAsaasSubscriptionStatus(subscription?.status ?? body.event),
        amount: subscription?.value,
        nextDueDate: subscription?.nextDueDate,
        rawPayload: body,
      };
    }

    const payment = body.payment;
    return {
      eventType: body.event,
      eventId: payment?.id,
      providerChargeId: payment?.id,
      providerPaymentId: payment?.id,
      providerSubscriptionId: payment?.subscription,
      status: mapAsaasPaymentStatus(payment?.status ?? body.event),
      amount: payment?.value,
      paidAt: payment?.paymentDate ?? payment?.clientPaymentDate,
      rawPayload: body,
    };
  }

  private toChargeResult(payment: AsaasPaymentResponse): ProviderChargeResult {
    return {
      providerChargeId: payment.id,
      providerPaymentId: payment.id,
      status: mapAsaasPaymentStatus(payment.status),
      paymentUrl: payment.invoiceUrl ?? payment.bankSlipUrl,
      rawPayload: payment,
    };
  }
}
