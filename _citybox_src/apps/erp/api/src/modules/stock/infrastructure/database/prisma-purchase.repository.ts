import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { Purchase } from '../../domain/entities/purchase.entity';
import type { StockMovement } from '../../domain/entities/stock-movement.entity';
import { PurchaseAlreadyReceivedError } from '../../domain/errors/purchase-already-received.error';
import {
  PurchaseRepository,
  type PurchaseDetail,
  type PurchaseListCriteria,
  type PurchaseListItem,
} from '../../domain/repositories/purchase.repository.interface';
import { persistStockMovementInTx } from './persist-stock-movement-in-tx';

type PurchaseRow = {
  id: string;
  organizationId: string;
  stockId: string;
  supplierId: string;
  carrierId: string | null;
  deliveryStatus: string;
  purchasedAt: Date;
  series: string;
  invoiceNumber: string;
  notes: string;
  freightCents: number;
  discountsCents: number;
  otherExpensesCents: number;
  stockMovementId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lines: Array<{
    productId: string;
    quantity: Prisma.Decimal;
    costCents: number;
    status: string;
  }>;
};

/**
 * Usa `prisma.scoped`: o filtro global injeta o `organizationId` do contexto em
 * toda query, mesmo nas que já o passam explicitamente aqui.
 */
