import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { TechnicalSheetRepository } from '../../../domain/repositories/technical-sheet.repository.interface';
import type {
  ListTechnicalSheetsDto,
  ListTechnicalSheetsResult,
} from '../../dtos/technical-sheet.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 100;

@Injectable()
export class ListTechnicalSheetsUseCase implements IUseCase<
  ListTechnicalSheetsDto,
  ListTechnicalSheetsResult
> {
  constructor(
    private readonly technicalSheetRepository: TechnicalSheetRepository,
  ) {}

  async execute(
    input: ListTechnicalSheetsDto,
  ): Promise<ListTechnicalSheetsResult> {
    const perPage = Math.min(
      Math.max(input.perPage ?? DEFAULT_PER_PAGE, 1),
      MAX_PER_PAGE,
    );
    const criteria = {
      tab: input.tab ?? 'all',
      search: input.search?.trim() || undefined,
      category: input.category?.trim() || undefined,
      categories: input.categories?.length ? input.categories : undefined,
      productionTypes: input.productionTypes?.length
        ? input.productionTypes
        : undefined,
      sort: input.sort ?? 'name_asc',
    };

    const [total, tabCounts] = await Promise.all([
      this.technicalSheetRepository.count(input.organizationId, criteria),
      this.technicalSheetRepository.countByTabs(input.organizationId),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(Math.max(input.page ?? DEFAULT_PAGE, 1), totalPages);

    const items = await this.technicalSheetRepository.list(
      input.organizationId,
      {
        ...criteria,
        skip: (page - 1) * perPage,
        take: perPage,
      },
    );

    return { items, total, page, perPage, totalPages, tabCounts };
  }
}
