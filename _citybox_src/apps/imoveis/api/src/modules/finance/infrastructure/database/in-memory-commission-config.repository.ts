import { CommissionConfigEntity } from '../../domain/entities/commission-config.entity';
import {
  CommissionConfigRepository,
  type CommissionConfigUpsertPayload,
} from '../../domain/repositories/commission-config.repository.interface';

/** Repositório em memória para testes unitários dos use-cases. */
export class InMemoryCommissionConfigRepository extends CommissionConfigRepository {
  private readonly configs = new Map<string, CommissionConfigEntity>();

  async getByStoreId(storeId: string): Promise<CommissionConfigEntity | null> {
    await Promise.resolve();
    return this.configs.get(storeId) ?? null;
  }

  async upsert(
    storeId: string,
    payload: CommissionConfigUpsertPayload,
  ): Promise<CommissionConfigEntity> {
    await Promise.resolve();
    const existing = this.configs.get(storeId);
    const entity = CommissionConfigEntity.create(
      {
        storeId,
        defaultCommissionPercent: payload.global.defaultCommissionPercent,
        defaultSplit: { ...payload.global.defaultSplit },
        agentOverrides: payload.agentOverrides.map((o) => ({ ...o })),
      },
      existing?.id,
    );
    this.configs.set(storeId, entity);
    return entity;
  }
}