@Injectable()
export class PrismaPurchaseRepository extends PurchaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async saveWithOptionalMovement(
    purchase: Purchase,
    movement: StockMovement | null,
  ): Promise<Purchase> {
    // Grava o `stockMovementId` na compra dentro da MESMA transação do
    // movimento — se o processo cair entre as duas escritas, uma futura
    // atualização recebida ainda vê `stockMovementId=null` e tenta gerar de
    // novo, o que violaria a idempotência (regra F7 §3).
    const finalPurchase = movement
      ? purchase.withStockMovementId(movement.id)
      : purchase;

    const data = {
      organizationId: finalPurchase.organizationId,
      stockId: finalPurchase.stockId,
      supplierId: finalPurchase.supplierId,
      carrierId: finalPurchase.carrierId,
      deliveryStatus: finalPurchase.deliveryStatus,
      purchasedAt: finalPurchase.purchasedAt,
      series: finalPurchase.series,
      invoiceNumber: finalPurchase.invoiceNumber,
      notes: finalPurchase.notes,
      freightCents: finalPurchase.freightCents,
      discountsCents: finalPurchase.discountsCents,
      otherExpensesCents: finalPurchase.otherExpensesCents,
      stockMovementId: finalPurchase.stockMovementId,
      deletedAt: finalPurchase.deletedAt,
      updatedAt: finalPurchase.updatedAt,
    };

    await this.prisma.scoped.$transaction(async (tx) => {
      if (movement) {
        // Recebimento: a guarda de idempotência do use-case lê
        // `stockMovementId` FORA da transação, então dois PUT concorrentes
        // (duplo clique em Salvar) chegavam aqui os dois com `null` e geravam
        // DOIS movimentos de entrada — saldo dobrado e um movimento órfão que
        // nem aparece como "já recebida".
        //
        // O `UPDATE ... WHERE stock_movement_id IS NULL` fecha a janela: em
        // READ COMMITTED o segundo writer bloqueia na linha, reavalia o WHERE
        // contra a versão já comitada e casa 0 linhas.
        const claimed = await tx.purchase.updateMany({
          where: {
            id: finalPurchase.id,
            organizationId: finalPurchase.organizationId,
            stockMovementId: null,
          },
          data,
        });

        if (claimed.count === 0) {
          const exists = await tx.purchase.findFirst({
            where: {
              id: finalPurchase.id,
              organizationId: finalPurchase.organizationId,
            },
            select: { id: true },
          });
          if (exists) {
            throw new PurchaseAlreadyReceivedError(finalPurchase.id);
          }
          // Compra nova já nascendo recebida: o id é fresco, não há corrida.
          await tx.purchase.create({
            data: {
              id: finalPurchase.id,
              ...data,
              createdAt: finalPurchase.createdAt,
            },
          });
        }
      } else {
        await tx.purchase.upsert({
          where: { id: finalPurchase.id },
          create: {
            id: finalPurchase.id,
            ...data,
            createdAt: finalPurchase.createdAt,
          },
          update: data,
        });
      }

      // Substituição completa das linhas (semântica de PUT) — inclusive na
      // criação, onde o delete não encontra nada a apagar.
      await tx.purchaseLine.deleteMany({
        where: {
          purchaseId: finalPurchase.id,
          organizationId: finalPurchase.organizationId,
        },
      });
      await tx.purchaseLine.createMany({
        data: finalPurchase.lines.map((line) => ({
          organizationId: finalPurchase.organizationId,
          purchaseId: finalPurchase.id,
          productId: line.productId,
          quantity: new Prisma.Decimal(line.quantity),
          costCents: line.costCents,
          status: line.status,
        })),
      });

      if (movement) {
        await persistStockMovementInTx(tx, movement);
      }
    });

    return finalPurchase;
  }

  async softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void> {
    await this.prisma.scoped.purchase.update({
      where: { id, organizationId },
      data: { deletedAt },
    });
  }

  async clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void> {
    await this.prisma.scoped.purchase.update({
      where: { id, organizationId },
      data: { deletedAt: null, updatedAt },
    });
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<PurchaseDetail | null> {
    const row = await this.prisma.scoped.purchase.findFirst({
      where: { id, organizationId },
      include: {
        lines: { include: { product: { select: { name: true, sku: true } } } },
        stock: { select: { name: true } },
        supplier: { select: { name: true } },
        carrier: { select: { name: true } },
      },
    });
    if (!row) return null;

    return {
      purchase: this.toEntity(row),
      stockName: row.stock.name,
      supplierName: row.supplier.name,
      carrierName: row.carrier?.name ?? null,
      lines: row.lines.map((line) => ({
        productId: line.productId,
        productName: line.product.name,
        productSku: line.product.sku,
        quantity: line.quantity.toString(),
        costCents: line.costCents,
        status: line.status,
      })),
    };
  }

  async findAll(
    organizationId: string,
    criteria: PurchaseListCriteria = {},
  ): Promise<PurchaseListItem[]> {
    const rows = await this.prisma.scoped.purchase.findMany({
      where: this.buildWhere(organizationId, criteria),
      include: {
        lines: true,
        stock: { select: { name: true } },
        supplier: { select: { name: true } },
        carrier: { select: { name: true } },
      },
      orderBy: { purchasedAt: 'desc' },
      skip: criteria.skip,
      take: criteria.take,
    });

    return rows.map((row) => ({
      purchase: this.toEntity(row),
      stockName: row.stock.name,
      supplierName: row.supplier.name,
      carrierName: row.carrier?.name ?? null,
    }));
  }

  count(
    organizationId: string,
    criteria: Omit<PurchaseListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.prisma.scoped.purchase.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async countByTabs(
    organizationId: string,
  ): Promise<{ active: number; deleted: number }> {
    const [active, deleted] = await Promise.all([
      this.prisma.scoped.purchase.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.scoped.purchase.count({
        where: { organizationId, deletedAt: { not: null } },
      }),
    ]);
    return { active, deleted };
  }

  private buildWhere(
    organizationId: string,
    criteria: Omit<PurchaseListCriteria, 'skip' | 'take'>,
  ): Prisma.PurchaseWhereInput {
    const and: Prisma.PurchaseWhereInput[] = [];
    const search = criteria.search?.trim();

    and.push(
      criteria.tab === 'deleted'
        ? { deletedAt: { not: null } }
        : { deletedAt: null },
    );

    if (criteria.status && criteria.status !== 'all') {
      and.push({ deliveryStatus: criteria.status });
    }
    if (criteria.stockId) and.push({ stockId: criteria.stockId });
    if (criteria.supplierId) and.push({ supplierId: criteria.supplierId });
    if (criteria.dateFrom || criteria.dateTo) {
      and.push({
        purchasedAt: {
          ...(criteria.dateFrom ? { gte: criteria.dateFrom } : {}),
          ...(criteria.dateTo ? { lte: criteria.dateTo } : {}),
        },
      });
    }
    if (search) {
      and.push({
        OR: [
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { series: { contains: search, mode: 'insensitive' } },
          { supplier: { name: { contains: search, mode: 'insensitive' } } },
          {
            lines: {
              some: {
                product: {
                  OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { sku: { contains: search, mode: 'insensitive' } },
                  ],
                },
              },
            },
          },
        ],
      });
    }

    return { organizationId, AND: and };
  }

  private toEntity(row: PurchaseRow): Purchase {
    return Purchase.with(
      {
        organizationId: row.organizationId,
        stockId: row.stockId,
        supplierId: row.supplierId,
        carrierId: row.carrierId,
        deliveryStatus: row.deliveryStatus as Purchase['deliveryStatus'],
        purchasedAt: row.purchasedAt,
        series: row.series,
        invoiceNumber: row.invoiceNumber,
        notes: row.notes,
        freightCents: row.freightCents,
        discountsCents: row.discountsCents,
        otherExpensesCents: row.otherExpensesCents,
        stockMovementId: row.stockMovementId,
        deletedAt: row.deletedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        lines: row.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity.toString(),
          costCents: line.costCents,
          status: line.status as Purchase['lines'][number]['status'],
        })),
      },
      row.id,
    );
  }
}
