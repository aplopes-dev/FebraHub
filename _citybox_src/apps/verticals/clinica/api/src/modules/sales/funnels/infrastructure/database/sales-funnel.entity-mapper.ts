import {
  SalesFunnel,
  type SalesFunnelStageProps,
} from '../../domain/entities/sales-funnel.entity';
import type { SalesFunnelStageType } from '../../domain/sales-funnel.types';

type StageRow = {
  id: string;
  storeId: string;
  funnelId: string;
  name: string;
  type: SalesFunnelStageType;
  color: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

type FunnelRow = {
  id: string;
  storeId: string;
  name: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  stages: StageRow[];
};

export class SalesFunnelEntityMapper {
  static toDomain(row: FunnelRow): SalesFunnel {
    const stages: SalesFunnelStageProps[] = [...row.stages]
      .sort((a, b) => a.order - b.order)
      .map((stage) => ({
        id: stage.id,
        storeId: stage.storeId,
        funnelId: stage.funnelId,
        name: stage.name,
        type: stage.type,
        color: stage.color,
        order: stage.order,
        createdAt: stage.createdAt,
        updatedAt: stage.updatedAt,
      }));

    return SalesFunnel.with(
      {
        storeId: row.storeId,
        name: row.name,
        isDefault: row.isDefault,
        stages,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
