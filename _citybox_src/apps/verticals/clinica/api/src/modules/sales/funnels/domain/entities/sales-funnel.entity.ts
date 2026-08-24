import { randomUUID } from 'crypto';

import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

import { SalesFunnelZodValidator } from '../validators/sales-funnel.zod.validator';
import type {
  SalesFunnelProps,
  SalesFunnelStageProps,
  SalesFunnelStageType,
} from '../sales-funnel.types';
import { buildDefaultStages } from '../sales-funnel.types';

export type { SalesFunnelStageProps, SalesFunnelStageType };

export type CreateStageInput = {
  id?: string;
  name: string;
  type: SalesFunnelStageType;
  color: string;
  order: number;
};

export class SalesFunnel extends Entity<SalesFunnelProps> {
  constructor(props: SalesFunnelProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    SalesFunnelZodValidator.create().validate(this);
  }

  public static create(
    props: Optional<
      SalesFunnelProps,
      'createdAt' | 'updatedAt' | 'isDefault' | 'stages'
    > & {
      stages?: SalesFunnelStageProps[];
    },
    id?: string,
  ): SalesFunnel {
    const funnelId = id ?? randomUUID();
    const now = new Date();
    const stages =
      props.stages ??
      buildDefaultStages(props.storeId, funnelId).map((stage) => ({
        ...stage,
        id: randomUUID(),
      }));

    return new SalesFunnel(
      {
        storeId: props.storeId,
        name: props.name,
        isDefault: props.isDefault ?? false,
        stages,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      funnelId,
    );
  }

  public static with(props: SalesFunnelProps, id: string): SalesFunnel {
    return new SalesFunnel(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }

  get name() {
    return this.props.name;
  }

  get isDefault() {
    return this.props.isDefault;
  }

  get stages() {
    return this.props.stages;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  public withName(name: string): SalesFunnel {
    return SalesFunnel.with(
      {
        ...this.props,
        name,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  public withStages(stages: SalesFunnelStageProps[]): SalesFunnel {
    return SalesFunnel.with(
      {
        ...this.props,
        stages: [...stages].sort((a, b) => a.order - b.order),
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  public findStage(stageId: string): SalesFunnelStageProps | undefined {
    return this.props.stages.find((s) => s.id === stageId);
  }
}
