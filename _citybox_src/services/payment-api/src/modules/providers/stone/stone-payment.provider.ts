import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  CancelProviderChargeInput,
  CaptureProviderPaymentInput,
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
import { createStoneClient } from './stone.client.js';
import { createStoneOpenBankClient } from './stone-openbank.client.js';
import { mapStoneChargeStatus } from './stone-status.mapper.js';
import {
  buildStonePosDeepLink,
  fromStoneCents,
  isStoneCardFlow,
  isStonePixFlow,
  isStonePosFlow,
  readStoneCardMetadata,
  readStoneOpenBankAccountId,
  resolveStoneChannel,
  toStoneCents,
  type StoneChargeResponse,
} from './stone.types.js';

@Injectable()
export class StonePaymentProvider implements PaymentProvider {
  private requireCredentials(input: { credentials?: { apiKey: string; environment: 'SANDBOX' | 'PRODUCTION' } }) {
    if (!input.credentials?.apiKey) {
      throw new BadRequestException('Credenciais Stone não configuradas');
    }
    return input.credentials;
  }

  async createCustomer(input: CreateProviderCustomerInput): Promise<ProviderCustomerResult> {
    const taxId = input.cpfCnpj.replace(/\D/g, '');
    return {
      providerCustomerId: `stone_cus_${taxId}`,
      rawPayload: { embedded: true, customer: input },
    };
  }

  async createCharge(input: CreateProviderChargeInput): Promise<ProviderChargeResult> {
    const credentials = this.requireCredentials(input);
    const amountCents = toStoneCents(input.amount);

    if (isStonePosFlow(input.paymentMethods)) {
      const channel = resolveStoneChannel(input.paymentMethods);
      const chargeId = input.externalReference;
      return {
        providerChargeId: chargeId,
        providerOrderId: input.externalReference,
        status: 'WAITING_PAYMENT',
        stonePos: {
          chargeId,
          channel,
          amountCents,
          deepLink: buildStonePosDeepLink({ chargeId, amountCents }),
          instructions:
            'Inicie a venda no terminal Stone (TEF/POS/SmartPOS) ou app TapPhone com a referência informada.',
        },
        rawPayload: {
          flow: 'STONE_POS',
          channel,
          reference_id: input.externalReference,
          amount: amountCents,
        },
      };
    }

    if (isStonePixFlow(input.paymentMethods)) {
      return this.createPixCharge(input, credentials, amountCents);
    }

    if (isStoneCardFlow(input.paymentMethods)) {
      return this.createCardCharge(input, credentials, amountCents);
    }

    throw new BadRequestException(
      'Stone: informe paymentMethods PIX, CREDIT_CARD/DEBIT_CARD ou STONE_POS/TEF/SMARTPOS',
    );
  }

  async getCharge(input: GetProviderChargeInput): Promise<ProviderChargeResult> {
    const credentials = this.requireCredentials(input);
    const client = createStoneClient(credentials);
    const charge = await client.getCharge(input.providerChargeId);
    return this.toChargeResult(charge, input.externalReference);
  }

  async capturePayment(input: CaptureProviderPaymentInput): Promise<ProviderChargeResult> {
    const credentials = this.requireCredentials(input);
    const client = createStoneClient(credentials);
    const amount = input.amount ? toStoneCents(input.amount) : undefined;
    const charge = await client.captureCharge(
      input.providerChargeId,
      amount ?? 1,
    );
    return this.toChargeResult(charge);
  }

  async cancelCharge(input: CancelProviderChargeInput): Promise<ProviderCancelResult> {
    const credentials = this.requireCredentials(input);
    const client = createStoneClient(credentials);
    const charge = await client.cancelCharge(input.providerChargeId);
    return {
      status: mapStoneChargeStatus(charge.status),
      rawPayload: charge,
    };
  }

  async refundPayment(input: RefundProviderPaymentInput): Promise<ProviderRefundResult> {
    const credentials = this.requireCredentials(input);
    const client = createStoneClient(credentials);
    const charge = await client.cancelCharge(input.providerPaymentId);
    return {
      providerRefundId: charge.id ?? input.providerPaymentId,
      status: 'REFUNDED',
      rawPayload: charge,
    };
  }

