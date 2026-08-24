import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CancelProviderSubscriptionInput,
  CreateProviderSubscriptionInput,
  ProviderSubscriptionResult,
  SubscriptionProvider,
  UpdateProviderSubscriptionInput,
} from '../subscription-provider.interface.js';

@Injectable()
export class StubSubscriptionProvider implements SubscriptionProvider {
  async createSubscription(input: CreateProviderSubscriptionInput): Promise<ProviderSubscriptionResult> {
    const id = `stub_sub_${randomUUID()}`;
    return {
      providerSubscriptionId: id,
      status: 'ACTIVE',
      nextDueDate: input.nextDueDate,
      rawPayload: { stub: true, input },
    };
  }

  async updateSubscription(input: UpdateProviderSubscriptionInput): Promise<ProviderSubscriptionResult> {
    return {
      providerSubscriptionId: input.providerSubscriptionId,
      status: input.status === 'INACTIVE' ? 'PAUSED' : 'ACTIVE',
      nextDueDate: input.nextDueDate,
      rawPayload: { stub: true, input },
    };
  }

  async cancelSubscription(input: CancelProviderSubscriptionInput): Promise<ProviderSubscriptionResult> {
    return {
      providerSubscriptionId: input.providerSubscriptionId,
      status: 'CANCELLED',
      rawPayload: { stub: true, input },
    };
  }
}
