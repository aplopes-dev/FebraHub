import { PaymentGatewayWebhookEvent } from '../entities/payment-gateway-webhook-event.entity';

export abstract class PaymentGatewayWebhookEventRepository {
  abstract save(
    event: PaymentGatewayWebhookEvent,
  ): Promise<PaymentGatewayWebhookEvent>;
  abstract findById(id: string): Promise<PaymentGatewayWebhookEvent | null>;
  abstract findByGatewayEventId(
    gatewayEventId: string,
  ): Promise<PaymentGatewayWebhookEvent | null>;
  abstract findMany(params: {
    skip?: number;
    take?: number;
  }): Promise<PaymentGatewayWebhookEvent[]>;
  abstract count(): Promise<number>;
  abstract getStats(): Promise<{
    processedCount: number;
    failedCount: number;
    pendingCount: number;
    totalCount: number;
    lastEventCreatedAt: Date | null;
  }>;
  abstract getClientNamesByGatewayCustomerIds(
    gatewayCustomerIds: string[],
  ): Promise<Record<string, { id: string; name: string }>>;
}
