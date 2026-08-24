import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { SubscriptionCycle } from '../../../subscriptions/domain/entities/subscription.entity';
import { PlanValidatorFactory } from '../factories/plan-validator.factory';

export type PlanStatus = 'ACTIVE' | 'HIDDEN';

export type PlanPriceProps = {
  id?: string;
  stripePriceId?: string | null;
  cycle: SubscriptionCycle;
  priceCents: number;
  status?: PlanStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

/** Vertical de negócio do catálogo (`scripts/verticals.config.mjs`); `null` só em planos legados ainda não migrados. */
export type PlanVertical = string;

export type PlanProps = {
  code: string;
  name: string;
  description: string;
  prices: PlanPriceProps[];
  vertical: PlanVertical | null;
  tier: string | null;
  maxStores: number;
  /** Limite de unidades operacionais (`Negócio`) dentro da vertical — substitui `maxStores` (research.md #5). */
  maxNegocios: number | null;
  maxUsers: number;
  maxProducts: number | null;
  status: PlanStatus;
  createdAt: Date;
  updatedAt: Date;
};

export class Plan extends Entity<PlanProps> {
  constructor(props: PlanProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    PlanValidatorFactory.create().validate(this);
  }

  public static create(
    props: Optional<
      PlanProps,
      | 'createdAt'
      | 'updatedAt'
      | 'status'
      | 'maxProducts'
      | 'prices'
      | 'vertical'
      | 'tier'
      | 'maxNegocios'
      | 'maxStores'
    >,
    id?: string,
  ): Plan {
    return new Plan(
      {
        ...props,
        prices: props.prices ?? [],
        status: props.status ?? 'ACTIVE',
        maxProducts: props.maxProducts ?? null,
        vertical: props.vertical ?? null,
        tier: props.tier ?? null,
        maxNegocios: props.maxNegocios ?? null,
        // maxStores é legado (research.md #5) — sincronizado com maxNegocios quando omitido.
        maxStores: props.maxStores ?? props.maxNegocios ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: PlanProps, id: string): Plan {
    return new Plan(props, id);
  }

  get code() {
    return this.props.code;
  }
  get name() {
    return this.props.name;
  }
  get description() {
    return this.props.description;
  }
  get prices() {
    return this.props.prices;
  }
  get vertical() {
    return this.props.vertical;
  }
  get tier() {
    return this.props.tier;
  }
  get maxStores() {
    return this.props.maxStores;
  }
  get maxNegocios() {
    return this.props.maxNegocios;
  }
  get maxUsers() {
    return this.props.maxUsers;
  }
  get maxProducts() {
    return this.props.maxProducts;
  }
  get status() {
    return this.props.status;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  public touch(): void {
    this.props.updatedAt = new Date();
  }

  public update(
    input: Partial<
      Pick<
        PlanProps,
        | 'name'
        | 'description'
        | 'prices'
        | 'vertical'
        | 'tier'
        | 'maxStores'
        | 'maxNegocios'
        | 'maxUsers'
        | 'maxProducts'
        | 'status'
      >
    >,
  ): void {
    Object.assign(this.props, input);
    this.touch();
  }
}
