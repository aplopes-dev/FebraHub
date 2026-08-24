import { Entity } from '../../../../shared/core/entity';

export enum WebhookEventStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export interface PaymentGatewayWebhookEventProps {
  gatewayEventId: string;
  provider: string;
  eventType: string;
  payload: any;
  status: WebhookEventStatus;
  processedAt?: Date | null;
  errorMessage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PaymentGatewayWebhookEvent extends Entity<PaymentGatewayWebhookEventProps> {
  protected validate(): void {}

  static create(
    props: Omit<PaymentGatewayWebhookEventProps, 'status'> & {
      status?: WebhookEventStatus;
    },
    id?: string,
  ): PaymentGatewayWebhookEvent {
    return new PaymentGatewayWebhookEvent(
      {
        ...props,
        status: props.status || WebhookEventStatus.PENDING,
      },
      id,
    );
  }

  static with(
    props: PaymentGatewayWebhookEventProps,
    id: string,
  ): PaymentGatewayWebhookEvent {
    return new PaymentGatewayWebhookEvent(props, id);
  }

  get gatewayEventId() {
    return this.props.gatewayEventId;
  }

  get provider() {
    return this.props.provider;
  }

  get eventType() {
    return this.props.eventType;
  }

  get payload() {
    return this.props.payload;
  }

  get status() {
    return this.props.status;
  }

  get processedAt() {
    return this.props.processedAt;
  }

  get errorMessage() {
    return this.props.errorMessage;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  markAsProcessed(): void {
    this.props.status = WebhookEventStatus.PROCESSED;
    this.props.processedAt = new Date();
    this.props.errorMessage = null;
  }

  markAsFailed(message: string): void {
    this.props.status = WebhookEventStatus.FAILED;
    this.props.errorMessage = message;
  }
}
