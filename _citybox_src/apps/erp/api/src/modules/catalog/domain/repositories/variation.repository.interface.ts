import type { Variation } from '../entities/variation.entity';

export type VariationListCriteria = {
  search?: string;
  skip?: number;
  take?: number;
};

export abstract class VariationRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<Variation | null>;

  abstract findAll(
    organizationId: string,
    criteria?: VariationListCriteria,
  ): Promise<Variation[]>;

  abstract count(
    organizationId: string,
    criteria?: Pick<VariationListCriteria, 'search'>,
  ): Promise<number>;

  abstract countProductsUsing(
    organizationId: string,
    variationId: string,
  ): Promise<number>;

  abstract save(variation: Variation): Promise<Variation>;

  abstract delete(organizationId: string, id: string): Promise<void>;
}
