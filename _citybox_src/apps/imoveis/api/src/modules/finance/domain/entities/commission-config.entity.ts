import { Entity } from '../../../../shared/core/entity';

export type CommissionSplitPercents = {
  agencyPercent: number;
  captorPercent: number;
  sellerPercent: number;
};

export type AgentCommissionOverride = {
  agentId: string;
  captorPercentOverride: number;
  sellerPercentOverride: number | null;
};

export type CommissionConfigProps = {
  storeId: string;
  defaultCommissionPercent: number;
  defaultSplit: CommissionSplitPercents;
  agentOverrides: readonly AgentCommissionOverride[];
};

/** Configuração usada quando a loja ainda não tem linha em `commission_configs`. */
export const DEFAULT_COMMISSION_PERCENT = 6;
export const DEFAULT_SPLIT: CommissionSplitPercents = {
  agencyPercent: 40,
  captorPercent: 30,
  sellerPercent: 30,
};

export class CommissionConfigEntity extends Entity<CommissionConfigProps> {
  get storeId(): string {
    return this.props.storeId;
  }
  get defaultCommissionPercent(): number {
    return this.props.defaultCommissionPercent;
  }
  get defaultSplit(): CommissionSplitPercents {
    return this.props.defaultSplit;
  }
  get agentOverrides(): readonly AgentCommissionOverride[] {
    return this.props.agentOverrides;
  }

  protected validate(): void {
    if (!this.props.storeId) throw new Error('storeId is required');
    if (this.props.defaultCommissionPercent < 0) {
      throw new Error('defaultCommissionPercent must be >= 0');
    }
  }

  static create(
    props: CommissionConfigProps,
    id?: string,
  ): CommissionConfigEntity {
    const entity = new CommissionConfigEntity(props, id);
    entity.validate();
    return entity;
  }

  /** Config padrão — **não** é persistida; o PUT é quem cria a linha. */
  static default(storeId: string): CommissionConfigEntity {
    return CommissionConfigEntity.create({
      storeId,
      defaultCommissionPercent: DEFAULT_COMMISSION_PERCENT,
      defaultSplit: { ...DEFAULT_SPLIT },
      agentOverrides: [],
    });
  }
}
