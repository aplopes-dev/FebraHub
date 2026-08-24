import { Entity } from '../../../../shared/core/entity';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentCycle } from '../enums/payment-cycle.enum';

export type GatewaySubscriptionProps = {
  gatewaySubscriptionId: string;
  gatewayCustomerId: string;
  value: number;
  status: SubscriptionStatus;
  billingType: PaymentMethod;
  cycle: PaymentCycle;
  nextDueDate: Date;
  description?: string | null;
};

export class GatewaySubscription extends Entity<GatewaySubscriptionProps> {
  protected validate(): void {}

  static create(
    props: GatewaySubscriptionProps,
    id?: string,
  ): GatewaySubscription {
    return new GatewaySubscription(props, id);
  }

  get gatewaySubscriptionId() {
    return this.props.gatewaySubscriptionId;
  }

  get gatewayCustomerId() {
    return this.props.gatewayCustomerId;
  }

  get value() {
    return this.props.value;
  }

  get status() {
    return this.props.status;
  }

  get billingType() {
    return this.props.billingType;
  }

  get cycle() {
    return this.props.cycle;
  }

  get nextDueDate() {
    return this.props.nextDueDate;
  }

  get description() {
    return this.props.description;
  }
}
