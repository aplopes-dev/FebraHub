import { Entity } from '../../../../shared/core/entity';

import type { StockMovementType } from '../stock-types';
import { StockMovementZodValidator } from '../validators/stock-movement.zod.validator';

export type StockMovementProps = {
  storeId: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  notes: string | null;
  requestedById: string | null;
  requestedByName: string | null;
  authorizedById: string;
  authorizedByName: string;
  createdAt: Date;
};

export class StockMovement extends Entity<StockMovementProps> {
  constructor(props: StockMovementProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    StockMovementZodValidator.create().validate(this);
  }
}
