import { Injectable } from '@nestjs/common';
import {
  PaymentGateway,
  CreateCustomerGatewayInput,
  UpdateCustomerGatewayInput,
  CreateSubscriptionGatewayInput,
  CreateInvoiceGatewayInput,
} from '../../../domain/providers/payment-gateway.interface';
import { AsaasClient } from './asaas.client';
import { AsaasMapper } from './asaas.mapper';
import {
  AsaasCustomerResponse,
  AsaasSubscriptionResponse,
  AsaasPaymentResponse,
  AsaasPixQrCodeResponse,
  AsaasIdentificationFieldResponse,
  AsaasPaymentListResponse,
} from './types/asaas.types';
import { GatewayCustomer } from '../../../domain/entities/gateway-customer.entity';
import { GatewaySubscription } from '../../../domain/entities/gateway-subscription.entity';
import { GatewayInvoice } from '../../../domain/entities/gateway-invoice.entity';
import { GatewayWebhookEvent } from '../../../domain/entities/gateway-webhook-event.entity';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';
import { InvalidWebhookSignatureError } from '../../../domain/errors/invalid-webhook-signature.error';

@Injectable()
export class AsaasGateway implements PaymentGateway {
  constructor(private readonly client: AsaasClient) {}

  async createCustomer(
    input: CreateCustomerGatewayInput,
  ): Promise<GatewayCustomer> {
    const asaasDto = AsaasMapper.toAsaasCreateCustomer(input);
    const response = await this.client.post<AsaasCustomerResponse>(
      '/customers',
      asaasDto,
    );
    return AsaasMapper.toDomainCustomer(response);
  }

  async updateCustomer(
    gatewayCustomerId: string,
    input: UpdateCustomerGatewayInput,
  ): Promise<GatewayCustomer> {
    const asaasDto = AsaasMapper.toAsaasUpdateCustomer(input);
    const response = await this.client.post<AsaasCustomerResponse>(
      `/customers/${gatewayCustomerId}`,
      asaasDto,
    );
    return AsaasMapper.toDomainCustomer(response);
  }

  async createSubscription(
    input: CreateSubscriptionGatewayInput,
  ): Promise<GatewaySubscription> {
    const asaasDto = AsaasMapper.toAsaasCreateSubscription(input);
    const response = await this.client.post<AsaasSubscriptionResponse>(
      '/subscriptions',
      asaasDto,
    );
    return AsaasMapper.toDomainSubscription(response);
  }

  async cancelSubscription(gatewaySubscriptionId: string): Promise<void> {
    await this.client.delete(`/subscriptions/${gatewaySubscriptionId}`);
  }

  async createInvoice(
    input: CreateInvoiceGatewayInput,
  ): Promise<GatewayInvoice> {
    const asaasDto = AsaasMapper.toAsaasCreatePayment(input);
    const response = await this.client.post<AsaasPaymentResponse>(
      '/payments',
      asaasDto,
    );

    let pixResponse: AsaasPixQrCodeResponse | null = null;
    let barCodeResponse: AsaasIdentificationFieldResponse | null = null;

    if (input.billingType === PaymentMethod.PIX) {
      try {
        pixResponse = await this.client.get<AsaasPixQrCodeResponse>(
          `/payments/${response.id}/pixQrCode`,
        );
      } catch (error) {
        // Handle gracefully
      }
    } else if (input.billingType === PaymentMethod.BOLETO) {
      try {
        barCodeResponse =
          await this.client.get<AsaasIdentificationFieldResponse>(
            `/payments/${response.id}/identificationField`,
          );
      } catch (error) {
        // Handle gracefully
      }
    }

    return AsaasMapper.toDomainInvoice(response, pixResponse, barCodeResponse);
  }

  async cancelInvoice(gatewayPaymentId: string): Promise<void> {
    await this.client.delete(`/payments/${gatewayPaymentId}`);
  }

  async getInvoice(gatewayPaymentId: string): Promise<GatewayInvoice> {
    const response = await this.client.get<AsaasPaymentResponse>(
      `/payments/${gatewayPaymentId}`,
    );

    let pixResponse: AsaasPixQrCodeResponse | null = null;
    let barCodeResponse: AsaasIdentificationFieldResponse | null = null;

    const domainBillingType = AsaasMapper.toDomainPaymentMethod(
      response.billingType,
    );

    if (domainBillingType === PaymentMethod.PIX) {
      try {
        pixResponse = await this.client.get<AsaasPixQrCodeResponse>(
          `/payments/${gatewayPaymentId}/pixQrCode`,
        );
      } catch (error) {
        // Handle gracefully
      }
    } else if (domainBillingType === PaymentMethod.BOLETO) {
      try {
        barCodeResponse =
          await this.client.get<AsaasIdentificationFieldResponse>(
            `/payments/${gatewayPaymentId}/identificationField`,
          );
      } catch (error) {
        // Handle gracefully
      }
    }

    return AsaasMapper.toDomainInvoice(response, pixResponse, barCodeResponse);
  }

  async receiveWebhook(
    body: any,
    signatureHeader?: string,
  ): Promise<GatewayWebhookEvent> {
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
    if (expectedToken && signatureHeader !== expectedToken) {
      throw new InvalidWebhookSignatureError(AsaasGateway.name);
    }
    return AsaasMapper.toDomainWebhookEvent(body);
  }

  async getSubscriptionInvoices(
    gatewaySubscriptionId: string,
  ): Promise<GatewayInvoice[]> {
    const response = await this.client.get<AsaasPaymentListResponse>(
      `/payments?subscription=${gatewaySubscriptionId}`,
    );
    return response.data.map((payment) =>
      AsaasMapper.toDomainInvoice(payment, null, null),
    );
  }
}
