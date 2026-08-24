import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { Variation } from '../../../domain/entities/variation.entity';
import { VariationRepository } from '../../../domain/repositories/variation.repository.interface';
import { VariationNotFoundError } from '../../../domain/errors/variation-not-found.error';
import type { UpdateVariationDto } from '../../dtos/variation.dto';
import { parseVariationPayload } from '../../utils/parse-variation-payload';

@Injectable()
export class UpdateVariationUseCase implements IUseCase<
  UpdateVariationDto,
  Variation
> {
  constructor(private readonly variationRepository: VariationRepository) {}

  async execute(input: UpdateVariationDto): Promise<Variation> {
    const existing = await this.variationRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!existing) throw new VariationNotFoundError(input.id);

    const parsed = parseVariationPayload(input);
    const updated = existing.update(parsed);

    return this.variationRepository.save(updated);
  }
}
