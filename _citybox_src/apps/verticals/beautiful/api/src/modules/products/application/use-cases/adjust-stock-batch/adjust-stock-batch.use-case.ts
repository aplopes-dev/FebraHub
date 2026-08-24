import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import { InsufficientStockError } from '../../../domain/errors/insufficient-stock.error';

export type StockMovementTypeInput = 'IN' | 'OUT';

export interface AdjustStockBatchItemInput {
  productId: string;
  type: StockMovementTypeInput;
  quantity: number;
  note?: string | null;
}

export interface AdjustStockBatchInput {
  storeId: string;
  items: AdjustStockBatchItemInput[];
}

export interface AdjustStockBatchResultItem {
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  movementId: string;
  type: StockMovementTypeInput;
  quantity: number;
}

export interface AdjustStockBatchResult {
  updatedItems: AdjustStockBatchResultItem[];
}

@Injectable()
export class AdjustStockBatchUseCase implements IUseCase<
  AdjustStockBatchInput,
  AdjustStockBatchResult
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: AdjustStockBatchInput): Promise<AdjustStockBatchResult> {
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new ValidatorDomainError({
        internalMessage: 'AdjustStockBatch items must be a non-empty array.',
        externalMessage: 'Informe ao menos um produto para movimentação em lote.',
        context: 'ProductsBatch',
      });
    }

    // Valida cada item individualmente
    for (const item of input.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new ValidatorDomainError({
          internalMessage: `Invalid quantity ${item.quantity} for product ${item.productId}`,
          externalMessage: 'A quantidade das movimentações deve ser um número inteiro positivo.',
          context: 'ProductsBatch',
        });
      }
    }

    const productIds = Array.from(new Set(input.items.map((i) => i.productId)));

    // Busca os produtos pertencentes à loja
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        storeId: input.storeId,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Verifica se algum produto não existe na loja
    for (const id of productIds) {
      if (!productMap.has(id)) {
        throw new ProductNotFoundError(id);
      }
    }

    // Executa as movimentações em uma transação atômica
    const updatedItems = await this.prisma.$transaction(async (tx) => {
      const results: AdjustStockBatchResultItem[] = [];

      for (const item of input.items) {
        const dbProduct = productMap.get(item.productId)!;
        const previousStock = dbProduct.stockQuantity;
        const delta = item.type === 'IN' ? item.quantity : -item.quantity;
        const newStock = previousStock + delta;

        if (newStock < 0) {
          throw new InsufficientStockError(
            dbProduct.id,
            previousStock,
            item.quantity,
          );
        }

        // Atualiza quantidade no banco
        const updatedProduct = await tx.product.update({
          where: { id: dbProduct.id },
          data: {
            stockQuantity: newStock,
            updatedAt: new Date(),
          },
        });

        // Atualiza referência no map em memória para transações com múltiplos itens do mesmo produto
        dbProduct.stockQuantity = newStock;

        // Registra o movimento em log
        const note = item.note?.trim() ? item.note.trim() : null;
        const movement = await tx.stockMovement.create({
          data: {
            productId: dbProduct.id,
            type: item.type,
            quantity: item.quantity,
            note,
          },
        });

        results.push({
          productId: dbProduct.id,
          productName: updatedProduct.name,
          previousStock,
          newStock,
          movementId: movement.id,
          type: item.type,
          quantity: item.quantity,
        });
      }

      return results;
    });

    return { updatedItems };
  }
}
