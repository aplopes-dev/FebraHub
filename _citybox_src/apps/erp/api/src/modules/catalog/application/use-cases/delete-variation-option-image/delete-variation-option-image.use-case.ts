import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import type { Variation } from '../../../domain/entities/variation.entity';
import { VariationNotFoundError } from '../../../domain/errors/variation-not-found.error';
import { VariationOptionNotFoundError } from '../../../domain/errors/variation-option-not-found.error';
import { VariationRepository } from '../../../domain/repositories/variation.repository.interface';
import type { DeleteVariationOptionImageDto } from '../../dtos/product.dto';

@Injectable()
export class DeleteVariationOptionImageUseCase implements IUseCase<
  DeleteVariationOptionImageDto,
  Variation
> {
  constructor(
    private readonly variationRepository: VariationRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: DeleteVariationOptionImageDto): Promise<Variation> {
    const variation = await this.variationRepository.findById(
      dto.organizationId,
      dto.variationId,
    );
    if (!variation) throw new VariationNotFoundError(dto.variationId);

    const option = variation.findOption(dto.optionId);
    if (!option) throw new VariationOptionNotFoundError(dto.optionId);

    if (!option.imageUrl) {
      return variation;
    }

    await this.storage.delete(option.imageUrl);
    const updated = variation.withOptionImage(dto.optionId, null);
    return this.variationRepository.save(updated);
  }
}
