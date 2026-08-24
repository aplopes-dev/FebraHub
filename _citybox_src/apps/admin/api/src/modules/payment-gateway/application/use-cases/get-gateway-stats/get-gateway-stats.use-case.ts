import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PaymentGatewayWebhookEventRepository } from '../../../domain/repositories/payment-gateway-webhook-event.repository.interface';

export interface GetGatewayStatsResult {
  processedCount: number;
  failedCount: number;
  pendingCount: number;
  totalCount: number;
  lastEventCreatedAt: Date | null;
}

@Injectable()
export class GetGatewayStatsUseCase implements IUseCase<
  void,
  GetGatewayStatsResult
> {
  constructor(
    private readonly repository: PaymentGatewayWebhookEventRepository,
  ) {}

  async execute(): Promise<GetGatewayStatsResult> {
    return this.repository.getStats();
  }
}
