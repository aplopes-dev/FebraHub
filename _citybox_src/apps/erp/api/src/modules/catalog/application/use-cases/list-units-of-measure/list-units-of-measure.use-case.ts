import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { UnitOfMeasure } from '../../../domain/entities/unit-of-measure.entity';
import type {
  ListUnitsOfMeasureDto,
  ListUnitsOfMeasureResult,
} from '../../dtos/unit-of-measure.dto';
import { UnitOfMeasureRepository } from '../../../domain/repositories/unit-of-measure.repository.interface';

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 100;

@Injectable()
export class ListUnitsOfMeasureUseCase implements IUseCase<
  ListUnitsOfMeasureDto,
  ListUnitsOfMeasureResult | UnitOfMeasure[]
> {
  constructor(private readonly unitRepository: UnitOfMeasureRepository) {}

  async execute(
    input: ListUnitsOfMeasureDto,
  ): Promise<ListUnitsOfMeasureResult | UnitOfMeasure[]> {
    const paginated = input.page !== undefined || input.perPage !== undefined;

    if (!paginated) {
      return this.unitRepository.findAll(input.organizationId, {
        activeOnly: input.activeOnly,
        search: input.search,
      });
    }

    const perPage = Math.min(
      Math.max(input.perPage ?? DEFAULT_PER_PAGE, 1),
      MAX_PER_PAGE,
    );
    const total = await this.unitRepository.count(input.organizationId, {
      activeOnly: input.activeOnly,
      search: input.search,
    });
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(Math.max(input.page ?? DEFAULT_PAGE, 1), totalPages);
    const skip = (page - 1) * perPage;

    const items = await this.unitRepository.findAll(input.organizationId, {
      activeOnly: input.activeOnly,
      search: input.search,
      skip,
      take: perPage,
    });

    return { items, total, page, perPage, totalPages };
  }
}
