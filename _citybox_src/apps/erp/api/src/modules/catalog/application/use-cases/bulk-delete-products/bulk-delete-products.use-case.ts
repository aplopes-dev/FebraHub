import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';

export type BulkDeleteProductsDto = { organizationId: string; ids: string[] };

export type BulkDeleteProductsResult = { affected: number };

/**
 * Soft-delete em lote (a listagem tem seleção múltipla). Ids inexistentes ou
 * de outra loja são ignorados em silêncio — `affected` diz quantos mudaram.
 */
@Injectable()
export class BulkDeleteProductsUseCase implements IUseCase<
  BulkDeleteProductsDto,
  BulkDeleteProductsResult
> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute({
    organizationId,
    ids,
  }: BulkDeleteProductsDto): Promise<BulkDeleteProductsResult> {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return { affected: 0 };

    const affected = await this.productRepository.softDeleteMany(
      organizationId,
      uniqueIds,
    );
    return { affected };
  }
}
