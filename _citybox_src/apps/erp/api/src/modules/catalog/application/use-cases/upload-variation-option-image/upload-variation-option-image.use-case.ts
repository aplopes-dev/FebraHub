import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../shared/domain/storage/object-storage.interface';
import type { Variation } from '../../../domain/entities/variation.entity';
import { VariationNotFoundError } from '../../../domain/errors/variation-not-found.error';
import { VariationOptionNotFoundError } from '../../../domain/errors/variation-option-not-found.error';
import { VariationRepository } from '../../../domain/repositories/variation.repository.interface';
import type { UploadVariationOptionImageDto } from '../../dtos/product.dto';
import { ErpObjectKeyPolicy } from '../../policies/erp-object-key.policy';
import { ImageFileValidator } from '../../validators/image-file.validator';

@Injectable()
export class UploadVariationOptionImageUseCase implements IUseCase<
  UploadVariationOptionImageDto,
  Variation
> {
  constructor(
    private readonly variationRepository: VariationRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(dto: UploadVariationOptionImageDto): Promise<Variation> {
    const mimeType = ImageFileValidator.validate(
      dto.buffer,
      dto.declaredMimeType,
    );

    const variation = await this.variationRepository.findById(
      dto.organizationId,
      dto.variationId,
    );
    if (!variation) throw new VariationNotFoundError(dto.variationId);

    const option = variation.findOption(dto.optionId);
    if (!option) throw new VariationOptionNotFoundError(dto.optionId);

    if (option.imageUrl) {
      await this.storage.delete(option.imageUrl);
    }

    const key = ErpObjectKeyPolicy.variationOptionImageKey(
      dto.organizationId,
      dto.variationId,
      dto.optionId,
      mimeType,
    );

    await this.storage.put({
      key,
      buffer: dto.buffer,
      mimeType,
    });

    const updated = variation.withOptionImage(dto.optionId, key);
    return this.variationRepository.save(updated);
  }
}
