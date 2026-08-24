import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { ProductEntity } from '../../../domain/entities/product.entity';
import { InsufficientStockError } from '../../../domain/errors/insufficient-stock.error';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';

export type StockMovementTypeInput = 'IN' | 'OUT';

export interface AdjustStockInput {
  storeId: string;
  productId: string;
  type: StockMovementTypeInput;
  quantity: number;
  note?: string | null;
}

export interface AdjustStockResult {
  product: ProductEntity;
  movement: {
    id: string;
    productId: string;
    type: StockMovementTypeInput;
    quantity: number;
    note: string | null;
    createdAt: Date;
  };
}

@Injectable()
export class AdjustStockUseCase implements IUseCase<
  AdjustStockInput,
  AdjustStockResult
> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: AdjustStockInput): Promise<AdjustStockResult> {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new ValidatorDomainError({
        internalMessage: 'AdjustStock quantity must be a positive integer.',
        externalMessage: 'Informe uma quantidade positiva.',
        context: 'Products',
      });
    }

    const product = await this.productRepository.findById(
      input.storeId,
      input.productId,
    );
    if (!product) throw new ProductNotFoundError(input.productId);

    const delta = input.type === 'IN' ? input.quantity : -input.quantity;
    if (input.type === 'OUT' && product.stockQuantity < input.quantity) {
      throw new InsufficientStockError(
        product.id,
        product.stockQuantity,
        input.quantity,
      );
    }

    try {
      product.adjustStock(delta);
    } catch {
      throw new InsufficientStockError(
        product.id,
        product.stockQuantity,
        input.quantity,
      );
    }

    const note = input.note?.trim() ? input.note.trim() : null;

    const movement = await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: {
          stockQuantity: product.stockQuantity,
          updatedAt: product.updatedAt,
        },
      });

      return tx.stockMovement.create({
        data: {
          productId: product.id,
          type: input.type,
          quantity: input.quantity,
          note,
        },
      });
    });

    return {
      product,
      movement: {
        id: movement.id,
        productId: movement.productId,
        type: movement.type,
        quantity: movement.quantity,
        note: movement.note,
        createdAt: movement.createdAt,
      },
    };
  }
}
