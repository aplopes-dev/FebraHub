import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ListWebhookEventsUseCase } from '../../../../application/use-cases/list-webhook-events/list-webhook-events.use-case';
import { GetGatewayStatsUseCase } from '../../../../application/use-cases/get-gateway-stats/get-gateway-stats.use-case';
import { PaymentGatewayWebhookEventRepository } from '../../../../domain/repositories/payment-gateway-webhook-event.repository.interface';
import { ListWebhookEventsQueryDto } from './list-webhook-events.query';

@ApiTags('payment-gateway')
@Controller('v1/payment-gateway')
@RequirePermission('platform.admin')
export class PaymentGatewayEventsRoute {
  constructor(
    private readonly listWebhookEvents: ListWebhookEventsUseCase,
    private readonly getGatewayStats: GetGatewayStatsUseCase,
    private readonly paymentGatewayWebhookEventRepository: PaymentGatewayWebhookEventRepository,
  ) {}

  @Get('webhook-events')
  @ApiOperation({ summary: 'Listar eventos de webhook do gateway' })
  async listEvents(@Query() query: ListWebhookEventsQueryDto) {
    const result = await this.listWebhookEvents.execute({
      page: query.page,
      perPage: query.perPage,
    });

    const customerIds = result.events
      .map(
        (event) =>
          event.payload?.customer ||
          event.payload?.payment?.customer ||
          event.payload?.subscription?.customer,
      )
      .filter((id): id is string => typeof id === 'string');

    const clientNamesMap =
      await this.paymentGatewayWebhookEventRepository.getClientNamesByGatewayCustomerIds(
        customerIds,
      );

    return {
      events: result.events.map((event) => {
        const customerId =
          event.payload?.customer ||
          event.payload?.payment?.customer ||
          event.payload?.subscription?.customer;
        const clientInfo = customerId ? clientNamesMap[customerId] : null;
        return {
          id: event.id,
          gatewayEventId: event.gatewayEventId,
          provider: event.provider,
          eventType: event.eventType,
          payload: event.payload,
          status: event.status,
          processedAt: event.processedAt?.toISOString() ?? null,
          errorMessage: event.errorMessage ?? null,
          createdAt: event.createdAt?.toISOString() ?? new Date().toISOString(),
          updatedAt: event.updatedAt?.toISOString() ?? new Date().toISOString(),
          clientName: clientInfo?.name ?? null,
          clientId: clientInfo?.id ?? null,
        };
      }),
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas de eventos do gateway' })
  async getStats() {
    const stats = await this.getGatewayStats.execute();
    return {
      processedCount: stats.processedCount,
      failedCount: stats.failedCount,
      pendingCount: stats.pendingCount,
      totalCount: stats.totalCount,
      lastEventCreatedAt: stats.lastEventCreatedAt?.toISOString() ?? null,
    };
  }
}
