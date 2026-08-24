import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  PAYMENT_GATEWAY,
  PaymentGateway,
} from '../../../domain/providers/payment-gateway.interface';
import { PaymentGatewayWebhookEventRepository } from '../../../domain/repositories/payment-gateway-webhook-event.repository.interface';
import { PaymentGatewayWebhookEvent } from '../../../domain/entities/payment-gateway-webhook-event.entity';

export interface ReceiveAsaasWebhookInput {
  body: any;
  signatureHeader?: string;
}

export interface ReceiveAsaasWebhookOutput {
  success: boolean;
  duplicate: boolean;
}

@Injectable()
export class ReceiveAsaasWebhookUseCase implements IUseCase<
  ReceiveAsaasWebhookInput,
  ReceiveAsaasWebhookOutput
> {
  private readonly logger = new Logger(ReceiveAsaasWebhookUseCase.name);

  constructor(
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,
    private readonly webhookEventRepository: PaymentGatewayWebhookEventRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    input: ReceiveAsaasWebhookInput,
  ): Promise<ReceiveAsaasWebhookOutput> {
    const { body, signatureHeader } = input;

    // 1. Verify signature
    // This will throw InvalidWebhookSignatureError if signature doesn't match expected token
    await this.paymentGateway.receiveWebhook(body, signatureHeader);

    // 2. Validate payload has id
    const gatewayEventId = body?.id;
    if (!gatewayEventId) {
      this.logger.error('Received webhook payload without a top-level id');
      return { success: false, duplicate: false };
    }

    // 3. Check for duplicates (Idempotency)
    const existingEvent =
      await this.webhookEventRepository.findByGatewayEventId(gatewayEventId);

    if (existingEvent) {
      this.logger.warn(
        `Webhook event ${gatewayEventId} already registered. Skipping.`,
      );
      return { success: true, duplicate: true };
    }

    // 4. Register the new event as PENDING
    const webhookEvent = PaymentGatewayWebhookEvent.create({
      gatewayEventId,
      provider: 'asaas',
      eventType: body.event,
      payload: body,
    });

    await this.webhookEventRepository.save(webhookEvent);

    this.logger.log(
      `Webhook event ${gatewayEventId} (${body.event}) registered. Queueing for async processing.`,
    );

    // 5. Add to queue asynchronously by emitting event
    this.eventEmitter.emit('payment-gateway.webhook.received', {
      webhookEventId: webhookEvent.id,
    });

    return { success: true, duplicate: false };
  }
}
