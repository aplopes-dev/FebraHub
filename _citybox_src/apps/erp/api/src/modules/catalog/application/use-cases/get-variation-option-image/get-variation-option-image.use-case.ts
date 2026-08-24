import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import { VariationNotFoundError } from '../../../domain/errors/variation-not-found.error';
import { VariationOptionNotFoundError } from '../../../domain/errors/variation-option-not-found.error';
import { VariationRepository } from '../../../domain/repositories/variation.repository.interface';
import type { GetVariationOptionImageDto } from '../../dtos/product.dto';

@Injectable()
export class GetVariationOptionImageUseCase implements IUseCase<
  GetVariationOptionImageDto,
  { buffer: Buffer; mimeType: string }
> {
  constructor(
    private readonly variationRepository: VariationRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    dto: GetVariationOptionImageDto,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const variation = await this.variationRepository.findById(
      dto.organizationId,
      dto.variationId,
    );
    if (!variation) throw new VariationNotFoundError(dto.variationId);

    const option = variation.findOption(dto.optionId);
    if (!option) throw new VariationOptionNotFoundError(dto.optionId);
    if (!option.imageUrl) {
      throw new VariationOptionNotFoundError(dto.optionId);
    }

    const stored = await this.storage.get(option.imageUrl);
    return { buffer: stored.buffer, mimeType: stored.mimeType };
  }
}
