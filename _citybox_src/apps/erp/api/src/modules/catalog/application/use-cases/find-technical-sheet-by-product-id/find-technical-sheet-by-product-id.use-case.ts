import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import { TechnicalSheetNotEligibleError } from '../../../domain/errors/technical-sheet-not-eligible.error';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import {
  TechnicalSheetRepository,
  type TechnicalSheetDetailView,
} from '../../../domain/repositories/technical-sheet.repository.interface';
import type { FindTechnicalSheetByProductIdDto } from '../../dtos/technical-sheet.dto';

@Injectable()
export class FindTechnicalSheetByProductIdUseCase implements IUseCase<
  FindTechnicalSheetByProductIdDto,
  TechnicalSheetDetailView
> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly technicalSheetRepository: TechnicalSheetRepository,
  ) {}

  async execute(
    input: FindTechnicalSheetByProductIdDto,
  ): Promise<TechnicalSheetDetailView> {
    const product = await this.productRepository.findById(
      input.organizationId,
      input.productId,
    );
    if (!product || product.deletedAt) {
      throw new ProductNotFoundError(input.productId);
    }
    if (product.type === 'supply') {
      throw new TechnicalSheetNotEligibleError(input.productId);
    }

    const detail = await this.technicalSheetRepository.findDetailByProductId(
      input.organizationId,
      input.productId,
    );
    if (!detail) {
      throw new ProductNotFoundError(input.productId);
    }

    return detail;
  }
}
