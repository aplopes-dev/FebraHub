import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { UnitOfMeasure } from '../../../domain/entities/unit-of-measure.entity';
import { UnitOfMeasureRepository } from '../../../domain/repositories/unit-of-measure.repository.interface';
import { UnitOfMeasureAbbreviationTakenError } from '../../../domain/errors/unit-of-measure-abbreviation-taken.error';
import type { CreateUnitOfMeasureDto } from '../../dtos/unit-of-measure.dto';
import { clampDecimalPlaces } from '../../utils/clamp-decimal-places';

@Injectable()
export class CreateUnitOfMeasureUseCase implements IUseCase<
  CreateUnitOfMeasureDto,
  UnitOfMeasure
> {
  constructor(private readonly unitRepository: UnitOfMeasureRepository) {}

  async execute(input: CreateUnitOfMeasureDto): Promise<UnitOfMeasure> {
    const name = input.name.trim();
    const abbreviation = input.abbreviation.trim();

    const existing = await this.unitRepository.findByAbbreviation(
      input.organizationId,
      abbreviation,
    );
    if (existing) throw new UnitOfMeasureAbbreviationTakenError(abbreviation);

    const unit = UnitOfMeasure.create({
      organizationId: input.organizationId,
      name,
      abbreviation,
      kind: input.kind,
      decimalPlaces: clampDecimalPlaces(input.decimalPlaces),
      active: input.active ?? true,
    });

    return this.unitRepository.save(unit);
  }
}
