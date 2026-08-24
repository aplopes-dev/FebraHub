import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';

import type {
  StockMovementListCriteria,
  StockMovementListItem,
} from '../../domain/repositories/stock-movement.repository';
import { StockMovementRepository } from '../../domain/repositories/stock-movement.repository';

import { StockInsufficientQuantityError } from '../../domain/errors/stock-insufficient-quantity.error';
import { StockProductNotFoundError } from '../../domain/errors/stock-product-not-found.error';

@Injectable()
export class PrismaStockMovementRepository extends StockMovementRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createEntry(input: {
    storeId: string;
    productId: string;
    quantity: number;
    notes: string | null;
    authorizedById: string;
    authorizedByName: string;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const product = await tx.stockProduct.findFirst({
        where: { storeId: input.storeId, id: input.productId },
        select: { id: true, quantity: true },
      });

      if (!product) {
        throw new StockProductNotFoundError(
          PrismaStockMovementRepository.name,
          input.productId,
        );
      }

      await tx.stockProduct.update({
        where: { id: product.id },
        data: {
          quantity: product.quantity + input.quantity,
          updatedAt: new Date(),
        },
      });

      await tx.stockMovement.create({
        data: {
          storeId: input.storeId,
          productId: input.productId,
          type: 'entry',
          quantity: input.quantity,
          notes: input.notes,
          requestedById: null,
          requestedByName: null,
          authorizedById: input.authorizedById,
          authorizedByName: input.authorizedByName,
        },
      });
    });
  }

  async createBulkEntry(input: {
    storeId: string;
    items: Array<{ productId: string; quantity: number }>;
    notesByProductId?: Record<string, string | null>;
    authorizedById: string;
    authorizedByName: string;
  }): Promise<void> {
    const productIds = input.items.map((i) => i.productId);

    await this.prisma.$transaction(async (tx) => {
      const products = await tx.stockProduct.findMany({
        where: { storeId: input.storeId, id: { in: productIds } },
        select: { id: true, quantity: true },
      });

      if (products.length !== productIds.length) {
        throw new StockProductNotFoundError(
          PrismaStockMovementRepository.name,
          'one-or-more-products',
        );
      }

      const byId = new Map(products.map((p) => [p.id, p]));

      for (const item of input.items) {
        const product = byId.get(item.productId);
        if (!product) {
          // Segurança extra em caso de repetição
          throw new StockProductNotFoundError(
            PrismaStockMovementRepository.name,
            item.productId,
          );
        }

        await tx.stockProduct.update({
          where: { id: item.productId },
          data: {
            quantity: product.quantity + item.quantity,
            updatedAt: new Date(),
          },
        });

        // Atualiza o estado “in-memory” para suportar múltiplos itens do mesmo produto
        product.quantity = product.quantity + item.quantity;

        await tx.stockMovement.create({
          data: {
            storeId: input.storeId,
            productId: item.productId,
            type: 'entry',
            quantity: item.quantity,
            notes: input.notesByProductId?.[item.productId] ?? null,
            requestedById: null,
            requestedByName: null,
            authorizedById: input.authorizedById,
            authorizedByName: input.authorizedByName,
          },
        });
      }
    });
  }

  async createWithdrawal(input: {
    storeId: string;
    productId: string;
    quantity: number;
    requestedById: string | null;
    requestedByName: string | null;
    notes: string | null;
    authorizedById: string;
    authorizedByName: string;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const product = await tx.stockProduct.findFirst({
        where: { storeId: input.storeId, id: input.productId },
        select: { id: true, quantity: true, minQuantity: true },
      });

      if (!product) {
        throw new StockProductNotFoundError(
          PrismaStockMovementRepository.name,
          input.productId,
        );
      }

      if (input.quantity > product.quantity) {
        throw new StockInsufficientQuantityError(
          PrismaStockMovementRepository.name,
          product.quantity,
          input.quantity,
        );
      }

      await tx.stockProduct.update({
        where: { id: product.id },
        data: {
          quantity: Math.max(0, product.quantity - input.quantity),
          updatedAt: new Date(),
        },
      });

      await tx.stockMovement.create({
        data: {
          storeId: input.storeId,
          productId: input.productId,
          type: 'withdrawal',
          quantity: input.quantity,
          notes: input.notes,
          requestedById: input.requestedById,
          requestedByName: input.requestedById
            ? (input.requestedByName ?? 'Profissional')
            : null,
          authorizedById: input.authorizedById,
          authorizedByName: input.authorizedByName,
        },
      });
    });
  }

  async listMovements(
    storeId: string,
    criteria: StockMovementListCriteria,
  ): Promise<{
    items: StockMovementListItem[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const page = criteria.page ?? 1;
    const perPage = criteria.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const where: any = { storeId };
    if (criteria.type) where.type = criteria.type;
    if (criteria.productId) where.productId = criteria.productId;
    if (criteria.startDate || criteria.endDate) {
      where.createdAt = {};
      if (criteria.startDate) {
        where.createdAt.gte = this.parseDateStart(criteria.startDate);
      }
      if (criteria.endDate) {
        where.createdAt.lte = this.parseDateEnd(criteria.endDate);
      }
    }

    const [total, rows] = await Promise.all([
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.findMany({
        where,
        orderBy: this.buildOrderBy(criteria),
        skip,
        take: perPage,
        include: {
          product: { select: { id: true, name: true, photoObjectKey: true } },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));

    const items: StockMovementListItem[] = rows.map((row: any) => {
      const photoUrl = row.product.photoObjectKey
        ? `/api/v1/stock-products/${row.product.id}/photo`
        : null;

      return {
        id: row.id,
        type: row.type,
        quantity: row.quantity,
        notes: row.notes,
        createdAt: row.createdAt.toISOString(),
        product: { id: row.product.id, name: row.product.name, photoUrl },
        requestedBy: row.requestedById
          ? {
              id: row.requestedById,
              name: row.requestedByName ?? 'Profissional',
            }
          : null,
        authorizedBy: {
          id: row.authorizedById,
          name: row.authorizedByName,
        },
      };
    });

    return { items, total, page, perPage, totalPages };
  }

  /** Aceita `yyyy-MM-dd` ou ISO completo; usa o dia civil (igual agenda). */
  private parseDateStart(value: string): Date {
    const dateOnly = value.slice(0, 10);
    return new Date(`${dateOnly}T00:00:00.000Z`);
  }

  private parseDateEnd(value: string): Date {
    const dateOnly = value.slice(0, 10);
    return new Date(`${dateOnly}T23:59:59.999Z`);
  }

  private buildOrderBy(criteria: StockMovementListCriteria) {
    const direction: 'asc' | 'desc' =
      criteria.sortOrder === 'desc' ? 'desc' : 'asc';

    switch (criteria.sortBy) {
      case 'product':
        return { product: { name: direction } };
      case 'quantity':
        return { quantity: direction };
      case 'withdrawnBy':
        return { requestedByName: direction };
      case 'authorizedBy':
        return { authorizedByName: direction };
      case 'date':
        return { createdAt: direction };
      default:
        return { createdAt: 'desc' as const };
    }
  }
}
