import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { SubscriptionValidatorFactory } from '../factories/subscription-validator.factory';

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'TRIALING'
  | 'PAST_DUE'
  | 'CANCELED';

export type SubscriptionCycle = 'MONTHLY' | 'YEARLY';

export type SubscriptionProps = {
  /** `null` para assinaturas de lojas criadas via FR-001 (sem Cliente). */
  /** Unidade de billing direta (FR-002) — sempre presente para assinaturas novas. */
  /** Unidade de billing. Obrigatória desde a Fase 10 — não há mais Cliente. */
  storeId: string;
  planPriceId: string;
  planId?: string;
  planName?: string;
  planVertical?: string | null;
  planTier?: string | null;
  priceCents?: number;
  cycle: SubscriptionCycle;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  dayOfMonth: number;
  gatewaySubscriptionId: string | null;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /** Nome da **loja**, desnormalizado para exibição. Ver comentário em `Invoice`. */
  clientName?: string;
};

export class Subscription extends Entity<SubscriptionProps> {
  constructor(props: SubscriptionProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    SubscriptionValidatorFactory.create().validate(this);
  }

  public static create(
    props: Optional<
      SubscriptionProps,
      | 'createdAt'
      | 'updatedAt'
      | 'status'
      | 'gatewaySubscriptionId'
      | 'canceledAt'
    >,
    id?: string,
  ): Subscription {
    return new Subscription(
      {
        ...props,
        status: props.status ?? 'ACTIVE',
        gatewaySubscriptionId: props.gatewaySubscriptionId ?? null,
        canceledAt: props.canceledAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: SubscriptionProps, id: string): Subscription {
    return new Subscription(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get planPriceId() {
    return this.props.planPriceId;
  }
  get planId() {
    return this.props.planId;
  }
  get planName() {
    return this.props.planName;
  }
  get planVertical() {
    return this.props.planVertical;
  }
  get planTier() {
    return this.props.planTier;
  }
  get priceCents() {
    return this.props.priceCents;
  }
  get cycle() {
    return this.props.cycle;
  }
  get status() {
    return this.props.status;
  }
  get currentPeriodStart() {
    return this.props.currentPeriodStart;
  }
  get currentPeriodEnd() {
    return this.props.currentPeriodEnd;
  }
  get dayOfMonth() {
    return this.props.dayOfMonth;
  }
  get gatewaySubscriptionId() {
    return this.props.gatewaySubscriptionId;
  }
  get canceledAt() {
    return this.props.canceledAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
  get clientName() {
    return this.props.clientName;
  }

  public touch(): void {
    this.props.updatedAt = new Date();
  }

  public cancel(): void {
    this.props.status = 'CANCELED';
    this.props.canceledAt = new Date();
    this.touch();
  }

  public changePlan(props: {
    planPriceId: string;
    cycle: SubscriptionCycle;
    dayOfMonth: number;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }): void {
    this.props.planPriceId = props.planPriceId;
    this.props.cycle = props.cycle;
    this.props.dayOfMonth = props.dayOfMonth;
    this.props.currentPeriodStart = props.currentPeriodStart;
    this.props.currentPeriodEnd = props.currentPeriodEnd;
    this.props.status = 'ACTIVE';
    this.props.canceledAt = null;
    this.touch();
  }
  public setGatewaySubscription(gatewaySubscriptionId: string): void {
    this.props.gatewaySubscriptionId = gatewaySubscriptionId;
    this.touch();
  }
}
