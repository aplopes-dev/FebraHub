import { PaymentGatewayWebhookEvent } from '../domain/entities/payment-gateway-webhook-event.entity';
import { PaymentGatewayWebhookEventRepository } from '../domain/repositories/payment-gateway-webhook-event.repository.interface';

export class InMemoryPaymentGatewayWebhookEventRepository extends PaymentGatewayWebhookEventRepository {
  private items: PaymentGatewayWebhookEvent[] = [];

  async save(
    event: PaymentGatewayWebhookEvent,
  ): Promise<PaymentGatewayWebhookEvent> {
    const index = this.items.findIndex((item) => item.id === event.id);
    if (index >= 0) {
      this.items[index] = event;
    } else {
      this.items.push(event);
    }
    return event;
  }

  async findById(id: string): Promise<PaymentGatewayWebhookEvent | null> {
    const found = this.items.find((item) => item.id === id);
    return found || null;
  }

  async findByGatewayEventId(
    gatewayEventId: string,
  ): Promise<PaymentGatewayWebhookEvent | null> {
    const found = this.items.find(
      (item) => item.gatewayEventId === gatewayEventId,
    );
    return found || null;
  }

  async findMany(params: {
    skip?: number;
    take?: number;
  }): Promise<PaymentGatewayWebhookEvent[]> {
    let result = [...this.items].sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
    );
    if (params.skip !== undefined) {
      result = result.slice(params.skip);
    }
    if (params.take !== undefined) {
      result = result.slice(0, params.take);
    }
    return result;
  }

  async count(): Promise<number> {
    return this.items.length;
  }

  async getStats(): Promise<{
    processedCount: number;
    failedCount: number;
    pendingCount: number;
    totalCount: number;
    lastEventCreatedAt: Date | null;
  }> {
    let processedCount = 0;
    let failedCount = 0;
    let pendingCount = 0;
    const totalCount = this.items.length;

    for (const item of this.items) {
      if (item.status === 'PROCESSED') processedCount++;
      else if (item.status === 'FAILED') failedCount++;
      else if (item.status === 'PENDING') pendingCount++;
    }

    const lastEvent = [...this.items].sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
    )[0];

    return {
      processedCount,
      failedCount,
      pendingCount,
      totalCount,
      lastEventCreatedAt: lastEvent ? (lastEvent.createdAt ?? null) : null,
    };
  }

  async getClientNamesByGatewayCustomerIds(
    gatewayCustomerIds: string[],
  ): Promise<Record<string, { id: string; name: string }>> {
    return {};
  }
}
