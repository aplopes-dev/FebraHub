import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';

export interface ListStockMovementsInput {
  storeId: string;
  productId: string;
}

export interface StockMovementItem {
  id: string;
  productId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  note: string | null;
  createdAt: Date;
}

@Injectable()
export class ListStockMovementsUseCase implements IUseCase<
  ListStockMovementsInput,
  StockMovementItem[]
> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: ListStockMovementsInput): Promise<StockMovementItem[]> {
    const product = await this.productRepository.findById(
      input.storeId,
      input.productId,
    );
    if (!product) throw new ProductNotFoundError(input.productId);

    const list = await this.prisma.stockMovement.findMany({
      where: { productId: input.productId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return list.map((item) => ({
      id: item.id,
      productId: item.productId,
      type: item.type,
      quantity: item.quantity,
      note: item.note,
      createdAt: item.createdAt,
    }));
  }
}
