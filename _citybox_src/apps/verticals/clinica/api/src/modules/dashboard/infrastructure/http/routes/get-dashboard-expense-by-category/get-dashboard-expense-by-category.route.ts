import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetDashboardExpenseByCategoryUseCase } from '../../../../application/use-cases/get-dashboard-expense-by-category/get-dashboard-expense-by-category.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { GetDashboardExpenseByCategoryQueryDto } from './get-dashboard-expense-by-category.query.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
@RequirePermission('read', 'Dashboard')
export class GetDashboardExpenseByCategoryRoute {
  constructor(
    private readonly getDashboardExpenseByCategory: GetDashboardExpenseByCategoryUseCase,
  ) {}

  @Get('expense-by-category')
  @ApiOperation({
    summary: 'Agregar despesas por categoria do dashboard',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: GetDashboardExpenseByCategoryQueryDto,
  ) {
    const result = await this.getDashboardExpenseByCategory.execute({
      storeId,
      periodMode: query.periodMode,
      year: query.year,
      month: query.month,
    });

    return { data: result };
  }
}
