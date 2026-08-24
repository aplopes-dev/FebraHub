import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';

export type PriceAdjustmentType =
  | 'manual'
  | 'percent_markup'
  | 'percent_discount'
  | 'fixed_over_base';

export type PriceListProps = {
  organizationId: string;
  name: string;
  adjustmentType: PriceAdjustmentType;
  /** Percentual ou centavos conforme o tipo; 0 se manual. */
  adjustmentValue: number;
  channels: string[];
  startDate: Date | null;
  endDate: Date | null;
  active: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
};

type CreatePriceListProps = Optional<
  PriceListProps,
  | 'adjustmentValue'
  | 'channels'
  | 'startDate'
  | 'endDate'
  | 'active'
  | 'priority'
  | 'createdAt'
  | 'updatedAt'
>;

export type PriceListUpdateInput = {
  name: string;
  adjustmentType: PriceAdjustmentType;
  adjustmentValue: number;
  channels: string[];
  startDate: Date | null;
  endDate: Date | null;
  active: boolean;
};

function normalizeAdjustmentValue(
  type: PriceAdjustmentType,
  value: number,
): number {
  if (type === 'manual') return 0;
  return Math.max(0, Math.round(value));
}

export class PriceList extends Entity<PriceListProps> {
  constructor(props: PriceListProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Formato no DTO HTTP; regras de unicidade/vigência nos use cases.
  }

  public static create(props: CreatePriceListProps, id?: string): PriceList {
    const adjustmentType = props.adjustmentType;
    return new PriceList(
      {
        ...props,
        name: props.name.trim(),
        adjustmentType,
        adjustmentValue: normalizeAdjustmentValue(
          adjustmentType,
          props.adjustmentValue ?? 0,
        ),
        channels: [...(props.channels ?? [])],
        startDate: props.startDate ?? null,
        endDate: props.endDate ?? null,
        active: props.active ?? true,
        priority: props.priority ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: PriceListProps, id: string): PriceList {
    return new PriceList(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get name() {
    return this.props.name;
  }
  get adjustmentType() {
    return this.props.adjustmentType;
  }
  get adjustmentValue() {
    return this.props.adjustmentValue;
  }
  get channels() {
    return this.props.channels;
  }
  get startDate() {
    return this.props.startDate;
  }
  get endDate() {
    return this.props.endDate;
  }
  get active() {
    return this.props.active;
  }
  get priority() {
    return this.props.priority;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  update(input: PriceListUpdateInput): PriceList {
    return PriceList.with(
      {
        ...this.props,
        name: input.name.trim(),
        adjustmentType: input.adjustmentType,
        adjustmentValue: normalizeAdjustmentValue(
          input.adjustmentType,
          input.adjustmentValue,
        ),
        channels: [...input.channels],
        startDate: input.startDate,
        endDate: input.endDate,
        active: input.active,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  withPriority(priority: number): PriceList {
    return PriceList.with(
      {
        ...this.props,
        priority,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}
