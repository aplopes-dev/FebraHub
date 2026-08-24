import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import type { Prisma, StockMovementType } from '../../../../../../generated/prisma/client';

export interface ListAllStockMovementsInput {
  storeId: string;
  page?: number;
  limit?: number;
  productId?: string;
  type?: StockMovementType;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedStockMovementItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  unitOfMeasure: string;
  type: StockMovementType;
  quantity: number;
  note: string | null;
  createdAt: Date;
}

export interface PaginatedStockMovementsResponse {
  items: PaginatedStockMovementItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ListAllStockMovementsUseCase implements IUseCase<
  ListAllStockMovementsInput,
  PaginatedStockMovementsResponse
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    input: ListAllStockMovementsInput,
  ): Promise<PaginatedStockMovementsResponse> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.max(1, Math.min(100, input.limit ?? 20));

    const where: Prisma.StockMovementWhereInput = {
      product: {
        storeId: input.storeId,
      },
    };

    if (input.productId) {
      where.productId = input.productId;
    }

    if (input.type) {
      where.type = input.type;
    }

    if (input.search && input.search.trim()) {
      const search = input.search.trim();
      where.OR = [
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
        { note: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (input.startDate || input.endDate) {
      where.createdAt = {};
      if (input.startDate) {
        where.createdAt.gte = new Date(input.startDate);
      }
      if (input.endDate) {
        // inclui o dia inteiro da data final até 23:59:59.999
        const end = new Date(input.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [total, movements] = await Promise.all([
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.findMany({
        where,
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              unitOfMeasure: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const items: PaginatedStockMovementItem[] = movements.map((m) => ({
      id: m.id,
      productId: m.productId,
      productName: m.product?.name ?? 'Produto removido',
      productSku: m.product?.sku ?? '',
      unitOfMeasure: m.product?.unitOfMeasure ?? 'un',
      type: m.type,
      quantity: m.quantity,
      note: m.note,
      createdAt: m.createdAt,
    }));

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
