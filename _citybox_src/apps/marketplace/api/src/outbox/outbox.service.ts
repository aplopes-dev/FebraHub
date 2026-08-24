import { Injectable } from '@nestjs/common';
import { createCloudEvent } from '@citybox/messaging';
import type { TenantPrisma } from '../database/tenant.js';

@Injectable()
export class OutboxService {
  async enqueue(
    client: TenantPrisma,
    params: { type: string; data: unknown; storeId?: string },
  ) {
    const event = createCloudEvent({
      type: params.type,
      source: 'citybox://core-api',
      data: params.data,
      storeId: params.storeId,
    });
    return client.outboxEvent.create({
      data: { type: params.type, payload: JSON.parse(JSON.stringify(event)), status: 'PENDING' },
    });
  }
}
