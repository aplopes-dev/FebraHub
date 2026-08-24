import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  CancelProviderSubscriptionInput,
  CreateProviderSubscriptionInput,
  ProviderSubscriptionResult,
  SubscriptionProvider,
  UpdateProviderSubscriptionInput,
} from '../subscription-provider.interface.js';
import { createAsaasClient } from './asaas.client.js';
import {
  formatAsaasDueDate,
  resolveAsaasBillingCycle,
  resolveAsaasPaymentMethod,
  type AsaasSubscriptionResponse,
} from './asaas.types.js';
import { mapAsaasSubscriptionStatus } from './asaas-subscription.mapper.js';
import type { ProviderCredentials } from '../payment-provider.interface.js';

@Injectable()
export class AsaasSubscriptionProvider implements SubscriptionProvider {
  private requireCredentials(input: { credentials?: ProviderCredentials }) {
    if (!input.credentials?.apiKey) {
      throw new BadRequestException('Credenciais Asaas não configuradas');
    }
    return input.credentials;
  }

  async createSubscription(input: CreateProviderSubscriptionInput): Promise<ProviderSubscriptionResult> {
    const credentials = this.requireCredentials(input);
    const client = createAsaasClient(credentials);
    let customerId = input.providerCustomerId;
    if (!customerId) {
      customerId = (
        await client.request<{ id: string }>('POST', '/customers', {
          name: input.customer.name,
          cpfCnpj: input.customer.cpfCnpj.replace(/\D/g, ''),
          email: input.customer.email,
          mobilePhone: input.customer.phone?.replace(/\D/g, ''),
        })
      ).id;
    }

    const subscription = await client.request<AsaasSubscriptionResponse>('POST', '/subscriptions', {
      customer: customerId,
      billingType: resolveAsaasPaymentMethod(input.paymentMethod),
      value: input.amount,
      cycle: resolveAsaasBillingCycle(input.billingCycle),
      nextDueDate: formatAsaasDueDate(input.nextDueDate),
      description: input.description,
      externalReference: input.externalReference,
    });

    return this.toResult(subscription);
  }

  async updateSubscription(input: UpdateProviderSubscriptionInput): Promise<ProviderSubscriptionResult> {
    const credentials = this.requireCredentials(input);
    const client = createAsaasClient(credentials);
    const body: Record<string, string> = {};
    if (input.status) body.status = input.status;
    if (input.nextDueDate) body.nextDueDate = formatAsaasDueDate(input.nextDueDate);

    const subscription = await client.request<AsaasSubscriptionResponse>(
      'PUT',
      `/subscriptions/${input.providerSubscriptionId}`,
      body,
    );
    return this.toResult(subscription);
  }

  async cancelSubscription(input: CancelProviderSubscriptionInput): Promise<ProviderSubscriptionResult> {
    const credentials = this.requireCredentials(input);
    const client = createAsaasClient(credentials);
    const subscription = await client.request<AsaasSubscriptionResponse>(
      'DELETE',
      `/subscriptions/${input.providerSubscriptionId}`,
    );
    return this.toResult({ ...subscription, status: 'CANCELLED' });
  }

  private toResult(subscription: AsaasSubscriptionResponse): ProviderSubscriptionResult {
    return {
      providerSubscriptionId: subscription.id,
      status: mapAsaasSubscriptionStatus(subscription.status ?? 'ACTIVE'),
      nextDueDate: subscription.nextDueDate,
      rawPayload: subscription,
    };
  }
}
