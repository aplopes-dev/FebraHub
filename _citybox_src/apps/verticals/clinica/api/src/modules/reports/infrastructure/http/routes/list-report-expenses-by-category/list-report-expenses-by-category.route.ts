import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListReportExpensesByCategoryUseCase } from '../../../../application/use-cases/list-report-expenses-by-category/list-report-expenses-by-category.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListReportExpensesByCategoryQueryDto } from './list-report-expenses-by-category.query.dto';

@ApiTags('reports')
@Controller('v1/reports')
@RequirePermission('read', 'Dashboard')
export class ListReportExpensesByCategoryRoute {
  constructor(
    private readonly listReportExpensesByCategory: ListReportExpensesByCategoryUseCase,
  ) {}

  @Get('expenses-by-category')
  @ApiOperation({
    summary: 'Relatório: despesas pagas agregadas por categoria',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListReportExpensesByCategoryQueryDto,
  ) {
    const result = await this.listReportExpensesByCategory.execute({
      storeId,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      perPage: query.perPage,
    });

    return {
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
