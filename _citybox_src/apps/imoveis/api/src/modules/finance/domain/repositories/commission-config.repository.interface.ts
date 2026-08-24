import type {
  AgentCommissionOverride,
  CommissionConfigEntity,
  CommissionSplitPercents,
} from '../entities/commission-config.entity';

export type CommissionConfigUpsertPayload = {
  global: {
    defaultCommissionPercent: number;
    defaultSplit: CommissionSplitPercents;
  };
  agentOverrides: readonly AgentCommissionOverride[];
};

export abstract class CommissionConfigRepository {
  /** `null` quando a loja ainda não configurou comissões. */
  abstract getByStoreId(
    storeId: string,
  ): Promise<CommissionConfigEntity | null>;

  abstract upsert(
    storeId: string,
    payload: CommissionConfigUpsertPayload,
  ): Promise<CommissionConfigEntity>;
}
