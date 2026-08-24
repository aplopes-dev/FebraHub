import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { UnitOfMeasure } from '../../../domain/entities/unit-of-measure.entity';
import { UnitOfMeasureRepository } from '../../../domain/repositories/unit-of-measure.repository.interface';
import { UnitOfMeasureNotFoundError } from '../../../domain/errors/unit-of-measure-not-found.error';
import { UnitOfMeasureAbbreviationTakenError } from '../../../domain/errors/unit-of-measure-abbreviation-taken.error';
import type { UpdateUnitOfMeasureDto } from '../../dtos/unit-of-measure.dto';
import { clampDecimalPlaces } from '../../utils/clamp-decimal-places';

@Injectable()
export class UpdateUnitOfMeasureUseCase implements IUseCase<
  UpdateUnitOfMeasureDto,
  UnitOfMeasure
> {
  constructor(private readonly unitRepository: UnitOfMeasureRepository) {}

  async execute(input: UpdateUnitOfMeasureDto): Promise<UnitOfMeasure> {
    const unit = await this.unitRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!unit) throw new UnitOfMeasureNotFoundError(input.id);

    const name = input.name.trim();
    const abbreviation = input.abbreviation.trim();

    const duplicate = await this.unitRepository.findByAbbreviation(
      input.organizationId,
      abbreviation,
    );
    if (duplicate && duplicate.id !== input.id) {
      throw new UnitOfMeasureAbbreviationTakenError(abbreviation);
    }

    const updated = unit.update({
      name,
      abbreviation,
      kind: input.kind,
      decimalPlaces: clampDecimalPlaces(input.decimalPlaces),
      active: input.active,
    });

    return this.unitRepository.save(updated);
  }
}
