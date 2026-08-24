import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { Variation } from '../../../domain/entities/variation.entity';
import { VariationRepository } from '../../../domain/repositories/variation.repository.interface';
import type { CreateVariationDto } from '../../dtos/variation.dto';
import { parseVariationPayload } from '../../utils/parse-variation-payload';

@Injectable()
export class CreateVariationUseCase implements IUseCase<
  CreateVariationDto,
  Variation
> {
  constructor(private readonly variationRepository: VariationRepository) {}

  async execute(input: CreateVariationDto): Promise<Variation> {
    const parsed = parseVariationPayload(input);

    const variation = Variation.create({
      organizationId: input.organizationId,
      name: parsed.name,
      calculation: parsed.calculation,
      options: parsed.options,
    });

    return this.variationRepository.save(variation);
  }
}