  async parseWebhook(input: ProviderWebhookInput): Promise<NormalizedProviderEvent> {
    const payload = input.rawBody as {
      id?: string;
      charge_id?: string;
      event?: string;
      type?: string;
      status?: string;
      amount?: number;
      reference_id?: string;
    };
    const eventType = String(payload.event ?? payload.type ?? 'charge.updated');
    const status = mapStoneChargeStatus(payload.status);
    const providerChargeId = payload.charge_id ?? payload.id;
    return {
      eventType,
      eventId: payload.id,
      providerChargeId,
      providerOrderId: payload.reference_id,
      providerPaymentId: payload.id,
      status,
      amount: payload.amount ? fromStoneCents(payload.amount) : undefined,
      paidAt: ['CAPTURED', 'PAID'].includes(status) ? new Date().toISOString() : undefined,
      rawPayload: payload,
    };
  }

  private async createPixCharge(
    input: CreateProviderChargeInput,
    credentials: { apiKey: string; environment: 'SANDBOX' | 'PRODUCTION' },
    amountCents: number,
  ): Promise<ProviderChargeResult> {
    const accountId = readStoneOpenBankAccountId(input.metadata);
    if (!accountId) {
      throw new BadRequestException(
        'Stone Pix requer stoneOpenBankAccountId em metadata ou STONE_OPENBANK_ACCOUNT_ID',
      );
    }

    const openBank = createStoneOpenBankClient(credentials);
    const pix = await openBank.createDynamicPixQr({
      accountId,
      amount: input.amount,
      externalReference: input.externalReference,
      description: input.description,
    });

    const copyPaste = pix.qr_code?.content ?? pix.qRCode?.content;
    return {
      providerChargeId: pix.id ?? pix.transaction_id ?? input.externalReference,
      providerOrderId: input.externalReference,
      status: mapStoneChargeStatus(pix.status),
      pix: copyPaste
        ? {
            copyPaste,
            qrCodeUrl: pix.qr_code?.image,
            expiresAt: undefined,
          }
        : undefined,
      rawPayload: pix,
    };
  }

  private async createCardCharge(
    input: CreateProviderChargeInput,
    credentials: { apiKey: string; environment: 'SANDBOX' | 'PRODUCTION' },
    amountCents: number,
  ): Promise<ProviderChargeResult> {
    const card = readStoneCardMetadata(input.metadata);
    if (!card) {
      throw new BadRequestException(
        'Stone cartão requer metadata.stoneCard com token e expirationDate (PCI — sem PAN/CVV persistido)',
      );
    }

    const client = createStoneClient(credentials);
    const operationType = card.operationType ?? 'auth_and_capture';
    const charge = await client.createCharge({
      amount: amountCents,
      payment_method: 'card',
      initiator_id: input.externalReference.slice(0, 123),
      reference_id: input.externalReference.slice(0, 128),
      local_datetime: new Date().toISOString(),
      channel: resolveStoneChannel(input.paymentMethods),
      card_transaction: {
        type: card.type ?? 'credit',
        operation_type: operationType,
        card: {
          entry_mode: 'manual',
          expiration_date: card.expirationDate,
          number: card.token,
          ...(card.cvv ? { cvv: card.cvv } : {}),
        },
      },
      customer: {
        name: input.customer.name,
        document: input.customer.cpfCnpj.replace(/\D/g, ''),
        email: input.customer.email,
        phone: input.customer.phone,
      },
    });

    return this.toChargeResult(charge, input.externalReference);
  }

  private toChargeResult(charge: StoneChargeResponse, externalReference?: string): ProviderChargeResult {
    const status = mapStoneChargeStatus(charge.status ?? charge.card_transaction?.status);
    const providerChargeId = charge.id ?? externalReference ?? charge.reference_id ?? 'unknown';
    return {
      providerChargeId,
      providerOrderId: charge.reference_id ?? externalReference,
      providerPaymentId: charge.card_transaction?.transaction_id,
      status,
      rawPayload: charge,
    };
  }
}
