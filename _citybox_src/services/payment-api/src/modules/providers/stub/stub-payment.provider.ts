import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
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

@Injectable()
export class StubPaymentProvider implements PaymentProvider {
  async createCustomer(input: CreateProviderCustomerInput): Promise<ProviderCustomerResult> {
    return {
      providerCustomerId: `stub_cus_${input.cpfCnpj}`,
      rawPayload: { stub: true, input },
    };
  }

  async createCharge(input: CreateProviderChargeInput): Promise<ProviderChargeResult> {
    const id = `stub_pay_${randomUUID()}`;
    const expiresAt = input.expiresAt ?? new Date(Date.now() + 3_600_000).toISOString();
    return {
      providerChargeId: id,
      providerOrderId: `stub_ord_${randomUUID()}`,
      status: 'WAITING_PAYMENT',
      paymentUrl: `https://pay.stub.citybox.dev/${id}`,
      pix: input.paymentMethods.includes('PIX')
        ? {
            copyPaste: `00020126580014br.gov.bcb.pix0136${id}`,
            qrCodeUrl: `https://pay.stub.citybox.dev/qr/${id}`,
            expiresAt,
          }
        : undefined,
      boleto: input.paymentMethods.includes('BOLETO')
        ? {
            digitableLine: '23793.38128 60000.000003 00000.000400 1 84340000010000',
            barcode: '2379184340000010000',
            bankSlipUrl: `https://pay.stub.citybox.dev/boleto/${id}`,
          }
        : undefined,
      checkout: input.paymentMethods.includes('CREDIT_CARD')
        ? { url: `https://pay.stub.citybox.dev/checkout/${id}` }
        : undefined,
      rawPayload: { stub: true, input },
    };
  }

  async getCharge(input: GetProviderChargeInput): Promise<ProviderChargeResult> {
    return {
      providerChargeId: input.providerChargeId,
      status: 'WAITING_PAYMENT',
      paymentUrl: `https://pay.stub.citybox.dev/${input.providerChargeId}`,
      rawPayload: { stub: true },
    };
  }

  async cancelCharge(input: CancelProviderChargeInput): Promise<ProviderCancelResult> {
    return { status: 'CANCELLED', rawPayload: { stub: true, input } };
  }

  async refundPayment(input: RefundProviderPaymentInput): Promise<ProviderRefundResult> {
    return {
      providerRefundId: `stub_ref_${randomUUID()}`,
      status: 'REFUNDED',
      rawPayload: { stub: true, input },
    };
  }

  async parseWebhook(input: ProviderWebhookInput): Promise<NormalizedProviderEvent> {
    return {
      eventType: 'payment.received',
      eventId: randomUUID(),
      status: 'PAID',
      rawPayload: input.rawBody,
    };
  }
}
