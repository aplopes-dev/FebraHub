import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { PaymentGatewayWebhookEventRepository } from '../../domain/repositories/payment-gateway-webhook-event.repository.interface';
import {
  PaymentGatewayWebhookEvent,
  WebhookEventStatus,
} from '../../domain/entities/payment-gateway-webhook-event.entity';

@Injectable()
export class PrismaPaymentGatewayWebhookEventRepository extends PaymentGatewayWebhookEventRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<PaymentGatewayWebhookEvent | null> {
    const row = await this.prisma.paymentGatewayWebhookEvent.findUnique({
      where: { id },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByGatewayEventId(
    gatewayEventId: string,
  ): Promise<PaymentGatewayWebhookEvent | null> {
    const row = await this.prisma.paymentGatewayWebhookEvent.findUnique({
      where: { gatewayEventId },
    });
    return row ? this.toEntity(row) : null;
  }

  async save(
    event: PaymentGatewayWebhookEvent,
  ): Promise<PaymentGatewayWebhookEvent> {
    const row = await this.prisma.paymentGatewayWebhookEvent.upsert({
      where: { id: event.id },
      create: {
        id: event.id,
        gatewayEventId: event.gatewayEventId,
        provider: event.provider,
        eventType: event.eventType,
        payload: event.payload ?? {},
        status: event.status,
        processedAt: event.processedAt,
        errorMessage: event.errorMessage,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      },
      update: {
        status: event.status,
        processedAt: event.processedAt,
        errorMessage: event.errorMessage,
        updatedAt: event.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  private toEntity(row: {
    id: string;
    gatewayEventId: string;
    provider: string;
    eventType: string;
    payload: any;
    status: string;
    processedAt: Date | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PaymentGatewayWebhookEvent {
    return PaymentGatewayWebhookEvent.with(
      {
        gatewayEventId: row.gatewayEventId,
        provider: row.provider,
        eventType: row.eventType,
        payload: row.payload,
        status: row.status as WebhookEventStatus,
        processedAt: row.processedAt,
        errorMessage: row.errorMessage,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  async findMany(params: {
    skip?: number;
    take?: number;
  }): Promise<PaymentGatewayWebhookEvent[]> {
    const rows = await this.prisma.paymentGatewayWebhookEvent.findMany({
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async count(): Promise<number> {
    return this.prisma.paymentGatewayWebhookEvent.count();
  }

  async getStats(): Promise<{
    processedCount: number;
    failedCount: number;
    pendingCount: number;
    totalCount: number;
    lastEventCreatedAt: Date | null;
  }> {
    const counts = await this.prisma.paymentGatewayWebhookEvent.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const lastEvent = await this.prisma.paymentGatewayWebhookEvent.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    let processedCount = 0;
    let failedCount = 0;
    let pendingCount = 0;
    let totalCount = 0;

    for (const item of counts) {
      const count = item._count.id;
      totalCount += count;
      if (item.status === 'PROCESSED') processedCount = count;
      else if (item.status === 'FAILED') failedCount = count;
      else if (item.status === 'PENDING') pendingCount = count;
    }

    return {
      processedCount,
      failedCount,
      pendingCount,
      totalCount,
      lastEventCreatedAt: lastEvent?.createdAt ?? null,
    };
  }

  async getClientNamesByGatewayCustomerIds(
    gatewayCustomerIds: string[],
  ): Promise<Record<string, { id: string; name: string }>> {
    if (gatewayCustomerIds.length === 0) return {};

    // O `gatewayCustomerId` migrou de `clients` para `stores` na Fase 10.
    const rows = await this.prisma.store.findMany({
      where: {
        gatewayCustomerId: { in: gatewayCustomerIds },
      },
      select: {
        gatewayCustomerId: true,
        id: true,
        tradeName: true,
        responsibleName: true,
      },
    });

    const map: Record<string, { id: string; name: string }> = {};
    for (const row of rows) {
      if (row.gatewayCustomerId) {
        map[row.gatewayCustomerId] = {
          id: row.id,
          name: row.responsibleName ?? row.tradeName,
        };
      }
    }
    return map;
  }
}
