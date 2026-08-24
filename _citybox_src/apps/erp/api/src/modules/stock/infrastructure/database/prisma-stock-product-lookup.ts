import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  StockProductLookup,
  type TrackableProductSnapshot,
} from '../../domain/repositories/stock-movement.repository.interface';

@Injectable()
export class PrismaStockProductLookup extends StockProductLookup {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findTrackable(
    organizationId: string,
    productId: string,
  ): Promise<TrackableProductSnapshot | null> {
    const row = await this.prisma.scoped.product.findFirst({
      where: { id: productId, organizationId },
      select: { id: true, trackStock: true, deletedAt: true },
    });
    return row;
  }

  async findTrackableMany(
    organizationId: string,
    productIds: string[],
  ): Promise<Map<string, TrackableProductSnapshot>> {
    const byId = new Map<string, TrackableProductSnapshot>();
    if (productIds.length === 0) return byId;

    const rows = await this.prisma.scoped.product.findMany({
      where: { id: { in: productIds }, organizationId },
      select: { id: true, trackStock: true, deletedAt: true },
    });

    for (const row of rows) byId.set(row.id, row);
    return byId;
  }
}
