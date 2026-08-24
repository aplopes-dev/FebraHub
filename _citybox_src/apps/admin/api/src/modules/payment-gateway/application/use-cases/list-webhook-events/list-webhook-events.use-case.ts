import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PaymentGatewayWebhookEventRepository } from '../../../domain/repositories/payment-gateway-webhook-event.repository.interface';
import { PaymentGatewayWebhookEvent } from '../../../domain/entities/payment-gateway-webhook-event.entity';

export interface ListWebhookEventsDto {
  page?: number;
  perPage?: number;
}

export interface ListWebhookEventsResult {
  events: PaymentGatewayWebhookEvent[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

@Injectable()
export class ListWebhookEventsUseCase implements IUseCase<
  ListWebhookEventsDto,
  ListWebhookEventsResult
> {
  constructor(
    private readonly repository: PaymentGatewayWebhookEventRepository,
  ) {}

  async execute({
    page = 1,
    perPage = 20,
  }: ListWebhookEventsDto): Promise<ListWebhookEventsResult> {
    const skip = (page - 1) * perPage;
    const events = await this.repository.findMany({ skip, take: perPage });
    const total = await this.repository.count();

    return {
      events,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }
}
