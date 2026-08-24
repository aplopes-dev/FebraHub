import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListFinancialCategoriesUseCase } from '../../../../application/use-cases/list-financial-category/list-financial-categories.use-case';
import { RequireAnyPermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListFinancialCategoriesQueryDto } from './list-financial-categories.query.dto';
import { toFinancialCategoryResponse } from '../shared/financial-category.presenter';

@ApiTags('financial-categories')
@Controller('v1/financial/categories')
@RequireAnyPermission(
  { action: 'read', subject: 'Financial' },
  { action: 'read', subject: 'FinancialIncome' },
  { action: 'read', subject: 'FinancialExpense' },
  { action: 'read', subject: 'FinancialCategory' },
)
export class ListFinancialCategoriesRoute {
  constructor(
    private readonly listFinancialCategories: ListFinancialCategoriesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorias financeiras' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListFinancialCategoriesQueryDto,
  ) {
    const result = await this.listFinancialCategories.execute({
      storeId,
      kind: query.kind,
    });
    return { data: result.items.map(toFinancialCategoryResponse) };
  }
}
