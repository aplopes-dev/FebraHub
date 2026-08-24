import type { SalesFunnel } from '../entities/sales-funnel.entity';
import type { CreateStageInput } from '../entities/sales-funnel.entity';

export type SalesFunnelListCriteria = {
  skip: number;
  take: number;
};

export abstract class SalesFunnelRepository {
  abstract findById(storeId: string, id: string): Promise<SalesFunnel | null>;
  abstract findMany(
    storeId: string,
    criteria: SalesFunnelListCriteria,
  ): Promise<SalesFunnel[]>;
  abstract count(storeId: string): Promise<number>;
  abstract countDefaults(storeId: string): Promise<number>;
  abstract listDefaults(
    storeId: string,
  ): Promise<Array<{ id: string; name: string; isDefault: boolean }>>;
  abstract create(funnel: SalesFunnel): Promise<SalesFunnel>;
  abstract save(
    funnel: SalesFunnel,
    options?: { stageIdsToDelete?: string[] },
  ): Promise<SalesFunnel>;
  abstract delete(storeId: string, id: string): Promise<void>;
  abstract countOpportunitiesByStage(
    storeId: string,
    stageId: string,
  ): Promise<number>;
  abstract createMany(funnels: SalesFunnel[]): Promise<SalesFunnel[]>;
}

export type { CreateStageInput };
