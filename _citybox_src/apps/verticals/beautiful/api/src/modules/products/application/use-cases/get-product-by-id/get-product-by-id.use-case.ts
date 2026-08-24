import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { ProductEntity } from '../../../domain/entities/product.entity';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import type { StockMovementItem } from '../list-stock-movements/list-stock-movements.use-case';

export interface GetProductByIdInput {
  storeId: string;
  id: string;
}

export interface GetProductByIdResult {
  product: ProductEntity;
  stockMovements: StockMovementItem[];
}

@Injectable()
export class GetProductByIdUseCase implements IUseCase<
  GetProductByIdInput,
  GetProductByIdResult
> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: GetProductByIdInput): Promise<GetProductByIdResult> {
    const product = await this.productRepository.findById(
      input.storeId,
      input.id,
    );
    if (!product) {
      throw new ProductNotFoundError(input.id);
    }

    const list = await this.prisma.stockMovement.findMany({
      where: { productId: input.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      product,
      stockMovements: list.map((item) => ({
        id: item.id,
        productId: item.productId,
        type: item.type,
        quantity: item.quantity,
        note: item.note,
        createdAt: item.createdAt,
      })),
    };
  }
}
