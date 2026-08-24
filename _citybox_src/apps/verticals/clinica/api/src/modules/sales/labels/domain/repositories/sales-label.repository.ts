import type { SalesLabel } from '../entities/sales-label.entity';

export type SalesLabelListCriteria = {
  skip: number;
  take: number;
};

export abstract class SalesLabelRepository {
  abstract findById(storeId: string, id: string): Promise<SalesLabel | null>;
  abstract findByName(
    storeId: string,
    name: string,
  ): Promise<SalesLabel | null>;
  abstract findMany(
    storeId: string,
    criteria: SalesLabelListCriteria,
  ): Promise<SalesLabel[]>;
  abstract count(storeId: string): Promise<number>;
  abstract create(label: SalesLabel): Promise<SalesLabel>;
  abstract save(label: SalesLabel): Promise<SalesLabel>;
  abstract delete(storeId: string, id: string): Promise<void>;
}
