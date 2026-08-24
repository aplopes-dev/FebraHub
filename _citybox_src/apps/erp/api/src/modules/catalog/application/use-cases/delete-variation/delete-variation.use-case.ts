import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { VariationRepository } from '../../../domain/repositories/variation.repository.interface';
import { VariationNotFoundError } from '../../../domain/errors/variation-not-found.error';
import { VariationInUseError } from '../../../domain/errors/variation-in-use.error';
import type { DeleteVariationDto } from '../../dtos/variation.dto';

@Injectable()
export class DeleteVariationUseCase implements IUseCase<
  DeleteVariationDto,
  void
> {
  constructor(private readonly variationRepository: VariationRepository) {}

  async execute({ organizationId, id }: DeleteVariationDto): Promise<void> {
    const variation = await this.variationRepository.findById(
      organizationId,
      id,
    );
    if (!variation) throw new VariationNotFoundError(id);

    const productCount = await this.variationRepository.countProductsUsing(
      organizationId,
      id,
    );
    if (productCount > 0) {
      throw new VariationInUseError(variation.name, productCount);
    }

    await this.variationRepository.delete(organizationId, id);
  }
}
