import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListReportOpenBudgetsUseCase } from '../../../../application/use-cases/list-report-open-budgets/list-report-open-budgets.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListReportOpenBudgetsQueryDto } from './list-report-open-budgets.query.dto';

@ApiTags('reports')
@Controller('v1/reports')
@RequirePermission('read', 'Dashboard')
export class ListReportOpenBudgetsRoute {
  constructor(
    private readonly listReportOpenBudgets: ListReportOpenBudgetsUseCase,
  ) {}

  @Get('open-budgets')
  @ApiOperation({
    summary: 'Relatório: orçamentos em aberto no período (por Budget.date)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListReportOpenBudgetsQueryDto,
  ) {
    const result = await this.listReportOpenBudgets.execute({
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
