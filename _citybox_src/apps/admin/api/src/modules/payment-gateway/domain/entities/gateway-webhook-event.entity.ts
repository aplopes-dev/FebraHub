import { Entity } from '../../../../shared/core/entity';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

export enum GatewayWebhookEventType {
  PAYMENT_CREATED = 'PAYMENT_CREATED',
  PAYMENT_UPDATED = 'PAYMENT_UPDATED',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  PAYMENT_DELETED = 'PAYMENT_DELETED',
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_DELETED = 'SUBSCRIPTION_DELETED',
}

export type GatewayWebhookEventProps = {
  event: GatewayWebhookEventType;
  gatewayPaymentId?: string | null;
  gatewaySubscriptionId?: string | null;
  value?: number | null;
  paidAt?: Date | null;
  billingType?: PaymentMethod | null;
  invoiceStatus?: InvoiceStatus | null;
  subscriptionStatus?: SubscriptionStatus | null;
  invoiceUrl?: string | null;
};

export class GatewayWebhookEvent extends Entity<GatewayWebhookEventProps> {
  protected validate(): void {}

  static create(
    props: GatewayWebhookEventProps,
    id?: string,
  ): GatewayWebhookEvent {
    return new GatewayWebhookEvent(props, id);
  }

  get event() {
    return this.props.event;
  }

  get gatewayPaymentId() {
    return this.props.gatewayPaymentId;
  }

  get invoiceUrl() {
    return this.props.invoiceUrl;
  }

  get gatewaySubscriptionId() {
    return this.props.gatewaySubscriptionId;
  }

  get value() {
    return this.props.value;
  }

  get paidAt() {
    return this.props.paidAt;
  }

  get billingType() {
    return this.props.billingType;
  }

  get invoiceStatus() {
    return this.props.invoiceStatus;
  }

  get subscriptionStatus() {
    return this.props.subscriptionStatus;
  }
}
