import { BadRequestException, Injectable } from '@nestjs/common';

export type InternalPaymentWebhookPayload = {
  event: string;
  eventId: string;
  chargeId?: string;
  paymentId?: string;
  sourceSystem: string;
  externalReference: string;
  provider: string;
  status: string;
  amount?: number;
  netAmount?: number;
  paidAt?: string;
  availableAt?: string;
  settlementId?: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class OrderPaymentSyncService {
  handleInternalWebhook(eventType: string, payload: InternalPaymentWebhookPayload) {
    if (!payload.externalReference) {
      throw new BadRequestException('externalReference ausente no payload');
    }
    return { status: 'received', eventType, eventId: payload.eventId };
  }
}
