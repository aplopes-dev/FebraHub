import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { Variation } from '../../../domain/entities/variation.entity';
import { VariationRepository } from '../../../domain/repositories/variation.repository.interface';
import { VariationNotFoundError } from '../../../domain/errors/variation-not-found.error';
import type { FindVariationDto } from '../../dtos/variation.dto';

@Injectable()
export class FindVariationByIdUseCase implements IUseCase<
  FindVariationDto,
  Variation
> {
  constructor(private readonly variationRepository: VariationRepository) {}

  async execute(input: FindVariationDto): Promise<Variation> {
    const variation = await this.variationRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!variation) throw new VariationNotFoundError(input.id);
    return variation;
  }
}
